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
   section.innerHTML='<h3>SECCIONES</h3>';
   document.querySelectorAll(".tabs [data-tab]").forEach(button=>{
    const b=document.createElement("button");b.type="button";b.className="full";
    b.textContent=button.textContent;b.dataset.targetTab=button.dataset.tab;
    b.addEventListener("click",()=>{button.click();drawer(false)});
    section.append(b);
   });
   $("mobile-drawer").append(section);
  }
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
