/**
 * ui.js  —  AEW Platform  —  UI Helpers
 * ───────────────────────────────────────
 * LOAD ORDER: 6 of 8
 *
 * Shared DOM utilities. No auth, no routing, no business logic.
 */
(function () {
  'use strict';

  window.AEW = window.AEW || {};

  window.AEW.ui = {

    setText: function (id, text) {
      var el = document.getElementById(id);
      if (el) el.textContent = text;
    },

    setStyle: function (id, prop, val) {
      var el = document.getElementById(id);
      if (el) el.style[prop] = val;
    },

    show: function (id, display) {
      var el = document.getElementById(id);
      if (el) el.style.display = display || 'block';
    },

    hide: function (id) {
      var el = document.getElementById(id);
      if (el) el.style.display = 'none';
    },

    /** Toggle button between normal and loading state */
    setLoading: function (btnId, spinnerId, textId, loading, normalText) {
      var btn = document.getElementById(btnId);
      var sp  = document.getElementById(spinnerId);
      var txt = document.getElementById(textId);
      if (!btn) return;
      btn.disabled = loading;
      btn.classList.toggle('loading', loading);
      if (sp)  sp.style.display = loading ? 'block' : 'none';
      if (txt) txt.textContent  = loading ? 'Please wait...' : (normalText || 'Submit');
    },

    markFieldError: function (id) {
      var el = document.getElementById(id);
      if (el) el.classList.add('ferr');
    },

    clearFieldErrors: function () {
      document.querySelectorAll('.ferr').forEach(function (el) {
        el.classList.remove('ferr');
      });
    },

  };

}());
