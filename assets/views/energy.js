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
 const fmt=n=>n.toLocaleString("es-AR");
 const localSolar=Math.max(3,x.batteries)*3*w.solar;
 const summary=w.id==="earth"?"Campos solares terrestres":("Solar local: "+Math.floor(localSolar)+" unidades/h"+(w.kind==="orbital"?" constantes":" durante el día"));
 const details=document.createElement("details");
 details.append(node("summary","",summary));
 details.append(node("p","meta","Fuera de la Tierra, cada batería también aumenta la generación solar. Los cables limitan el transporte; la tecnología de batería aumenta el almacenamiento. La red terrestre no se exporta sin Helios."));
 c.append(details);
 const form=document.createElement("form");
 form.className="ohio-workforce-form ohio-battery-batch-form";
 const batchLabel=node("label","ohio-workforce-label","Baterías por lote (1 a 1000) · 15.000 créditos cada una");
 const batch=document.createElement("input");
 batch.type="number";batch.min="1";batch.max="1000";batch.step="1";batch.required=true;
 batch.inputMode="numeric";batch.value="100";batch.className="ohio-workforce-quantity";
 batch.id="battery-batch-"+w.id;batchLabel.htmlFor=batch.id;
 const estimate=node("p","meta","");
 const feedback=node("p","ohio-workforce-feedback","");
 feedback.setAttribute("role","status");
 const batchButton=btn("Instalar lote de baterías",()=>{},!!g.pending);
 const refresh=()=>{
  const raw=batch.value.trim(),n=Number(raw);
  const valid=/^[0-9]+$/.test(raw)&&Number.isSafeInteger(n)&&n>=1&&n<=1000;
  const total=valid?n*15000:0;
  estimate.textContent=valid
   ?"Costo total: "+fmt(total)+" créditos · Saldo posterior: "+fmt(g.stats.credits-total)+" créditos · Baterías: "+fmt(x.batteries)+" → "+fmt(x.batteries+n)+"."
   :"Elegí una cantidad entera de 1 a 1000.";
  feedback.textContent=valid&&total>g.stats.credits?"Créditos insuficientes para este lote.":"";
  return valid&&total<=g.stats.credits;
 };
 batchButton.onclick=()=>{
  if(g.pending){msg("Primero resolvé el acontecimiento pendiente.");return;}
  if(!refresh()){batch.setCustomValidity("Revisá la cantidad y los créditos disponibles.");batch.reportValidity();return;}
  batch.setCustomValidity("");
  act("grid_upgrade_batch",w.id+":batteries:"+batch.value.trim());
 };
 batch.addEventListener("input",()=>{batch.setCustomValidity("");refresh();});
 form.addEventListener("submit",event=>{event.preventDefault();batchButton.click();});
 form.append(batchLabel,batch,estimate,batchButton,feedback);
 refresh();
 c.append(form);
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
const budgets=card("BATERÍAS POR PLANETA","Objetivos para cubrir la demanda de día y de noche, sin Helios.","Los importes descuentan baterías y cables ya instalados. No incluyen reparaciones.");
const fmtGoal=n=>n.toLocaleString("es-AR");
for(const w of g.energy_worlds.filter(w=>w.id!=="earth")){
 const daylight=w.kind==="orbital"?24:w.id==="mercury"?16:12;
 const required=w.demand*24;
 let target=2;
 const generation=n=>Math.floor(Math.max(3,n)*3*w.solar);
 while(target<100000&&(generation(target)*daylight<required||target*100*w.grid.battery_level<w.demand*(24-daylight)))target++;
 const missing=Math.max(0,target-w.grid.batteries);
 const minimumTransport=Math.ceil(required/daylight);
 const cables=Math.max(0,Math.ceil((minimumTransport+w.grid.damaged*50)/100)-w.grid.lines);
 const cost=missing*15000+cables*25000;
 budgets.append(node("p","",w.name+": "+fmtGoal(target)+" baterías en total · Faltan "+fmtGoal(missing)+" · Costo: "+fmtGoal(cost)+" créditos"+(cables?" (incluye "+cables+" cable/s)":"")+"."));
}
energy.append(budgets);
let hc=card("PROYECTO HELIOS","Colectores: "+g.helios.collectors+" · Repetidores: "+g.helios.relay,"Cada pareja aporta 1.000 unidades/h, asignadas solo cuando hace falta. Retransmisión: 3 créditos por unidad utilizada.");
hc.append(btn("Desplegar colector · 5.000.000 créditos + 250 chips",()=>act("helios_build"),!!g.pending),btn("Construir repetidor · 2.000.000 créditos",()=>act("helios_route"),!g.helios.active||!!g.pending));energy.append(hc);

}
