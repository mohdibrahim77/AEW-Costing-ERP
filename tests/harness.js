/* Browser + Supabase simulator. Loads the REAL module files unmodified. */
const fs = require('fs');
const vm = require('vm');
const JS = '/mnt/user-data/outputs/aew-platform/assets/js/';

function makeEnv(startUrl, storage, supabaseBehaviour) {
  const nav = [];                       // navigation trace
  const store = Object.assign({}, storage);
  const sess  = {};
  let listener = null;

  const localStorage = {
    get length() { return Object.keys(store).length; },
    key: i => Object.keys(store)[i],
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; },
    clear: () => { for (const k in store) delete store[k]; },
  };
  const sessionStorage = {
    get length() { return Object.keys(sess).length; },
    key: i => Object.keys(sess)[i],
    getItem: k => (k in sess ? sess[k] : null),
    setItem: (k, v) => { sess[k] = String(v); },
    removeItem: k => { delete sess[k]; },
    clear: () => { for (const k in sess) delete sess[k]; },
  };

  const win = {
    location: {
      href: startUrl, search: '', protocol: 'http:',
      origin: 'http://127.0.0.1:5500',
      replace(u) { nav.push(u); },
    },
    localStorage, sessionStorage,
    setTimeout, clearTimeout, console,
    supabase: {
      createClient: () => ({
        auth: {
          onAuthStateChange(cb) { listener = cb; },
          signOut: () => Promise.resolve({}),
        }
      })
    },
    document: {
      getElementsByTagName: () => ([{ src: 'http://127.0.0.1:5500/assets/js/config.js' }]),
      getElementById: () => null,
      createElement: () => ({ setAttribute(){}, style:{cssText:''}, innerHTML:'' }),
      addEventListener: () => {},
      body: { appendChild(){} },
    },
  };
  win.window = win;

  const ctx = vm.createContext(win);
  ['config.js','supabase.js','session.js','router.js','auth.js','ui.js','api.js','common.js']
    .forEach(f => vm.runInContext(fs.readFileSync(JS + f, 'utf8'), ctx, { filename: f }));

  return { win, nav, store, sess, fire: (e, s) => listener && listener(e, s) };
}

module.exports = { makeEnv };
