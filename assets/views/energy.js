"use strict";
function render_energy(g){
let energy=el("energy");energy.replaceChildren(node("h2","","REDES ENERGÉTICAS DEL SISTEMA SOLAR"));
let gridCards=node("div","grid");g.energy_worlds.forEach(w=>{let x=w.grid;let c=card(w.name,w.kind==="orbital"?"Estación orbital: sin suelo planetario":w.kind==="atmosphere"?"Instalación aerostática":"Base de superficie","Batería "+x.stored+"/"+w.storage_max+" · Transporte "+w.throughput+" · Apagones "+x.blackouts+" · Averías "+x.damaged);
if(!w.established){
 const reasons=[];
 if(g.pending)reasons.push("Primero resolvé el acontecimiento pendiente.");
 if(!g.megaprojects?.some(p=>p.id==="ohio_net"&&p.completed))reasons.push("Primero completá OhioNet.");
 if(g.aerospace.stage<g.aerospace.completed)reasons.push("Completá la campaña aeroespacial.");
 if(g.stats.credits<w.launch)reasons.push("Te faltan "+(w.launch-g.stats.credits)+" créditos.");
 if(g.stats.ore<5000)reasons.push("Necesitás 5.000 mineral.");
 if(g.stats.chips<1000)reasons.push("Necesitás 1.000 chips.");
 c.append(btn("Establecer puesto · "+w.launch+" créditos · 5.000 mineral · 1.000 chips",
  ()=>act("system_outpost",w.id),reasons.length>0,reasons.join(" ")));
}
else{
 c.append(node("p","","Generación/h: "+x.last.generated+" · Demanda/h: "+x.last.demand+" · Déficit/h: "+x.last.unserved));
 const upgrade=(label,kind,cost,extra="")=>{
  const blocked=!!g.pending||g.stats.credits<cost||!!extra;
  const reason=[g.pending?"Primero resolvé el acontecimiento pendiente.":"",
   g.stats.credits<cost?"Faltan "+(cost-g.stats.credits)+" créditos.":"",extra].filter(Boolean).join(" ");
  return btn(label+" · "+cost.toLocaleString("es-AR")+" créditos",()=>act("grid_upgrade",w.id+":"+kind),blocked,reason);
 };
 c.append(upgrade("Añadir batería","batteries",15000),
  upgrade("Mejorar cables","lines",25000),
  upgrade("Tecnología de batería","battery_level",120000,x.battery_level>=10?"Nivel máximo de batería alcanzado.":""),
  btn("Reparar red · "+(50000*x.damaged).toLocaleString("es-AR")+" créditos",
   ()=>act("grid_repair",w.id),!x.damaged||g.stats.credits<50000*x.damaged||!!g.pending,
   [!x.damaged?"No hay averías pendientes.":"",g.stats.credits<50000*x.damaged?"Faltan "+(50000*x.damaged-g.stats.credits)+" créditos.":"",g.pending?"Primero resolvé el acontecimiento pendiente.":""].filter(Boolean).join(" ")));
}
gridCards.append(c)});energy.append(gridCards);
let hc=card("PROYECTO HELIOS","Colectores: "+g.helios.collectors+" · Repetidores: "+g.helios.relay,"Energía solar orbital con costes de retransmisión por hora");
hc.append(btn("Desplegar colector · 20.000.000 créditos + 1.000 chips",()=>act("helios_build"),!!g.pending),btn("Construir repetidor · 5.000.000 créditos",()=>act("helios_route"),!g.helios.active||!!g.pending));energy.append(hc);

}
