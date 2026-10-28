"use strict";
/* Settings and game telemetry are separate panels on desktop. The same
 * configuration content is used by the existing Android drawer switcher.
 * All source controls retain their IDs and event handlers.
 */
(()=>{
 const $=id=>document.getElementById(id);
 const aside=$("mobile-drawer"),settings=$("ohio-settings"),colony=$("ohio-colony-controls");
 if(!aside||!settings||!colony)return;
 const group=document.createElement("nav");
 group.className="ohio-desktop-sidebar-switcher";
 group.setAttribute("aria-label","Panel lateral");
 for(const [id,label] of [["colony","Colonia"],["settings","Configuración"]]){
  const b=document.createElement("button");
  b.type="button";b.textContent=label;b.dataset.sidebarView=id;
  b.setAttribute("aria-pressed",String(id==="colony"));
  b.onclick=()=>{
   aside.dataset.desktopPanel=id;
   group.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));
  };
  group.append(b);
 }
 aside.insertBefore(group,colony.parentElement);
 aside.dataset.desktopPanel="colony";
 // Use one sign-out button on desktop; the mobile sign-out stays inside settings.
 const logout=$("logout");
 if(logout)settings.append(logout);
})();
