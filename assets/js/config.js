/**
 * config.js  —  AEW Platform  —  Application Configuration
 * ─────────────────────────────────────────────────────────
 * LOAD ORDER: 1 of 8
 *
 * Detects the project base URL by reading this script's own resolved
 * src attribute. The browser always resolves src to an absolute URL
 * before exposing it, so this works correctly regardless of:
 *   • VS Code Live Server workspace root (project folder or parent)
 *   • Cloudflare Pages deployment domain
 *   • URL depth of the page that loaded this script
 *
 * Detection:
 *   src = "http://host/assets/js/config.js"
 *   strip "/assets/js/config.js"
 *   base = "http://host/"
 */
(function () {
  'use strict';

  window.AEW = window.AEW || {};

  /* ── Detect absolute project base URL ──────────────────────────── */
  var base   = '';
  var marker = '/assets/js/config.js';

  var scripts = document.getElementsByTagName('script');
  for (var i = 0; i < scripts.length; i++) {
    var src = scripts[i].src || '';
    var idx = src.lastIndexOf(marker);
    if (idx !== -1) {
      base = src.slice(0, idx + 1);   /* +1 keeps the trailing slash */
      break;
    }
  }

  /* Build identifier. Also appended as ?v= to every module <script>,
     which forces the browser to fetch fresh files instead of serving a
     cached copy from a previous build. If the console banner below does
     not show the expected build, the browser is running stale code. */
  var BUILD = '2026.08.14-1';

  /* ── Supabase project credentials ─────────────────────────────── */
  var SUPABASE_URL      = 'https://qqtctmrdawjcwnqszplx.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_F1-H70gx1WmU9rQsIEJ-CQ_CQnm4gnD';

  /* ── Public configuration ──────────────────────────────────────── */
  window.AEW.config = {
    SUPABASE_URL:      SUPABASE_URL,
    SUPABASE_ANON_KEY: SUPABASE_ANON_KEY,
    BASE:              base,
    BUILD:             BUILD,

    /** Every route is an absolute URL derived from the detected base */
    ROUTES: {
      login:     base + 'login.html',
      dashboard: base + 'dashboard.html',
      reset:     base + 'reset-password.html',
      products: {
        costing:   base + 'products/costing/index.html',
        cbam:      base + 'products/cbam/index.html',
        vibration: base + 'products/vibration/index.html',
        asset:     base + 'products/asset/index.html',
      },
    },

    /** True only when opened via file:// (offline developer preview) */
    IS_FILE: (window.location.protocol === 'file:'),
  };

  /* Startup banner — makes the running build and detected base visible
     without opening any tooling. */
  console.log(
    '%c AEW ', 'background:#059669;color:#fff;font-weight:700;border-radius:3px',
    'build ' + BUILD + '  ·  base ' + (base || '(not detected)')
  );

}());
