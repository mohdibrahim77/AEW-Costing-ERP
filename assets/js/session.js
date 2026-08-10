/**
 * session.js  —  AEW Platform  —  Session State Manager
 * ───────────────────────────────────────────────────────
 * LOAD ORDER: 3 of 8
 *
 * Owns all authentication state. Registers the one and only
 * onAuthStateChange() listener. EMITS events — never navigates.
 *
 * ── WHY INITIAL_SESSION, NOT getSession() ──
 * getSession() can return null while a token refresh is in flight.
 * That is an UNKNOWN state, and earlier builds misread it as ANONYMOUS,
 * producing login → ERP → login loops. INITIAL_SESSION fires exactly
 * once, AFTER any pending refresh settles, with the definitive answer.
 *
 * ── WHY WE PURGE STORAGE ON SIGNED_OUT ──  [fixes the reported loop]
 * When a refresh token is rejected, the SDK fires SIGNED_OUT and then
 * clears its own storage asynchronously. If we navigate immediately on
 * that event, navigation wins the race and the next page still finds
 * the dead session in localStorage — so it routes back, and loops.
 * We therefore purge synchronously BEFORE notifying subscribers.
 */
(function () {
  'use strict';

  window.AEW = window.AEW || {};

  var STATE = {
    UNKNOWN:       'UNKNOWN',
    AUTHENTICATED: 'AUTHENTICATED',
    ANONYMOUS:     'ANONYMOUS',
    TERMINATING:   'TERMINATING'
  };

  var _state      = STATE.UNKNOWN;
  var _started    = false;   /* listener registered this page load?  */
  var _session    = null;    /* cached session, null when anonymous  */
  var _readyCbs   = [];      /* awaiting INITIAL_SESSION             */
  var _signoutCbs = [];      /* notified on session destruction      */
  var _watchdog   = null;

  /* Access-token staleness tolerance. INITIAL_SESSION fires after the
     SDK has attempted refresh, so a token stale beyond this window
     means the refresh did not succeed and the session is dead.
     Generous, to make a false logout effectively impossible. */
  var STALE_GRACE_MS = 5 * 60 * 1000;

  /**
   * _purgeStorage()
   * Synchronously removes every Supabase key from browser storage.
   * Supabase namespaces its keys with an "sb-" prefix.
   * Safe in private-browsing mode, where storage access can throw.
   */
  function _purgeStorage() {
    try {
      var doomed = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf('sb-') === 0) doomed.push(k);
      }
      doomed.forEach(function (k) { localStorage.removeItem(k); });
      return doomed.length;
    } catch (e) {
      console.warn('[AEW:session] storage purge unavailable:', e);
      return 0;
    }
  }

  /**
   * _isLive(session)
   * A session object can exist in storage yet be dead. Treat a session
   * whose access token expired well beyond the grace window as dead,
   * so we never route a user on a session that cannot be refreshed.
   */
  function _isLive(session) {
    if (!session) return false;
    if (!session.expires_at) return true;          /* no expiry info — trust */
    var expiredForMs = Date.now() - (session.expires_at * 1000);
    return expiredForMs < STALE_GRACE_MS;
  }

  /** Resolve the UNKNOWN state exactly once and notify all waiters. */
  function _resolve(session) {
    if (_state !== STATE.UNKNOWN) return;          /* resolve-once */
    if (_watchdog) { clearTimeout(_watchdog); _watchdog = null; }

    var live = _isLive(session);
    if (session && !live) {
      console.warn('[AEW:session] stored session is expired beyond grace — discarding.');
      _purgeStorage();
    }

    _session = live ? session : null;
    _state   = _session ? STATE.AUTHENTICATED : STATE.ANONYMOUS;

    var cbs = _readyCbs.splice(0);
    cbs.forEach(function (cb) {
      try { cb(_session); }
      catch (e) { console.error('[AEW:session] onReady threw:', e); }
    });
  }

  window.AEW.session = {

    STATE: STATE,

    /**
     * init(onReady, onSignOut?)
     * onReady(session)  fires exactly once with the session, or null.
     * onSignOut()       fires if the session is destroyed later.
     *                   Omit on public pages — see auth.js.
     */
    init: function (onReady, onSignOut) {

      if (onSignOut) _signoutCbs.push(onSignOut);

      /* Late subscriber — deliver the cached result asynchronously so
         both the fast and slow paths behave identically for callers. */
      if (_state !== STATE.UNKNOWN) {
        if (onReady) {
          var cached = _session;
          setTimeout(function () { onReady(cached); }, 0);
        }
        return;
      }

      if (onReady) _readyCbs.push(onReady);
      if (_started) return;
      _started = true;

      var sb = window.AEW.supabase;
      if (!sb) {
        console.error('[AEW:session] Supabase client unavailable — failing closed.');
        _resolve(null);
        return;
      }

      /* Watchdog: guarantees departure from UNKNOWN. Fails closed. */
      _watchdog = setTimeout(function () {
        console.warn('[AEW:session] INITIAL_SESSION watchdog fired at 10s.');
        _resolve(null);
      }, 10000);

      /* ── THE ONE AND ONLY onAuthStateChange() IN THE PROJECT ── */
      sb.auth.onAuthStateChange(function (event, session) {

        if (event === 'INITIAL_SESSION') {
          _resolve(session);

        } else if (event === 'SIGNED_OUT') {
          /* Deliberate logout already handled everything — stand down. */
          if (_state === STATE.TERMINATING) return;

          /* Purge BEFORE notifying. Subscribers navigate synchronously;
             if storage still held the dead session the next page would
             route straight back here. This ordering breaks the loop. */
          _purgeStorage();
          _session = null;
          _state   = STATE.ANONYMOUS;

          _signoutCbs.slice().forEach(function (cb) {
            try { cb(); }
            catch (e) { console.error('[AEW:session] onSignOut threw:', e); }
          });

        } else if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          /* Silent cache update. Never a state transition, never a
             navigation — routine refresh must not move the user. */
          if (session) _session = session;
        }

        /* SIGNED_IN intentionally ignored: login.html routes explicitly
           after signInWithPassword() resolves. Acting here as well would
           create a second navigation owner. */
      });
    },

    getState:   function () { return _state; },
    getSession: function () { return _session; },

    /**
     * beginTermination()
     * Called by auth.logout() only. Moves to TERMINATING so the
     * SIGNED_OUT handler stands down, leaving logout() as the single
     * owner of the navigation.
     */
    beginTermination: function () {
      _state   = STATE.TERMINATING;
      _session = null;
    },

    purge: _purgeStorage,

  };

}());
