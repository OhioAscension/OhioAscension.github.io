"use strict";
function whyBlocked(name,g=window.currentGame,extra=""){
 if(!g)return "No se pudo comprobar el estado actual. Actualizá el juego.";
 const reasons=[];
 if(g.pending)reasons.push("Primero resolvé la decisión o acontecimiento pendiente.");
 if(g.ending)reasons.push("La campaña terminó.");
 const credits=g.stats?.credits??0,energy=g.stats?.energy??0,wood=g.stats?.wood??0,ore=g.stats?.ore??0;
 const need=(amount,value,unit)=>{if(value<amount)reasons.push("Faltan "+(amount-value).toLocaleString("es-AR")+" "+unit+" (necesitás "+amount.toLocaleString("es-AR")+").")};
 if(/Construir|Construcción|lote/.test(name)&&g.location!=="factory")reasons.push("Viajá al Parque industrial para construir.");
 if(/Ejecutar turno|Viajar/.test(name))need(/Viajar/.test(name)?1:2,energy,"de energía");
 if(/Investigar$/.test(name)){need(3,energy,"de energía");need(450,credits,"créditos")}
 const price=(name.match(/([\d.]+) créditos/)||[])[1];
 if(price)need(Number(price.replaceAll(".","")),credits,"créditos");
 if(/Reducir plantilla/.test(name)&&g.personnel?.roles?.every(r=>!r.count))reasons.push("Todavía no tenés personal contratado.");
 if(/Reparar red/.test(name)&&g.energy_worlds?.every(w=>!w.grid.damaged))reasons.push("No hay averías pendientes.");
 if(/Construir repetidor/.test(name)&&!g.helios?.active)reasons.push("Primero tenés que activar Helios.");
 if(/Fondo activo/.test(name))reasons.push("Este fondo ya está activo.");
 if(/autorizado/.test(name))reasons.push("Esta autorización ya fue concedida.");
 if(/Completado|Investigada/.test(name))reasons.push("Esta investigación o proyecto ya está completado.");
 if(/Bloqueado/.test(name))reasons.push("Este sector todavía no alcanzó su día de desbloqueo.");
 if(extra)reasons.push(extra);
 return [...new Set(reasons)].join(" ")||"Esta acción todavía no cumple sus requisitos. Revisá recursos, ubicación, permisos y progreso.";
}
function btn(name,fn,disabled=false,reason=""){
 const b=document.createElement("button");b.textContent=name;
 if(disabled){
  b.setAttribute("aria-disabled","true");
  b.classList.add("ohio-blocked-action");
  b.title=reason||whyBlocked(name);
  b.onclick=()=>msg(reason||whyBlocked(name));
 }else b.onclick=fn;
 return b;
}
function node(tag,className,text){let n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=text;return n}
function card(title,desc,meta){let n=node("article","card");n.append(node("h2","",title),node("p","",desc),node("div","meta",meta||""));return n}
function render(g){
 const arrays=["sectors","projects","tech","megaprojects","contracts","world","space","energy_worlds","log"];
 for(const key of arrays){
  if(!Array.isArray(g?.[key]))throw new Error("Datos de partida incompletos: "+key+" no es una lista. Recargá la página y revisá la versión del servidor.");
 }
 if(!Array.isArray(g?.personnel?.roles)||!Array.isArray(g?.personnel?.offers))throw new Error("Datos de personal/inversores incompletos. Recargá la página.");
 window.currentGame=g;
window.OhioAmbience?.apply(g);const time=g.clock;el("summary").dataset.clock="Día "+g.stats.day+" · "+String(time.hour).padStart(2,"0")+":"+String(time.minute).padStart(2,"0")+" · "+(time.daylight?"JORNADA LABORAL":"TURNO NOCTURNO");el("summary").textContent=el("summary").dataset.clock+" · "+g.sectors.find(s=>s.id===g.location).name+" · "+(g.ending?"CAMPAÑA FINALIZADA":"Colonia en operaciones");
el("stats").replaceChildren();for(let [key,val] of Object.entries(g.stats)){let r=node("div","stat");r.dataset.statKey=key;r.append(node("span","",key.toUpperCase()),node("strong","",val));el("stats").append(r)}
el("power").textContent=g.power.used+" / "+g.power.capacity+" unidades almacenadas";el("powerFill").style.width=Math.min(100,100*g.power.used/Math.max(1,g.power.capacity))+"%";
let ev=el("event");ev.replaceChildren();
const pendingIncidents=(g.incidents||[]).filter(i=>i.status==="pending");
function incidentAdvice(i){
 const grid=g.energy_worlds?.find(w=>w.id===i.world);
 if(i.type==="electrical"){
  const steps=[];
  if(grid?.grid?.damaged>0)steps.push("Reparar "+grid.grid.damaged+" avería(s) en la red.");
  if(grid?.grid?.last?.unserved>0)steps.push("Cubrir "+grid.grid.last.unserved+" unidades de demanda eléctrica sin suministro.");
  if(grid&&grid.throughput<=grid.grid.last.demand)steps.push("Mejorar cables: el transporte actual es de "+grid.throughput+" unidades/h.");
  if(grid&&grid.grid.stored===0)steps.push("Agregar baterías y aumentar la generación; almacenamiento vacío.");
  if(!steps.length)steps.push("Revisar generación, baterías y cableado en Redes energéticas; mantener suministro estable durante 3 horas.");
  return steps.join(" ");
 }
 if(i.type==="labor"){
  const required=g.personnel?.required_industry||0,current=g.personnel?.staff?.industry||0;
  return current<required?"Contratar "+(required-current)+" trabajador(es) industriales. Requeridos: "+required+"; actuales: "+current+".":"Revisar personal industrial y mantener cubierta la plantilla.";
 }
 if(i.type==="environment"){
  const p=g.stats?.pollution||0;
  return "Reducir contaminación por debajo de 12. Nivel actual: "+p+". Usá saneamiento o plantas depuradoras.";
 }
 if(i.type==="legal")return "Resolver causas abiertas desde Empresa y Justicia (Acuerdo extrajudicial). Causas: "+(g.personnel?.lawsuits||0)+".";
 return "Consultar el detalle del incidente y los recursos de la colonia.";
}
if(pendingIncidents.length){
 const inbox=node("section","ohio-incident-inbox");
 inbox.append(node("h2","","CENTRO DE INCIDENTES · "+pendingIncidents.length+" pendiente"+(pendingIncidents.length===1?"":"s")));
 inbox.append(node("p","meta","Los incidentes se sancionan por cada 12 horas activas sin solución. Solo al regresar tras 7 días de ausencia simulada o más recibís 3 días de protección."));
 for(const i of pendingIncidents){
  const item=node("article","ohio-incident");
  item.append(node("strong","",({"electrical":"RED ELÉCTRICA","labor":"PERSONAL INSUFICIENTE","environment":"RIESGO AMBIENTAL","legal":"EXPEDIENTE LEGAL"}[i.type]||"INCIDENTE")+" · "+i.world.toUpperCase()),
    node("p","",(i.type==="electrical"?i.severity+" unidades sin suministro detectadas.":"Gravedad registrada: "+i.severity+".")+" "+i.damage+" daños registrados."),
    node("p","ohio-incident-requirements","REQUIERE: "+incidentAdvice(i)),
    node("div","meta",i.grace_remaining_hours>0?"Protección por regreso: "+i.grace_remaining_hours+" horas activas restantes.":"Próxima sanción en "+i.penalty_in_hours+" horas de juego activo (si persiste)."),
    node("div","meta",i.penalties+" sanciones aplicadas."));
  inbox.append(item);
 }
 ev.append(inbox);
}
if(g.flags.includes("seized_save")){let raid=node("article","card");raid.append(node("h2","","ORDEN DE ALLANAMIENTO · FISCALÍA DE OHIO"),node("p","","La División de Delitos Patrimoniales detectó alteraciones en los registros de activos. Se ordenó la incautación preventiva de los bienes y la apertura de una nueva colonia bajo supervisión judicial."),node("div","meta","El expediente original fue preservado para revisión. Las passkeys no fueron incautadas."));ev.append(raid);}if(g.ending){let n=node("div","event");n.append(node("h2","","FINAL · "+g.ending.toUpperCase()),node("p","","Ohio recuerda tus decisiones. Podés iniciar otra campaña para explorar otras consecuencias."));if(g.ending==="bankrupt" && g.finance.rescues===0)n.append(btn("Solicitar préstamo de emergencia (+100.000)",()=>act("rescue")));ev.append(n)}
else if(g.decision_event){let d=g.decision_event;let n=node("div","event");n.append(node("h2","",d.title),node("p","",d.description));d.options.forEach(o=>n.append(btn(o.label,()=>act("decision",o.id))));ev.append(n)}
else if(g.pending){let n=node("div","event");let prompts={4:["Explorar el mapa y conservar los planos","Vender los planos al comerciante"],8:["Investigar el consumo subterráneo","Ocultar los registros"],13:["Desviar energía al B-12","Apagar la planta de manera controlada","Sobrecargar el reactor"],20:["Entregar la empresa a la comunidad","Expandir el imperio industrial","Desvelar el secreto de Lázaro"]},codes={4:["explore","ignore"],8:["investigate","conceal"],13:["redirect","shutdown","overdrive"],20:["community","industry","science"]};n.append(node("h2","",({4:"EL MAPA SECRETO",8:"PROYECTO LÁZARO",13:"INCIDENTE DEL REACTOR",20:"LA ASAMBLEA FINAL"})[g.pending]));n.append(node("p","","Decisión estratégica. Tus estadísticas y actos anteriores determinarán el resultado."));if(Array.isArray(prompts[g.pending]))prompts[g.pending].forEach((p,i)=>n.append(btn(p,()=>act("decision",codes[g.pending][i]))));else n.append(node("p","","Acontecimiento pendiente: "+String(g.pending)+". Revisá el registro y el estado del servidor."));ev.append(n)}
let map=el("map");map.replaceChildren(node("h2","","SECTORES / DESPLAZAMIENTO"));let mg=node("div","grid");g.sectors.forEach(s=>{let c=card(s.name,s.desc,s.open?"ACCESIBLE":"DESBLOQUEO: DÍA "+s.unlock);c.dataset.sectorId=s.id;if(s.id===g.location)c.append(node("div","select","● UBICACIÓN ACTUAL"));else c.append(btn(s.open?"Viajar (−1 energía)":"Bloqueado",()=>act("travel",s.id),!s.open||!!g.pending,[!s.open?"Disponible a partir del día "+s.unlock+".":"",g.pending?"Resolvé el acontecimiento pendiente.":""].filter(Boolean).join(" ")));mg.append(c)});map.append(mg);
let op=el("operations");op.replaceChildren(node("h2","","OPERACIONES DEL SECTOR"));let og=node("div","grid");let descriptions={village:"Atender a los aldeanos (+1 confianza, +80 créditos)",mine:"Extracción (+3 mineral)",forest:"Recolectar madera (+4 madera)",factory:"Turno de fábrica (+380 créditos, +1 contaminación)",lab:"Analizar archivos (+2 inteligencia)",b12:"Investigar subsuelo (+3 inteligencia, +2 contaminación)"};let cc=card(g.sectors.find(s=>s.id===g.location).name,descriptions[g.location],"Consumo: 2 energía");cc.append(btn("Ejecutar turno de trabajo",()=>act("work",g.location),g.stats.energy<2||!!g.pending));og.append(cc);if(["lab","b12"].includes(g.location)){let r=card("Investigación avanzada","Obtiene 3 de inteligencia.","450 créditos · 3 energía");r.append(btn("Investigar",()=>act("research"),g.stats.energy<3||g.stats.credits<450||!!g.pending));og.append(r)}op.append(og);
let p=el("projects");p.replaceChildren(node("h2","","CATÁLOGO DE INSTALACIONES"));let pg=node("div","grid");g.projects.forEach(x=>{
 const c=card(x.name,x.desc,"Costo "+x.cost+" créditos · "+x.wood+" madera · "+x.ore+" mineral · "+x.power+" energía | Construidas: "+x.owned);
 c.dataset.projectId=x.id;
 const buildReasons=[
  g.pending?"Resolvé primero el acontecimiento pendiente.":"",
  g.location!=="factory"?"Tenés que estar en el Parque industrial para construir.":"",
  g.stats.credits<x.cost?"Te faltan "+(x.cost-g.stats.credits)+" créditos.":"",
  g.stats.wood<x.wood?"Te faltan "+(x.wood-g.stats.wood)+" madera.":"",
  g.stats.ore<x.ore?"Te faltan "+(x.ore-g.stats.ore)+" mineral.":""
 ].filter(Boolean).join(" ");
 const disabled=!x.affordable||g.location!=="factory"||!!g.pending;
 c.append(btn("Construir",()=>act("build",x.id),disabled,buildReasons));
 const form=document.createElement("form");
 form.className="ohio-workforce-form ohio-batch-form";
 const label=node("label","ohio-workforce-label","Cantidad de instalaciones (1–1000)");
 const quantity=document.createElement("input");
 quantity.type="number";quantity.min="1";quantity.max="1000";quantity.step="1";
 quantity.required=true;quantity.inputMode="numeric";quantity.value="100";
 quantity.id="batch-"+x.id;quantity.className="ohio-workforce-quantity";
 label.htmlFor=quantity.id;
 const feedback=node("p","ohio-workforce-feedback","");
 feedback.setAttribute("role","status");
 const build=btn("Construir lote (1–1000)",()=>{
  const raw=quantity.value.trim(),n=Number(raw);
  if(!raw||!Number.isSafeInteger(n)||n<1||n>1000){
   feedback.textContent="Ingresá una cantidad entera de 1 a 1000.";
   quantity.setCustomValidity("Cantidad inválida");
   quantity.reportValidity();
   return;
  }
  quantity.setCustomValidity("");
  feedback.textContent="";
  act("build_batch",x.id,n);
 },disabled,buildReasons);
 build.type="button";
 quantity.addEventListener("input",()=>{quantity.setCustomValidity("");feedback.textContent=""});
 form.addEventListener("submit",event=>{event.preventDefault();if(!build.disabled)build.click()});
 form.append(label,quantity,build,feedback);
 c.append(form);pg.append(c);
});p.append(pg);
let research=node("h2","","REVOLUCIÓN TECNOLÓGICA");p.append(research);
let techGrid=node("div","grid");g.tech.forEach(x=>{let c=card(x.name,x.desc,"Créditos "+x.cost+" · Inteligencia "+x.intel+" · Chips "+x.chips+" · Cómputo "+x.compute+(x.requires?" · Requiere "+x.requires:""));c.append(btn(x.unlocked?"Investigada":"Investigar tecnología",()=>act("technology",x.id),x.unlocked||!x.affordable||!!g.pending));techGrid.append(c)});p.append(techGrid);
p.append(node("h2","","MEGAPROYECTOS · NUEVA ERA"));
let megaGrid=node("div","grid");g.megaprojects.forEach(x=>{let c=card(x.name,x.desc,"Créditos "+x.cost+" · Madera "+x.wood+" · Mineral "+x.ore+" · Chips "+x.chips+" · Cómputo "+x.compute);c.append(btn(x.completed?"Completado":"Iniciar megaproyecto",()=>act("megaproject",x.id),x.completed||!x.affordable||!!g.pending));megaGrid.append(c)});p.append(megaGrid);
let contracts=el("contracts");contracts.replaceChildren(node("h2","","MERCADO Y CONTRATOS"));let cg=node("div","grid");g.contracts.forEach(x=>{
 const c=card(x.name,"Entregar "+Object.entries(x.needs).map(([k,v])=>v+" "+k).join(", "),"Recompensa: "+x.reward+" créditos / Confianza +"+x.trust);
 const missing=Object.entries(x.needs).filter(([k,v])=>(g.stats[k]??0)<v).map(([k,v])=>k+": faltan "+(v-(g.stats[k]??0)));
 const why=[x.cooldown_hours?"Vuelve a estar disponible en "+x.cooldown_hours+" horas de Ohio.":"",
   g.location!=="village"?"Presentá los contratos en la Aldea Menapace.":"",
   missing.length?"Recursos insuficientes: "+missing.join(", ")+".":"",
   g.pending?"Primero resolvé el acontecimiento pendiente.":""].filter(Boolean).join(" ");
 c.append(btn(x.cooldown_hours?"Disponible en "+x.cooldown_hours+" h":"Entregar",()=>act("contract",x.id),!x.ready||g.location!=="village"||!!g.pending,why));
 cg.append(c);
});contracts.append(cg);
let en=el("environment");en.replaceChildren(node("h2","","ADA-OH · AUTORIDAD AMBIENTAL"));let eg=node("div","grid");let ec=card("Expediente FPSensor","Causas abiertas: "+g.environment.cases+" · Multas acumuladas: "+g.environment.fines+" créditos · Inspecciones: "+g.environment.inspections,"Contaminación actual: "+g.stats.pollution);ec.append(btn("Solicitar inspección (−1 energía)",()=>act("environment","inspect"),g.stats.energy<1||!!g.pending),btn("Jornada de saneamiento (−18 polución)",()=>act("environment","cleanup"),g.stats.credits<750||g.stats.wood<2||!!g.pending),btn("Acuerdo de reparación pública",()=>act("environment","settle"),g.environment.cases===0||!!g.pending),btn("Ofrecer 150.000 créditos al inspector",()=>act("environment","bribe"),g.stats.credits<150000||!!g.pending));eg.append(ec);let envInfo=card("Reglamento de Ohio","La contaminación superior a 12 reduce la confianza. A partir de 40, hay auditorías y multas cada dos días. Las depuradoras eliminan contaminación diariamente.","Ningún funcionario está en venta... o eso afirma la oficina.");eg.append(envInfo);en.append(eg);
render_world(g);
render_space(g);
render_enterprise(g);
render_energy(g);
let logs=el("logs");logs.replaceChildren(node("h2","","BITÁCORA DE OHIO"));[...g.log].reverse().forEach(v=>logs.append(node("div","log",v)));el("restart").hidden=!g.ending;
window.OhioMobile?.update(g);
window.OhioProgression?.update(g);
window.OhioDesktop?.update(g);
}
