"use strict";
// Check for a fresh service worker every time the web/TWA client opens.
// No CacheStorage, cookies, IndexedDB or localStorage is ever cleared here.
if("serviceWorker" in navigator && (location.protocol==="https:"||location.hostname==="localhost")){
 window.addEventListener("load",()=>{
  navigator.serviceWorker.register("/sw.js",{updateViaCache:"none"})
   .then(registration=>registration.update())
   .catch(()=>{});
 },{once:true});
}
