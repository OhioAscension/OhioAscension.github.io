"use strict";
/* Visual discoverability only. Never changes authoritative server action rules. */
const OhioProgression=(()=>{
 const $=id=>document.getElementById(id);
 const count=(g,id)=>Number(g.projects?.find(p=>p.id===id)?.owned||0);
 function state(g){
  const total=Number(g.progress?.projects??g.projects?.reduce((n,p)=>n+(p.owned||0),0)??0);
  const hasTech=(id)=>g.tech?.some(t=>t.id===id&&t.unlocked)===true;
  const colony=g.space?.some(p=>p.active)===true;
  const orbital=Number(g.aerospace?.stage||0)>0;
  const helios=Number(g.helios?.collectors||0)>0||Number(g.helios?.relay||0)>0||g.helios?.active===true;
  const infrastructure=total>=2||g.stats.day>=3||Number(g.stats.pollution)>0;
  const advanced=total>=5||g.stats.day>=7||g.tech?.some(t=>t.unlocked)===true||count(g,"fab")>0;
  const aerospace=(advanced&&(orbital||g.stats.day>=12||g.stats.credits>=150000))||colony||helios;
  const interplanetary=colony||helios||g.energy_worlds?.some(w=>w.id!=="earth"&&w.established)===true;
  const stage=helios?6:interplanetary?5:aerospace?4:advanced?3:infrastructure?2:total>0?1:0;
  return {stage,total,infrastructure,advanced,aerospace,interplanetary,hasTech};
 }
 function update(g){
  if(!g||$("game")?.hidden)return;
  const s=state(g);
  const access={map:true,operations:true,projects:true,contracts:true,logs:true,
   environment:s.infrastructure,energy:s.infrastructure,enterprise:s.advanced,
   world:s.advanced,space:s.aerospace};
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
    if(label.includes("MEGAPROYECTOS"))show=s.interplanetary||g.megaprojects?.some(m=>m.completed);
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
    ["Instalá tu primera fábrica","Construí un aserradero o una perforadora desde el parque industrial."],
    ["Energía y ambiente","Construí 2 instalaciones o llegá al día 3."],
    ["Investigación y empresa","Llegá a 5 instalaciones, al día 7 o investigá una tecnología."],
    ["Programa espacial","Desarrollá el programa industrial hasta iniciar vuelos de prueba."],
    ["Expansión interplanetaria","Fundá una colonia o establecé tu primer puesto fuera de la Tierra."],
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
 }
 return {update,state};
})();
window.OhioProgression=OhioProgression;
