"use strict";
(function(){
 if(typeof document.createElement!=="function"||!document.head)return;
 const s=document.createElement("script");
 const parent=new URL(document.currentScript?.src||location.origin+"/assets/demo-player.js",location.href);
 const loader=new URL("i18n-loader.js",parent);loader.search=parent.search;
 s.src=loader.href;
 document.head.append(s);
})();
/* Read-only cinematic camera over real engine snapshots. No gameplay writes. */
const el=id=>document.getElementById(id),msg=()=>{},busy=true;
function act(){return;}
let cameraTimer=null,pointerTimer=null;
const visual=document.createElement("div");
visual.id="demo-pointer";
visual.setAttribute("aria-hidden","true");
visual.innerHTML='<span class="demo-pointer-tip">⌖</span><span class="demo-pointer-ring"></span>';
document.body.append(visual);

function focusCard(tab,focus,beat){
 const page=el(tab);
 if(!page)return null;
 if(tab==="map"&&focus)return page.querySelector('[data-sector-id="'+focus+'"]')||page.querySelector(".card");
 if(tab==="projects"&&focus)return page.querySelector('[data-project-id="'+focus+'"]')||page.querySelector(".card");
 if(tab==="energy"||tab==="environment")return page.querySelector(".card");
 if(tab==="space"){
  const cards=[...page.querySelectorAll(".card")];
  if(focus==="moon")return cards[1]||cards[0]||null;
  return cards[0]||null;
 }
 if(tab==="enterprise"&&focus==="legal")return [...page.querySelectorAll(".card")].at(-1)||null;
 if(tab==="operations")return focus==="b12"?page.querySelector('[data-director-focus="b12"]'):page.querySelector(".ohio-director .card")||page.querySelector(".card");
 const cards=[...page.querySelectorAll(".card")];
 return cards[Math.min(beat,cards.length-1)]||page.querySelector("h2");
}

function cameraTo(target){
 if(!target)return;
 const phone=window.matchMedia("(max-width:700px)").matches;
 const viewport=phone?(document.scrollingElement||document.documentElement):el("main");
 if(!viewport)return;
 const rect=target.getBoundingClientRect();
 const root=phone?{top:0,height:window.innerHeight}:viewport.getBoundingClientRect();
 const desired=viewport.scrollTop+(rect.top-root.top)-root.height*.30;
 viewport.scrollTo({top:Math.max(0,desired),behavior:"smooth"});
 // The pointer follows the same element after the camera glide settles.
 pointerTimer=setTimeout(()=>{
  if(!target.isConnected)return;
  const box=target.getBoundingClientRect();
  visual.style.left=Math.min(window.innerWidth-30,Math.max(25,box.left+Math.min(85,box.width*.36)))+"px";
  visual.style.top=Math.min(window.innerHeight-40,Math.max(70,box.top+Math.min(42,box.height*.28)))+"px";
  visual.classList.remove("demo-pointer-visible");
  void visual.offsetWidth;
  visual.classList.add("demo-pointer-visible");
 },580);
}

function animateResourceChanges(previous,current){
 if(!previous?.stats||!current?.stats)return;
 document.querySelectorAll("#stats .stat").forEach(cell=>{
  const key=cell.dataset.statKey; // Stable engine ID; labels may be translated.
  const element=cell.querySelector("strong");
  if(!key||!element)return;
  const before=Number(previous.stats[key]),after=Number(current.stats[key]);
  if(!Number.isFinite(before)||!Number.isFinite(after)||before===after)return;
  const start=performance.now(),duration=850;
  element.classList.add("demo-stat-changed");
  function frame(now){
   if(window.currentGame!==current)return;
   const p=Math.min(1,(now-start)/duration);
   element.textContent=Math.round(before+(after-before)*(1-Math.pow(1-p,3))).toLocaleString(window.OhioI18n?.effective()==="en"?"en-US":"es-AR");
   if(p<1)requestAnimationFrame(frame);
   else element.classList.remove("demo-stat-changed");
  }
  requestAnimationFrame(frame);
 });
}

function showDemoScene(g,tab,beat=0,focus=tab,cue="reveal"){
 if(!g||!el("game"))return;
 clearTimeout(cameraTimer);clearTimeout(pointerTimer);
 visual.classList.remove("demo-pointer-visible");
 const previous=window.currentGame;
 render(g);
 animateResourceChanges(previous,g);
 const target=document.querySelector('.tabs [data-tab="'+tab+'"]');
 document.querySelectorAll(".tabs [data-tab]").forEach(button=>button.classList.toggle("active",button===target));
 document.querySelectorAll(".view").forEach(view=>view.hidden=view.id!==tab);
 // Preserve actual engine availability. Rendered actions are inert here:
 // act() is a local no-op and the outer iframe blocks pointer input.
 document.querySelectorAll(".demo-focus,.demo-pressed").forEach(x=>x.classList.remove("demo-focus","demo-pressed"));
 document.documentElement.classList.toggle("demo-crisis",["blackout","failure"].includes(cue));
 document.documentElement.classList.toggle("demo-victory",["launch","finale","resolve"].includes(cue));
 cameraTimer=setTimeout(()=>{
  const card=focusCard(tab,focus,beat)||target;
  if(!card)return;
  card.classList.add("demo-focus");
  const action=card.querySelector("button");
  if(action&&["work","build","power","repair","approve","launch"].includes(cue)){
   action.classList.add("demo-pressed");
  }
  cameraTo(card);
 },90);
}
window.addEventListener("message",event=>{
 if(event.origin!==location.origin||event.data?.type!=="OHIO_DEMO_SCENE")return;
 // The trailer carries its language choice with every frame. Do not save
 // changes to the player's account from a read-only demonstration.
 if(["default","es","en"].includes(event.data.lang)){
  window.OhioI18n?.setProfile(event.data.lang,{remember:false});
 }
 showDemoScene(event.data.state,event.data.tab,event.data.beat||0,
               event.data.focus,event.data.cue);
});
el("game").hidden=false;
el("sidebar").hidden=false;
el("auth").hidden=true;
window.OhioMobile?.authenticated(true);

/* Ohio locale bundle: ea2cdb3f60e5 */
