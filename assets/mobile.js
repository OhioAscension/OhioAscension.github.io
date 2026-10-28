"use strict";
const OhioMobile=(()=>{
 const $=id=>document.getElementById(id);
 const toggle=$("mobile-menu-toggle"),backdrop=$("mobile-drawer-backdrop"),nav=$("mobile-bottom-nav");
 const narrow=()=>window.matchMedia("(max-width:700px)").matches;
 $("mobile-logout")?.addEventListener("click",()=>{drawer(false);$("logout").click()});
 function drawer(open){
  document.body.classList.toggle("mobile-drawer-open",open&&narrow());
  backdrop.hidden=!(open&&narrow());
  toggle.setAttribute("aria-expanded",String(open&&narrow()));
 }
 toggle.addEventListener("click",()=>drawer(!document.body.classList.contains("mobile-drawer-open")));
 backdrop.addEventListener("click",()=>drawer(false));
 document.addEventListener("keydown",e=>{if(e.key==="Escape")drawer(false)});
 window.addEventListener("resize",()=>{if(!narrow())drawer(false)});
 document.querySelectorAll("[data-mobile-tab]").forEach(b=>b.addEventListener("click",()=>{
  const tab=document.querySelector('.tabs [data-tab="'+b.dataset.mobileTab+'"]');
  if(tab){tab.click();document.querySelectorAll("[data-mobile-tab]").forEach(x=>x.classList.toggle("active",x===b));}
  drawer(false);
 }));
 $("mobile-more").addEventListener("click",()=>{
  drawer(true);
  if(!$("mobile-tab-list")){
   const section=document.createElement("section");section.id="mobile-tab-list";
   section.innerHTML='<h3>EXPLORAR OHIO</h3><div class="ohio-mobile-links"></div>';
   document.querySelectorAll(".tabs [data-tab]").forEach(button=>{
    const b=document.createElement("button");b.type="button";b.className="full";
    b.textContent=button.textContent;b.dataset.targetTab=button.dataset.tab;
    // The drawer is built lazily: inherit the progression state already
    // applied to the canonical tab before adding this new button.
    b.classList.toggle("ohio-discovery-hidden",button.classList.contains("ohio-discovery-hidden"));
    b.addEventListener("click",()=>{if(!button.classList.contains("ohio-discovery-hidden"))button.click();drawer(false)});
    section.querySelector(".ohio-mobile-links").append(b);
   });
   $("mobile-drawer").append(section);
  }
  // Refresh every time: stages can change while the drawer is closed.
  document.querySelectorAll("#mobile-tab-list [data-target-tab]").forEach(b=>{
   const source=document.querySelector('.tabs [data-tab="'+b.dataset.targetTab+'"]');
   b.classList.toggle("ohio-discovery-hidden",!source||source.classList.contains("ohio-discovery-hidden"));
   b.classList.toggle("active",!!source&&source.classList.contains("active"));
  });
 });
 function update(game){
  if(!game)return;
  $("mobile-clock").textContent=String(game.clock.hour).padStart(2,"0")+":"+String(game.clock.minute).padStart(2,"0");
  for(const [id,k] of [["m-credits","credits"],["m-wood","wood"],["m-ore","ore"]]){
   $(id).textContent=Number(game.stats[k]||0).toLocaleString("es-AR");
  }
  nav.hidden=false;
  const current=document.querySelector(".tabs [data-tab].active")?.dataset.tab;
  document.querySelectorAll("[data-mobile-tab]").forEach(b=>b.classList.toggle("active",b.dataset.mobileTab===current));
 }
 function authenticated(yes){document.body.classList.toggle("mobile-logged-in",yes);nav.hidden=!yes;if(!yes){drawer(false);$("mobile-tab-list")?.remove();}}
 return {update,authenticated};
})();
window.OhioMobile=OhioMobile;
