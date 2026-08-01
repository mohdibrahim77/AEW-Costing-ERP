/**
 * api.js  —  AEW Platform  —  Backend API Client
 * ─────────────────────────────────────────────────
 * LOAD ORDER: 7 of 8
 *
 * Handles calls to the AEW FastAPI backend (Railway).
 * Stubs now — will be populated when backend is deployed.
 */
(function () {
  'use strict';

  window.AEW = window.AEW || {};

  window.AEW.api = {

    /** Save a costing quotation to the backend */
    saveQuotation: function (data) {
      console.info('[AEW:api] saveQuotation stub:', data);
      return Promise.resolve({ success: true });
    },

    /** Retrieve this user's quotation history */
    getQuotations: function () {
      return Promise.resolve([]);
    },

  };

}());
