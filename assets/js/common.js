/**
 * common.js  —  AEW Platform  —  Shared Utilities
 * ──────────────────────────────────────────────────
 * LOAD ORDER: 8 of 8
 *
 * Pure helper functions. No side effects, no DOM, no auth, no network.
 */
(function () {
  'use strict';

  window.AEW = window.AEW || {};

  window.AEW.utils = {

    /** Format a number as Indian Rupees (e.g. ₹1,23,456) */
    formatINR: function (n) {
      return '\u20B9' + Number(n || 0).toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    },

    /** Format a Date as "25 Jul 2026" */
    formatDate: function (d) {
      return new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
      });
    },

    /** Debounce: delay repeated calls */
    debounce: function (fn, ms) {
      var t;
      return function () {
        var a = arguments, c = this;
        clearTimeout(t);
        t = setTimeout(function () { fn.apply(c, a); }, ms || 300);
      };
    },

  };

}());
