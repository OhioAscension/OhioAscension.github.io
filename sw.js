"use strict";
// Ohio requires its server for signed saves and WebAuthn. No offline state cache.
self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",event=>event.waitUntil(self.clients.claim()));
self.addEventListener("fetch",event=>{
 if(event.request.method!=="GET")return;
 event.respondWith(fetch(event.request));
});
