/**
 * auth.js  —  AEW Platform  —  Authentication
 * ─────────────────────────────────────────────
 * LOAD ORDER: 5 of 8
 *
 * The composition root: the only module that knows what a session
 * event MEANS. It wires session.js (state) to router.js (navigation).
 * session.js emits; auth.js decides; router.js moves. One owner each.
 *
 * Public API (window.AEW.auth):
 *   requireAuth(cb)         guard a protected page
 *   checkExistingSession()  login page only
 *   login(email, password)  → Promise<{data, error}>
 *   logout()                sign out and return to login
 *   sendPasswordReset(email)
 *   updatePassword(pw)
 *   hardReset()             recovery — wipe everything, go to login
 *   debug()                 print diagnostics to the console
 */
(function () {
  'use strict';

  window.AEW = window.AEW || {};

  /* Offline preview user, used only under the file:// protocol */
  var DEV_USER = {
    id: 'dev', email: 'dev@aew.in',
    user_metadata: {
      name: 'Dev User', company: 'AEW Dev', role: 'admin',
      products: ['costing'], avatar: 'D', color: '#059669'
    }
  };

  window.AEW.auth = {

    /**
     * requireAuth(callback)
     * Protected-page contract. Call from DOMContentLoaded.
     * Never call on login.html.
     *
     *   session valid  → router.settled(), then callback(user)
     *   no session     → router.gotoLogin(), exactly once
     *   file://        → callback(DEV_USER)
     */
    requireAuth: function (callback) {
      if (window.AEW.config.IS_FILE) {
        if (callback) callback(DEV_USER);
        return;
      }

      window.AEW.session.init(
        function onReady(session) {
          if (!session) { window.AEW.router.gotoLogin(); return; }

          /* Page reached authenticated content — the navigation
             sequence completed normally, so reset the loop budget. */
          window.AEW.router.settled();

          if (callback) {
            try { callback(session.user); }
            catch (e) { console.error('[AEW:auth] page boot threw:', e); }
          }
        },
        function onSignOut() {
          window.AEW.router.gotoLogin();
        }
      );
    },

    /**
     * checkExistingSession()
     * Login-page contract.
     *
     * DR-1 (REVISED — owner decision, 29 Jul 2026):
     * The sign-in form is ALWAYS shown. Landing on this page NEVER
     * navigates away, even when a valid session already exists.
     * The user must enter an email and password and submit to proceed.
     *
     * Rationale: the owner wants credentials entered explicitly every
     * time the login page is opened. Auto-redirect is the common SaaS
     * pattern, but it removes the ability to reach the form at all,
     * and made a broken Sign In button invisible for weeks.
     *
     * We still resolve session state, because doing so purges a dead
     * session from storage — but the result never causes navigation.
     *
     * Session persistence is unaffected: refreshing the dashboard or
     * the ERP keeps you signed in. Only this page ignores the session.
     *
     * Deliberately does NOT subscribe to sign-out. A public page must
     * never react to a session event: a redirect loop needs two
     * participants, and this asymmetry denies it one.
     */
    checkExistingSession: function () {
      if (window.AEW.config.IS_FILE) return;

      window.AEW.session.init(function onReady(session) {
        window.AEW.router.settled();
        if (session && session.user) {
          console.info(
            '[AEW:auth] An active session exists for ' + session.user.email +
            '. The sign-in form is shown by policy — enter credentials to continue.'
          );
        }
        /* No navigation. Ever. This is the whole point. */
      });
    },

    /**
     * login(email, password)
     * Resolves to { data, error }. Never navigates — the page decides.
     */
    login: function (email, password) {
      var sb = window.AEW.supabase;
      if (!sb) {
        return Promise.resolve({ data: null, error: new Error('Supabase client unavailable') });
      }
      return sb.auth.signInWithPassword({ email: email, password: password })
        .catch(function (err) {
          console.error('[AEW:auth] login failed:', err);
          return { data: null, error: err };
        });
    },

    /**
     * logout()
     * Four steps. Steps 1, 2 and 4 are synchronous, so logout cannot
     * fail — not on a dead network, not if Supabase is unreachable.
     */
    logout: function () {
      /* 1 — become the sole navigation owner; the SIGNED_OUT handler
             will now stand down rather than navigate in parallel */
      window.AEW.session.beginTermination();

      /* 2 — purge local session material synchronously, so the login
             page loaded next cannot possibly find a session */
      window.AEW.session.purge();

      /* 3 — revoke server-side. Fire and forget: never awaited, so a
             network failure cannot strand the user on this page */
      try {
        var sb = window.AEW.supabase;
        if (sb && sb.auth) {
          sb.auth.signOut().catch(function (e) {
            console.warn('[AEW:auth] signOut rejected — session already cleared locally:', e);
          });
        }
      } catch (e) {
        console.warn('[AEW:auth] signOut threw:', e);
      }

      /* 4 — navigate. Budget is cleared first: a deliberate logout is a
             legitimate navigation and must never trip the breaker. */
      window.AEW.router.settled();
      window.AEW.router.gotoLogin();
    },

    sendPasswordReset: function (email) {
      var sb = window.AEW.supabase;
      if (!sb) return Promise.resolve({ error: new Error('Supabase client unavailable') });
      return sb.auth.resetPasswordForEmail(email, {
        redirectTo: window.AEW.config.ROUTES.reset
      }).catch(function (err) {
        console.error('[AEW:auth] password reset failed:', err);
        return { data: null, error: err };
      });
    },

    updatePassword: function (newPassword) {
      var sb = window.AEW.supabase;
      if (!sb) return Promise.resolve({ error: new Error('Supabase client unavailable') });
      return sb.auth.updateUser({ password: newPassword })
        .catch(function (err) {
          console.error('[AEW:auth] password update failed:', err);
          return { data: null, error: err };
        });
    },

    /**
     * hardReset()
     * Recovery. Wipes every trace of session state and returns to the
     * login form. Run from the console if anything ever gets stuck:
     *     AEW.auth.hardReset()
     *
     * SANCTIONED EXCEPTION TO INV-6: this is the only code outside
     * router.js permitted to write window.location. It must bypass the
     * router, because it exists precisely for the case where the
     * router's own guards have latched and refuse to navigate.
     * Do not "fix" this by routing it through router.goto().
     */
    hardReset: function () {
      try { localStorage.clear(); }   catch (e) { /* ignore */ }
      try { sessionStorage.clear(); } catch (e) { /* ignore */ }
      window.location.replace(window.AEW.config.ROUTES.login + '?force=1');
    },

    /**
     * debug()
     * Prints the full auth picture. Run in the console and send me the
     * output if behaviour is ever unexpected:
     *     AEW.auth.debug()
     */
    debug: function () {
      var keys = [];
      try {
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k && k.indexOf('sb-') === 0) keys.push(k);
        }
      } catch (e) { keys = ['<storage unavailable>']; }

      var s = window.AEW.session ? window.AEW.session.getSession() : null;
      var navLog = '[]';
      try { navLog = sessionStorage.getItem('aew_nav_log') || '[]'; } catch (e) { /* ignore */ }

      console.log(
        '─── AEW diagnostics ───────────────────────────────\n' +
        ' page          : ' + window.location.href + '\n' +
        ' detected base : ' + window.AEW.config.BASE + '\n' +
        ' login route   : ' + window.AEW.config.ROUTES.login + '\n' +
        ' SDK loaded    : ' + (!!window.supabase) + '\n' +
        ' client ready  : ' + (!!window.AEW.supabase) + '\n' +
        ' session state : ' + (window.AEW.session ? window.AEW.session.getState() : 'n/a') + '\n' +
        ' user          : ' + (s && s.user ? s.user.email : 'none') + '\n' +
        ' token expires : ' + (s && s.expires_at ? new Date(s.expires_at * 1000).toISOString() : 'n/a') + '\n' +
        ' storage keys  : ' + (keys.length ? keys.join(', ') : 'none') + '\n' +
        ' nav log       : ' + navLog + '\n' +
        '───────────────────────────────────────────────────'
      );
    }

  };

}());
