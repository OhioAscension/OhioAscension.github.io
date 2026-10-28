"use strict";
function render_energy(g){
let energy=el("energy");energy.replaceChildren(node("h2","","REDES ENERGÉTICAS DEL SISTEMA SOLAR"));
let gridCards=node("div","grid");g.energy_worlds.forEach(w=>{let x=w.grid;let c=card(w.name,w.kind==="orbital"?"Estación orbital: sin suelo planetario":w.kind==="atmosphere"?"Instalación aerostática":"Base de superficie","Batería "+x.stored+"/"+w.storage_max+" · Transporte "+w.throughput+" · Apagones "+x.blackouts+" · Averías "+x.damaged);
if(!w.established){c.append(btn("Establecer puesto · "+w.launch+" créditos",()=>act("system_outpost",w.id),!!g.pending));}
else{c.append(node("p","","Generación/h: "+x.last.generated+" · Demanda/h: "+x.last.demand+" · Déficit/h: "+x.last.unserved));c.append(btn("Añadir batería",()=>act("grid_upgrade",w.id+":batteries"),!!g.pending),btn("Mejorar cables",()=>act("grid_upgrade",w.id+":lines"),!!g.pending),btn("Tecnología de batería",()=>act("grid_upgrade",w.id+":battery_level"),!!g.pending),btn("Reparar red",()=>act("grid_repair",w.id),!x.damaged||!!g.pending));}
gridCards.append(c)});energy.append(gridCards);
let hc=card("PROYECTO HELIOS","Colectores: "+g.helios.collectors+" · Repetidores: "+g.helios.relay,"Energía solar orbital con costes de retransmisión por hora");
hc.append(btn("Desplegar colector",()=>act("helios_build"),!!g.pending),btn("Construir repetidor",()=>act("helios_route"),!g.helios.active||!!g.pending));energy.append(hc);

}
