/**
 * Script de thème appliqué avant hydration.
 * Texte unique partagé par le layout et l'empreinte CSP (Report-Only).
 * Toute modification doit rester strictement identique des deux côtés.
 */
export const THEME_INIT_SCRIPT =
  "(function(){try{var k='lfdc-theme';var t=localStorage.getItem(k);if(t!=='dark'&&t!=='light'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.dataset.theme=t;}catch(e){}})();";
