"use strict";
/* Phone shell: no desktop markup, styles, game actions or account flows are replaced. */
const OhioMobile=(()=>{
 const $=id=>document.getElementById(id);
 const aside=$("mobile-drawer"),toggle=$("mobile-menu-toggle");
 const backdrop=$("mobile-drawer-backdrop"),nav=$("mobile-bottom-nav");
 const narrow=()=>window.matchMedia("(max-width:700px)").matches;
 let opener=null;
 const context=document.createElement("div");
 context.id="mobile-colony-context";
 context.setAttribute("aria-label","Estado actual de la colonia");
 $("summary").insertAdjacentElement("afterend",context);
 const panels=[
  ["sections","Secciones"],
  ["colony","Colonia"],
  ["account","Configuración"]
 ];

 // Phone-only controls are inserted alongside the existing desktop sidebar.
 const header=document.createElement("div");
 header.className="mobile-drawer-heading";
 const heading=document.createElement("div");
 const name=document.createElement("strong");
 name.textContent="CENTRO DE MANDO";
 const player=document.createElement("span");
 player.id="mobile-drawer-player";
 player.textContent="OHIO / COLONIA";
 heading.append(name,player);
 const close=document.createElement("button");
 close.type="button";close.className="mobile-drawer-close";
 close.textContent="✕";close.setAttribute("aria-label","Cerrar panel");
 header.append(heading,close);
 aside.append(header);

 const switcher=document.createElement("nav");
 switcher.className="mobile-drawer-switcher";
 switcher.setAttribute("aria-label","Apartados del panel");
 panels.forEach(([key,label])=>{
  const b=document.createElement("button");
  b.type="button";b.dataset.panel=key;
  b.textContent=label;
  b.setAttribute("aria-pressed",String(key==="sections"));
  b.addEventListener("click",()=>setPanel(key));
  switcher.append(b);
 });
 aside.append(switcher);

 // Build the list once, but reflect the authoritative progression on every update.
 const sections=document.createElement("section");
 sections.id="mobile-tab-list";
 const sectionsTitle=document.createElement("h3");
 sectionsTitle.textContent="EXPLORAR OHIO";
 const links=document.createElement("div");
 links.className="ohio-mobile-links";
 sections.append(sectionsTitle,links);
 document.querySelectorAll(".tabs [data-tab]").forEach(source=>{
  const b=document.createElement("button");
  b.type="button";b.dataset.targetTab=source.dataset.tab;
  b.textContent=source.textContent;
  b.addEventListener("click",()=>navigate(source.dataset.tab));
  links.append(b);
 });
 aside.append(sections);

 function setPanel(panel){
  if(!panels.some(([key])=>key===panel))panel="sections";
  aside.dataset.mobilePanel=panel;
  switcher.querySelectorAll("button").forEach(b=>
   b.setAttribute("aria-pressed",String(b.dataset.panel===panel))
  );
  if(panel==="sections")syncSections();
 }
 function drawer(open,panel="sections",source=null){
  open=!!open&&narrow()&&document.body.classList.contains("mobile-logged-in");
  const already=document.body.classList.contains("mobile-drawer-open");
  if(open){
   if(!already)opener=source||document.activeElement;
   setPanel(panel);
   document.body.classList.add("mobile-drawer-open");
   backdrop.hidden=false;
   toggle.setAttribute("aria-expanded","true");
   aside.setAttribute("role","dialog");
   aside.setAttribute("aria-modal","true");
   aside.setAttribute("aria-label","Panel de Ohio");
   close.focus({preventScroll:true});
  }else{
   document.body.classList.remove("mobile-drawer-open");
   backdrop.hidden=true;
   toggle.setAttribute("aria-expanded","false");
   aside.removeAttribute("role");
   aside.removeAttribute("aria-modal");
   aside.removeAttribute("aria-label");
   if(already&&opener?.focus)opener.focus({preventScroll:true});
   opener=null;
  }
 }
 function syncSections(){
  document.querySelectorAll("#mobile-tab-list [data-target-tab]").forEach(b=>{
   const source=document.querySelector('.tabs [data-tab="'+b.dataset.targetTab+'"]');
   const allowed=!!source&&!source.classList.contains("ohio-discovery-hidden");
   b.hidden=!allowed;
   b.classList.toggle("active",allowed&&source.classList.contains("active"));
  });
 }
 function syncActive(){
  const active=document.querySelector(".tabs [data-tab].active")?.dataset.tab;
  let inBar=false;
  nav.querySelectorAll("[data-mobile-tab]").forEach(b=>{
   const selected=b.dataset.mobileTab===active;
   b.classList.toggle("active",selected);
   b.setAttribute("aria-current",selected?"page":"false");
   if(selected&&!b.classList.contains("ohio-discovery-hidden"))inBar=true;
  });
  $("mobile-more")?.classList.toggle("active",!inBar&&!!active);
  syncSections();
 }
 function navigate(tabName){
  const tab=document.querySelector('.tabs [data-tab="'+tabName+'"]');
  if(!tab||tab.classList.contains("ohio-discovery-hidden"))return;
  tab.click();
  drawer(false);
  syncActive();
  if(narrow()&&!$("game").hidden){
   $("game").scrollIntoView({behavior:"smooth",block:"start"});
  }
 }
 close.addEventListener("click",()=>drawer(false));
 toggle.addEventListener("click",()=>drawer(!document.body.classList.contains("mobile-drawer-open"),"colony",toggle));
 backdrop.addEventListener("click",()=>drawer(false));
 $("mobile-more").addEventListener("click",()=>drawer(true,"sections",$("mobile-more")));
 $("mobile-logout")?.addEventListener("click",()=>{drawer(false);$("logout").click()});
 document.querySelectorAll("[data-mobile-tab]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.mobileTab)));
 document.querySelectorAll(".tabs [data-tab]").forEach(b=>
  b.addEventListener("click",()=>queueMicrotask(syncActive))
 );
 // A leftward swipe closes the drawer; vertical scrolling is unaffected.
 let touchStart=null;
 aside.addEventListener("touchstart",e=>{
  if(!document.body.classList.contains("mobile-drawer-open")||e.touches.length!==1)return;
  touchStart={x:e.touches[0].clientX,y:e.touches[0].clientY};
 },{passive:true});
 aside.addEventListener("touchend",e=>{
  if(!touchStart||!e.changedTouches.length)return;
  const dx=e.changedTouches[0].clientX-touchStart.x;
  const dy=e.changedTouches[0].clientY-touchStart.y;
  if(dx < -85 && Math.abs(dx)>Math.abs(dy)*1.4)drawer(false);
  touchStart=null;
 },{passive:true});
 document.addEventListener("keydown",e=>{
  if(!document.body.classList.contains("mobile-drawer-open"))return;
  if(e.key==="Escape"){e.preventDefault();drawer(false);return}
  if(e.key!=="Tab")return;
  const focusables=[...aside.querySelectorAll("button:not([hidden]):not(:disabled),a[href],input:not([disabled])")]
   .filter(x=>x.getClientRects().length&&!x.closest("[hidden]"));
  if(!focusables.length)return;
  const first=focusables[0],last=focusables[focusables.length-1];
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
 });
 window.addEventListener("resize",()=>{if(!narrow())drawer(false)});
 function constructionGuide(game){
  // Building is possible only at the industrial park. Explain this where
  // players actually try to build instead of leaving mysterious disabled CTAs.
  const projects=$("projects");
  if(!projects||!narrow())return;
  projects.querySelector(".mobile-build-guide")?.remove();
  if(game.location==="factory"&&!game.pending&&!game.decision_event)return;
  const blocked=!!game.pending||!!game.decision_event;
  const panel=document.createElement("section");
  panel.className="mobile-build-guide";
  const title=document.createElement("strong");
  title.textContent=blocked?"DECISIÓN PENDIENTE":"¿POR QUÉ NO PUEDO CONSTRUIR?";
  const description=document.createElement("p");
  description.textContent=blocked
   ?"Primero resolvé el acontecimiento pendiente de la colonia."
   :"Las instalaciones se construyen en el Parque industrial. Viajá allí desde el mapa.";
  const action=document.createElement("button");
  action.type="button";
  action.textContent=blocked?"Ir a la decisión":"Abrir el mapa";
  action.addEventListener("click",()=>navigate("map"));
  panel.append(title,description,action);
  projects.prepend(panel);
 }
 function update(game){
  if(!game)return;
  $("mobile-clock").textContent=String(game.clock.hour).padStart(2,"0")+":"+String(game.clock.minute).padStart(2,"0");
  for(const [id,k] of [["m-credits","credits"],["m-wood","wood"],["m-ore","ore"]]){
   $(id).textContent=Number(game.stats[k]||0).toLocaleString(window.OhioI18n?.effective()==="en"?"en-US":"es-AR");
  }
  const sector=game.sectors?.find(s=>s.id===game.location);
  context.textContent="DÍA "+game.stats.day+" · "+(sector?.name||"OHIO")+" · "+(game.clock.daylight?"TURNO ACTIVO":"TURNO NOCTURNO");
  const progress=window.OhioProgression?.state(game);
  const stage=progress?("ETAPA "+(progress.stage+1)+" / 7 · "+progress.total+" INSTALACIONES"):"COLONIA ACTIVA";
  player.textContent=($("lab-name")?.textContent||"OHIO").trim()+" · "+stage;
  nav.hidden=false;
  constructionGuide(game);
  syncActive();
 }
 function authenticated(yes){
  document.body.classList.toggle("mobile-logged-in",yes);
  nav.hidden=!yes;
  if(!yes){
   drawer(false);
   context.textContent="";
   player.textContent="OHIO / COLONIA";
   setPanel("sections");
  }
 }
 // The desktop status line stays persistent. On phones, show a visible
 // temporary message above the bottom bar instead of burying errors below
 // many screens of cards.
 const status=$("message");
 if(status&&typeof MutationObserver!=="undefined"){
  let noticeTimer=null;
  new MutationObserver(()=>{
   if(!narrow())return;
   clearTimeout(noticeTimer);
   const value=status.textContent.trim();
   if(value)noticeTimer=setTimeout(()=>{
    if(status.textContent.trim()===value)status.textContent="";
   },6500);
  }).observe(status,{subtree:true,childList:true,characterData:true});
 }
 setPanel("sections");
 return {update,authenticated,syncActive,drawer};
})();
window.OhioMobile=OhioMobile;
