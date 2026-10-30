"use strict";
// Every platform loads the same localisation layer; no browser storage or
// authentication credentials are cleared by this module.
(function(){
 // Unit-test service-worker shims may intentionally lack a DOM.
 if(typeof document==="undefined"||typeof document.createElement!=="function"||!document.head)return;
 const script=document.createElement("script");
 const parent=new URL(document.currentScript?.src||location.origin+"/assets/pwa.js",location.href);
 const target=new URL("i18n-loader.js",parent);
 target.search=parent.search;
 script.src=target.href;
 document.head.append(script);
})();

// Check for a fresh service worker every time the web/TWA client opens.
// No CacheStorage, cookies, IndexedDB or localStorage is ever cleared here.
if("serviceWorker" in navigator && (location.protocol==="https:"||location.hostname==="localhost")){
 window.addEventListener("load",()=>{
  navigator.serviceWorker.register("/sw.js",{updateViaCache:"none"})
   .then(registration=>registration.update())
   .catch(()=>{});
 },{once:true});
}

/* Ohio locale bundle: a993f660f4fa */
