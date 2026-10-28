"use strict";
// Ohio's web shell must refresh on each launch, without deleting identity data.
// GitHub Pages serves HTML and versioned assets; the browser HTTP cache may
// otherwise retain an old index referencing a previous Cloudflare API origin.
// Service-worker CacheStorage is deliberately not used for this online game.
self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",event=>event.waitUntil(self.clients.claim()));
self.addEventListener("fetch",event=>{
 const req=event.request;
 if(req.method!=="GET")return;
 const url=new URL(req.url);
 // Never proxy/cache third-party origins, especially the authenticated API.
 if(url.origin!==self.location.origin)return;
 // Always revalidate the shell/config on reopening (including mobile TWA).
 // Versioned CSS/JS/image assets may still benefit from normal HTTP caching.
 if(req.mode==="navigate"||url.pathname.endsWith("/assets/ohio-config.js")){
  event.respondWith(fetch(new Request(req,{cache:"no-store"})));
 }
});
