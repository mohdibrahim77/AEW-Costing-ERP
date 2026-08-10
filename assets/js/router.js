/**
 * router.js  —  AEW Platform  —  Application Router
 * ───────────────────────────────────────────────────
 * LOAD ORDER: 4 of 8
 *
 * The sole mutator of window.location. Nothing else navigates.
 *
 * ── THREE INDEPENDENT LOOP GUARDS ──
 *   G1  Commit latch    at most one navigation per page load
 *   G2  Identity check  never navigate to the page already displayed
 *   G3  Circuit breaker halt after N navigations inside a time window
 *
 * G1 and G2 make loops impossible by construction. G3 exists because
 * this project has looped before: if a future change defeats G1 or G2,
 * G3 converts an unusable browser into a visible, diagnosable error.
 */
(function () {
  'use strict';

  window.AEW = window.AEW || {};

  var _navigating = false;          /* G1 — commit latch          */

  var NAV_LOG_KEY = 'aew_nav_log';  /* G3 — persists across loads */
  var NAV_BUDGET  = 4;              /* navigations…               */
  var NAV_WINDOW  = 6000;           /* …allowed within 6 seconds  */

  /**
   * _withinBudget()
   * Records this navigation and reports whether the budget is intact.
   * Uses sessionStorage so the count survives page loads — a redirect
   * loop spans loads, so an in-memory counter could never detect it.
   */
  function _withinBudget() {
    try {
      var now = Date.now();
      var log = JSON.parse(sessionStorage.getItem(NAV_LOG_KEY) || '[]');
      log = log.filter(function (t) { return (now - t) < NAV_WINDOW; });
      log.push(now);
      sessionStorage.setItem(NAV_LOG_KEY, JSON.stringify(log));
      return log.length <= NAV_BUDGET;
    } catch (e) {
      return true;   /* storage unavailable — never block navigation */
    }
  }

  /** Clear the navigation log. Called when a page settles successfully. */
  function _clearBudget() {
    try { sessionStorage.removeItem(NAV_LOG_KEY); } catch (e) { /* ignore */ }
  }

  /**
   * _halt(url)
   * G3 tripped. Stop navigating and make the failure visible rather
   * than letting the browser thrash invisibly.
   */
  function _halt(url) {
    _clearBudget();
    console.error(
      '[AEW:router] CIRCUIT BREAKER TRIPPED\n' +
      '  ' + NAV_BUDGET + '+ navigations in ' + (NAV_WINDOW / 1000) + 's — halted to prevent a loop.\n' +
      '  Blocked destination : ' + url + '\n' +
      '  Current page        : ' + window.location.href + '\n' +
      '  Session state       : ' + (window.AEW.session ? window.AEW.session.getState() : 'n/a') + '\n' +
      '  Recovery            : run  AEW.auth.hardReset()  in this console.'
    );

    try {
      var bar = document.createElement('div');
      bar.setAttribute('role', 'alert');
      bar.style.cssText =
        'position:fixed;inset:0 0 auto 0;z-index:2147483647;' +
        'background:#7f1d1d;color:#fff;padding:14px 18px;' +
        'font:14px/1.5 system-ui,sans-serif;text-align:center';
      bar.innerHTML =
        '<strong>Sign-in loop detected and stopped.</strong> ' +
        'Your saved session is invalid. ' +
        '<button id="aew-reset-btn" style="margin-left:10px;padding:5px 12px;' +
        'border:0;border-radius:6px;background:#fff;color:#7f1d1d;' +
        'font-weight:700;cursor:pointer;font-family:inherit">Clear it and sign in</button>';
      var attach = function () {
        document.body.appendChild(bar);
        var b = document.getElementById('aew-reset-btn');
        if (b) b.addEventListener('click', function () {
          if (window.AEW.auth) window.AEW.auth.hardReset();
        });
      };
      if (document.body) attach();
      else document.addEventListener('DOMContentLoaded', attach);
    } catch (e) { /* console message already emitted */ }
  }

  window.AEW.router = {

    /** The single point of navigation for the entire application. */
    goto: function (url) {
      if (_navigating) return;                              /* G1 */
      if (!url) return;

      var curr = window.location.href.split(/[?#]/)[0];
      var dest = url.split(/[?#]/)[0];
      if (curr === dest) return;                            /* G2 */

      if (!_withinBudget()) { _halt(url); return; }         /* G3 */

      _navigating = true;
      window.location.replace(url);
    },

    gotoLogin:     function () { this.goto(window.AEW.config.ROUTES.login); },
    gotoDashboard: function () { this.goto(window.AEW.config.ROUTES.dashboard); },

    /** Resolve a user's entitlements to a destination, then navigate. */
    routeUser: function (user) {
      var meta  = (user && user.user_metadata) || {};
      var prods = meta.products || ['costing'];
      var role  = meta.role     || 'viewer';
      var r     = window.AEW.config.ROUTES;

      var dest = (role === 'admin' || prods.length > 1)
        ? r.dashboard
        : (r.products[prods[0]] || r.dashboard);

      this.goto(dest);
    },

    /**
     * settled()
     * Called by a page that has rendered successfully. Clears the
     * navigation log so ordinary browsing never approaches the budget.
     */
    settled: _clearBudget,

    isCurrent: function (url) {
      return window.location.href.split(/[?#]/)[0] === (url || '').split(/[?#]/)[0];
    },

  };

}());
