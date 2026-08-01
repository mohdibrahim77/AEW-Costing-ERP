/**
 * supabase.js  —  AEW Platform  —  Supabase Singleton
 * ─────────────────────────────────────────────────────
 * LOAD ORDER: 2 of 8
 *
 * Creates exactly ONE Supabase client for the entire application.
 * Every other module references window.AEW.supabase — never creates
 * its own client. There is no other call to createClient() anywhere.
 *
 * Requires: Supabase UMD from CDN (window.supabase) loaded first.
 * Requires: config.js (window.AEW.config) loaded first.
 */
(function () {
  'use strict';

  if (!window.supabase || !window.supabase.createClient) {
    console.error('[AEW] supabase.js: Supabase UMD must be loaded from CDN first.');
    return;
  }
  if (!window.AEW || !window.AEW.config) {
    console.error('[AEW] supabase.js: config.js must be loaded first.');
    return;
  }

  window.AEW = window.AEW || {};

  /* The only createClient() call in the entire project */
  window.AEW.supabase = window.supabase.createClient(
    window.AEW.config.SUPABASE_URL,
    window.AEW.config.SUPABASE_ANON_KEY
  );

}());
