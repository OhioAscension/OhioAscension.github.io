"use strict";
const el=id=>document.getElementById(id),msg=t=>{},busy=true;
function act(){return;}
function showDemoScene(g,tab,beat=0){
 const previous=window.currentGame;
 render(g);
 if(previous?.stats&&g.stats){
  document.querySelectorAll("#stats .stat").forEach(cell=>{
   const key=cell.querySelector("span")?.textContent?.toLowerCase();
   const target=cell.querySelector("strong");
   if(!key||!target)return;
   const before=Number(previous.stats[key]),after=Number(g.stats[key]);
   if(!Number.isFinite(before)||!Number.isFinite(after)||before===after)return;
   const start=performance.now(),duration=850;
   function animate(now){
    if(window.currentGame!==g)return;
    const p=Math.min(1,(now-start)/duration);
    target.textContent=String(Math.round(before+(after-before)*(1-Math.pow(1-p,3))));
    if(p<1)requestAnimationFrame(animate);
   }
   requestAnimationFrame(animate);
  });
 }

 const target=[...document.querySelectorAll("[data-tab]")].find(b=>b.dataset.tab===tab);
 document.querySelectorAll("[data-tab]").forEach(b=>b.classList.toggle("active",b===target));
 document.querySelectorAll(".view").forEach(v=>v.hidden=v.id!==tab);
 for(const b of document.querySelectorAll("#game button"))b.disabled=true;
 const cards=[...document.querySelectorAll(".view:not([hidden]) .card")];
 const focus=cards.length?cards[Math.min(beat,cards.length-1)]:target;
 document.querySelectorAll(".demo-focus").forEach(x=>x.classList.remove("demo-focus"));
 if(focus){
  focus.classList.add("demo-focus");
  const viewport=el("main");
  if(viewport&&cards.length){
   const top=focus.getBoundingClientRect().top-viewport.getBoundingClientRect().top+viewport.scrollTop;
   viewport.scrollTo({top:Math.max(0,top-viewport.clientHeight*.34),behavior:"smooth"});
  }
 }
}
window.addEventListener("message",event=>{
 if(event.origin!==location.origin||event.data?.type!=="OHIO_DEMO_SCENE")return;
 showDemoScene(event.data.state,event.data.tab,event.data.beat||0);
});
el("game").hidden=false;el("sidebar").hidden=false;el("auth").hidden=true;
window.OhioMobile?.authenticated(true);
