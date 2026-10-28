"use strict";
/* Same public assets are shared by Pages, Android TWA and Electron.
 * Ordered loading ensures translations exist before the switchable DOM layer.
 */
if(!window.__ohioLocalizationLoading){
 window.__ohioLocalizationLoading=true;
 const base=document.currentScript?.src||"/assets/i18n-loader.js";
 const files=[
  "locales/en-core.js","locales/en-game.js","locales/en-catalog.js",
  "locales/en-systems.js","locales/en-fragments.js","locales/en-film.js",
  "locales/en-decisions.js","locales/en-engine-story.js",
  "locales/en-errors.js","locales/en-errors-more.js","locales/en-engine-tail.js",
  "locales/en-settings.js","locales/en-auth-errors.js",
  "locales/en-cinematics.js","locales/en-diagnostics.js",
  "locales/en-film-scenes-a.js","locales/en-film-scenes-b.js","i18n.js",
  ...((location.pathname==="/"||location.pathname.endsWith("/index.html"))?["i18n-ui.js"]:[])
 ];
 (async()=>{
  for(const file of files){
   await new Promise((resolve,reject)=>{
    const element=document.createElement("script");
    const url=new URL(file,base);
    url.search=new URL(base,location.href).search;
    element.src=url.href;
    element.async=false;
    element.onload=resolve;
    element.onerror=()=>reject(Error("Could not load Ohio locale: "+file));
    document.head.append(element);
   });
  }
 })().catch(error=>console.error("Ohio localization failed:",error));
}
