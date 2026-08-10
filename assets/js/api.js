/**
 * api.js  —  AEW Platform  —  Backend API Client
 * ─────────────────────────────────────────────────
 * LOAD ORDER: 7 of 8
 *
 * Talks to the AEW API (FastAPI on Railway) for anything that must
 * outlive the browser tab — saving costings, listing history, reopening
 * a past quotation.
 *
 * The costing calculations stay in the browser. This module only moves
 * results in and out.
 *
 * AUTHENTICATION
 * Every request carries the signed-in user's Supabase access token. The
 * token is read from the live session at call time rather than cached,
 * so a refresh mid-session is picked up automatically.
 *
 * DEGRADED MODE
 * If BASE_URL is empty, or the API is unreachable, every method
 * resolves with { ok:false, offline:true }. The ERP continues to work —
 * it simply cannot save. That matters for a customer demonstration on
 * an unreliable connection: the tool must never break because a server
 * is down.
 */
(function () {
  'use strict';

  window.AEW = window.AEW || {};

  /* ── Where the API lives ─────────────────────────────────────────
     Set this to your Railway URL after deploying, e.g.
        'https://aew-api-production.up.railway.app'
     Leave empty to run the ERP without persistence. */
  var BASE_URL = '';

  var TIMEOUT_MS = 15000;

  /** Read the current access token from the Supabase session. */
  function currentToken() {
    var sb = window.AEW.supabase;
    if (!sb || !sb.auth) return Promise.resolve(null);
    return sb.auth.getSession()
      .then(function (r) {
        return (r && r.data && r.data.session) ? r.data.session.access_token : null;
      })
      .catch(function () { return null; });
  }

  /**
   * call(method, path, body)
   * Returns a Promise that always resolves — never rejects — with:
   *     { ok: true,  data }
   *     { ok: false, error, status, offline? }
   * so callers never need a try/catch and a failure cannot take the
   * page down.
   */
  function call(method, path, body) {
    if (!BASE_URL) {
      return Promise.resolve({
        ok: false, offline: true,
        error: 'Saving is not configured yet. Costings work normally but are not stored.'
      });
    }

    return currentToken().then(function (token) {
      if (!token) {
        return { ok: false, status: 401, error: 'Your session has expired. Sign in again.' };
      }

      var controller = new AbortController();
      var timer = setTimeout(function () { controller.abort(); }, TIMEOUT_MS);

      var options = {
        method: method,
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      };
      if (body !== undefined) options.body = JSON.stringify(body);

      return fetch(BASE_URL + path, options)
        .then(function (response) {
          clearTimeout(timer);

          if (response.status === 204) return { ok: true, data: null };

          return response.json().catch(function () { return {}; })
            .then(function (payload) {
              if (response.ok) return { ok: true, data: payload };

              var err = (payload && payload.error) || {};
              var message = err.message || 'The request failed.';

              /* Surface field-level validation problems in a form the
                 UI can show next to the offending input. */
              if (err.details && err.details.length) {
                message += ' ' + err.details
                  .map(function (d) { return d.field + ': ' + d.problem; })
                  .join('; ');
              }
              return {
                ok: false,
                status: response.status,
                code: err.code,
                error: message,
                reference: err.reference
              };
            });
        })
        .catch(function (e) {
          clearTimeout(timer);
          var aborted = (e && e.name === 'AbortError');
          console.warn('[AEW:api] ' + method + ' ' + path + ' failed:', e);
          return {
            ok: false, offline: true,
            error: aborted
              ? 'The server took too long to respond. Your costing is safe on screen.'
              : 'Could not reach the server. Your costing is safe on screen.'
          };
        });
    });
  }

  window.AEW.api = {

    /** True when a backend is configured. */
    isConfigured: function () { return !!BASE_URL; },

    /** Point the client at a deployed API (used by tests and setup). */
    setBaseUrl: function (url) { BASE_URL = (url || '').replace(/\/+$/, ''); },

    /** Current API base, for diagnostics. */
    baseUrl: function () { return BASE_URL; },

    /** Save a completed costing. Resolves { ok, data } with the new id. */
    saveQuotation: function (quotation) {
      return call('POST', '/api/quotations', quotation);
    },

    /**
     * List saved costings, newest first.
     * opts: { limit, offset, search, status, mineOnly }
     */
    listQuotations: function (opts) {
      opts = opts || {};
      var q = [];
      q.push('limit=' + (opts.limit || 20));
      q.push('offset=' + (opts.offset || 0));
      if (opts.search)   q.push('search=' + encodeURIComponent(opts.search));
      if (opts.status)   q.push('status=' + encodeURIComponent(opts.status));
      if (opts.mineOnly) q.push('mine_only=true');
      return call('GET', '/api/quotations?' + q.join('&'));
    },

    /** Retrieve one costing in full, including the snapshot. */
    getQuotation: function (id) {
      return call('GET', '/api/quotations/' + encodeURIComponent(id));
    },

    /** Update a costing. Send only the fields that changed. */
    updateQuotation: function (id, changes) {
      return call('PATCH', '/api/quotations/' + encodeURIComponent(id), changes);
    },

    /** Delete a costing permanently. */
    deleteQuotation: function (id) {
      return call('DELETE', '/api/quotations/' + encodeURIComponent(id));
    },

    /** Headline numbers for the dashboard. */
    stats: function () {
      return call('GET', '/api/quotations/stats/summary');
    },

    /** The signed-in user's role, company and entitlements. */
    me: function () {
      return call('GET', '/api/me');
    },

    /** Is the API reachable? Used by diagnostics, never blocks the UI. */
    ping: function () {
      if (!BASE_URL) return Promise.resolve({ ok: false, offline: true });
      return fetch(BASE_URL + '/health')
        .then(function (r) { return { ok: r.ok, status: r.status }; })
        .catch(function () { return { ok: false, offline: true }; });
    }

  };

}());
