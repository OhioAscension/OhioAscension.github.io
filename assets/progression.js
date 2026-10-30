"use strict";
/* Visual discoverability only. Never changes authoritative server action rules. */
const OhioProgression=(()=>{
 const $=id=>document.getElementById(id);
 const count=(g,id)=>Number(g.projects?.find(p=>p.id===id)?.owned||0);
 function state(g){
  // Time is not an accomplishment. A day-eight colony with zero buildings
  // must still discover its FIRST installation, not the space program.
  const total=(g.projects||[]).reduce((n,p)=>n+Math.max(0,Number(p.owned)||0),0);
  const hasTech=id=>g.tech?.some(t=>t.id===id&&t.unlocked)===true;
  const researched=g.tech?.some(t=>t.unlocked)===true;
  const colony=g.space?.some(p=>p.active)===true;
  const orbital=Number(g.aerospace?.stage||0)>0;
  const helios=Number(g.helios?.collectors||0)>0||Number(g.helios?.relay||0)>0||g.helios?.active===true;
  const offworld=g.energy_worlds?.some(w=>w.id!=="earth"&&w.established)===true;
  const interplanetary=colony||helios||offworld;
  const advanced=total>=5||researched||count(g,"fab")>0||orbital||interplanetary;
  // Backend requires 'silicon' research before aero_attempt. Show the
  // control room when launch preparation becomes possible, not after launch.
  const aerospace=hasTech("silicon")||orbital||interplanetary||Number(g.aerospace?.attempts||0)>0;
  const infrastructure=total>=2||Number(g.stats?.pollution||0)>0||advanced;
  const enterprise=infrastructure||Number(g.personnel?.required_industry||0)>0;
  const world=(g.world||[]).some(r=>r.connected)||(advanced&&(total>=12||Number(g.stats?.credits||0)>=1000000));
  const stage=helios?6:interplanetary?5:aerospace?4:advanced?3:infrastructure?2:total>0?1:0;
  return {stage,total,infrastructure,advanced,aerospace,interplanetary,enterprise,world,hasTech};
 }
  function update(g){
  if(!g||$("game")?.hidden)return;
  const s=state(g);
  const access={map:true,operations:true,projects:true,contracts:true,logs:true,
   environment:s.infrastructure,energy:s.infrastructure,enterprise:s.enterprise,
   world:s.world,space:s.aerospace};
  const hidden=(element,flag)=>{if(element)element.classList.toggle("ohio-discovery-hidden",flag)};
  document.querySelectorAll(".tabs [data-tab],[data-mobile-tab],[data-target-tab]").forEach(b=>{
   const tab=b.dataset.tab||b.dataset.mobileTab||b.dataset.targetTab;
   if(tab in access)hidden(b,!access[tab]);
  });
  const currently=document.querySelector(".tabs [data-tab].active");
  if(currently&&!access[currently.dataset.tab]){
   const map=document.querySelector('.tabs [data-tab="map"]');
   map?.click();
   document.querySelectorAll("[data-mobile-tab]").forEach(b=>b.classList.toggle("active",b.dataset.mobileTab==="map"));
  }
  // Existing buildings always remain visible, even if a campaign follows an unusual route.
  document.querySelectorAll("#projects .card[data-project-id]").forEach(c=>{
   const id=c.dataset.projectId;
   const basic=["sawmill","drill","solar","workshop","security"].includes(id);
   const support=["archive","treatment"].includes(id);
   const scientific=["fab","datacenter","quantum"].includes(id);
   const owned=count(g,id)>0;
   const discovered=basic||(support&&s.infrastructure)||(scientific&&(s.advanced||owned))||owned;
   hidden(c,!discovered);
  });
  const projects=$("projects");
  if(projects){
   [...projects.querySelectorAll("h2")].forEach(h=>{
    const label=h.textContent||"";
    let show=true;
    if(label.includes("REVOLUCIÓN TECNOLÓGICA"))show=s.advanced;
    if(label.includes("MEGAPROYECTOS"))show=s.hasTech("cloud")||s.aerospace||s.interplanetary||g.megaprojects?.some(m=>m.completed);
    hidden(h,!show);
    if(h.nextElementSibling?.classList.contains("grid"))hidden(h.nextElementSibling,!show);
   });
  }
  const energy=$("energy");
  if(energy){
   [...energy.querySelectorAll(".card")].forEach((c,i)=>{
    // Earth is always visible after energy is discovered. Other worlds and Helios are late-game.
    hidden(c,i>0&&!s.interplanetary);
   });
  }
  $("ohio-stage-hint")?.remove();
  if(s.stage<6){
   const next=[
    ["Tu primera instalación","Visitá el sector industrial y construí un aserradero o una perforadora."],
    ["Energía y ambiente","Construí una segunda instalación para ampliar la colonia."],
    ["Investigación y empresa","Alcanzá 5 instalaciones o investigá una tecnología."],
    ["Programa espacial","Investigá la Era del silicio y prepará chips, ingenieros y permisos de lanzamiento."],
    ["Expansión interplanetaria","Prepará el primer lanzamiento y avanzá hacia la Luna y Marte."],
    ["Proyecto Helios","Desplegá colectores y repetidores orbitales para empezar tu red energética solar."]
   ][s.stage];
   const note=document.createElement("section");
   note.id="ohio-stage-hint";note.className="ohio-next-stage";
   note.append(Object.assign(document.createElement("strong"),{textContent:"PRÓXIMA ETAPA · "+next[0]}),
               Object.assign(document.createElement("span"),{textContent:next[1]}));
   $("game").insertBefore(note,$("game").querySelector(".tabs")?.nextSibling||$("game").firstChild);
  }
  const indicator=$("ohio-progress-status");
  if(indicator)indicator.textContent="ETAPA "+(s.stage+1)+" / 7";
  window.OhioMobile?.syncActive();
 }
 return {update,state};
})();
window.OhioProgression=OhioProgression;
