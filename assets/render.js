"use strict";
function btn(name,fn,disabled=false){let b=document.createElement("button");b.textContent=name;b.disabled=disabled;b.onclick=fn;return b}
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
el("stats").replaceChildren();for(let [key,val] of Object.entries(g.stats)){let r=node("div","stat");r.append(node("span","",key.toUpperCase()),node("strong","",val));el("stats").append(r)}
el("power").textContent=g.power.used+" / "+g.power.capacity+" unidades almacenadas";el("powerFill").style.width=Math.min(100,100*g.power.used/Math.max(1,g.power.capacity))+"%";
let ev=el("event");ev.replaceChildren();
const pendingIncidents=(g.incidents||[]).filter(i=>i.status==="pending");
if(pendingIncidents.length){
 const inbox=node("section","ohio-incident-inbox");
 inbox.append(node("h2","","CENTRO DE INCIDENTES · "+pendingIncidents.length+" pendiente"+(pendingIncidents.length===1?"":"s")));
 inbox.append(node("p","meta","Las sanciones empiezan después de siete días de juego activo; una vez vencido el plazo se aplica una cada 12 horas activas mientras persista el problema."));
 for(const i of pendingIncidents){
  const item=node("article","ohio-incident");
  item.append(node("strong","",({"electrical":"RED ELÉCTRICA","labor":"PERSONAL INSUFICIENTE","environment":"RIESGO AMBIENTAL","legal":"EXPEDIENTE LEGAL"}[i.type]||"INCIDENTE")+" · "+i.world.toUpperCase()),
    node("p","",(i.type==="electrical"?i.severity+" unidades sin suministro detectadas.":"Gravedad registrada: "+i.severity+".")+" "+i.damage+" daños registrados."),
    node("div","meta",i.grace_remaining_hours>0?"Margen de resolución: "+i.grace_remaining_hours+" horas de juego activo.":"PLAZO VENCIDO · Sanción cada 12 horas activas."),
    node("div","meta",i.penalties+" sanciones aplicadas."));
  inbox.append(item);
 }
 ev.append(inbox);
}
if(g.flags.includes("seized_save")){let raid=node("article","card");raid.append(node("h2","","ORDEN DE ALLANAMIENTO · FISCALÍA DE OHIO"),node("p","","La División de Delitos Patrimoniales detectó alteraciones en los registros de activos. Se ordenó la incautación preventiva de los bienes y la apertura de una nueva colonia bajo supervisión judicial."),node("div","meta","El expediente original fue preservado para revisión. Las passkeys no fueron incautadas."));ev.append(raid);}if(g.ending){let n=node("div","event");n.append(node("h2","","FINAL · "+g.ending.toUpperCase()),node("p","","Ohio recuerda tus decisiones. Podés iniciar otra campaña para explorar otras consecuencias."));if(g.ending==="bankrupt" && g.finance.rescues===0)n.append(btn("Solicitar préstamo de emergencia (+100.000)",()=>act("rescue")));ev.append(n)}
else if(g.decision_event){let d=g.decision_event;let n=node("div","event");n.append(node("h2","",d.title),node("p","",d.description));d.options.forEach(o=>n.append(btn(o.label,()=>act("decision",o.id))));ev.append(n)}
else if(g.pending){let n=node("div","event");let prompts={4:["Explorar el mapa y conservar los planos","Vender los planos al comerciante"],8:["Investigar el consumo subterráneo","Ocultar los registros"],13:["Desviar energía al B-12","Apagar la planta de manera controlada","Sobrecargar el reactor"],20:["Entregar la empresa a la comunidad","Expandir el imperio industrial","Desvelar el secreto de Lázaro"]},codes={4:["explore","ignore"],8:["investigate","conceal"],13:["redirect","shutdown","overdrive"],20:["community","industry","science"]};n.append(node("h2","",({4:"EL MAPA SECRETO",8:"PROYECTO LÁZARO",13:"INCIDENTE DEL REACTOR",20:"LA ASAMBLEA FINAL"})[g.pending]));n.append(node("p","","Decisión estratégica. Tus estadísticas y actos anteriores determinarán el resultado."));if(Array.isArray(prompts[g.pending]))prompts[g.pending].forEach((p,i)=>n.append(btn(p,()=>act("decision",codes[g.pending][i]))));else n.append(node("p","","Acontecimiento pendiente: "+String(g.pending)+". Revisá el registro y el estado del servidor."));ev.append(n)}
let map=el("map");map.replaceChildren(node("h2","","SECTORES / DESPLAZAMIENTO"));let mg=node("div","grid");g.sectors.forEach(s=>{let c=card(s.name,s.desc,s.open?"ACCESIBLE":"DESBLOQUEO: DÍA "+s.unlock);if(s.id===g.location)c.append(node("div","select","● UBICACIÓN ACTUAL"));else c.append(btn(s.open?"Viajar (−1 energía)":"Bloqueado",()=>act("travel",s.id),!s.open||!!g.pending));mg.append(c)});map.append(mg);
let op=el("operations");op.replaceChildren(node("h2","","OPERACIONES DEL SECTOR"));let og=node("div","grid");let descriptions={village:"Atender a los aldeanos (+1 confianza, +80 créditos)",mine:"Extracción (+3 mineral)",forest:"Recolectar madera (+4 madera)",factory:"Turno de fábrica (+380 créditos, +1 contaminación)",lab:"Analizar archivos (+2 inteligencia)",b12:"Investigar subsuelo (+3 inteligencia, +2 contaminación)"};let cc=card(g.sectors.find(s=>s.id===g.location).name,descriptions[g.location],"Consumo: 2 energía");cc.append(btn("Ejecutar turno de trabajo",()=>act("work",g.location),g.stats.energy<2||!!g.pending));og.append(cc);if(["lab","b12"].includes(g.location)){let r=card("Investigación avanzada","Obtiene 3 de inteligencia.","450 créditos · 3 energía");r.append(btn("Investigar",()=>act("research"),g.stats.energy<3||g.stats.credits<450||!!g.pending));og.append(r)}op.append(og);
let p=el("projects");p.replaceChildren(node("h2","","CATÁLOGO DE INSTALACIONES"));let pg=node("div","grid");g.projects.forEach(x=>{let c=card(x.name,x.desc,"Costo "+x.cost+" créditos · "+x.wood+" madera · "+x.ore+" mineral · "+x.power+" energía | Construidas: "+x.owned);c.dataset.projectId=x.id;c.append(btn("Construir",()=>act("build",x.id),!x.affordable||g.location!=="factory"||!!g.pending),btn("Construir lote (1–1000)",()=>{let v=prompt("¿Cuántas instalaciones querés construir? (1–1000)","100");if(v===null)return;let n=Number(v);if(!Number.isInteger(n)||n<1||n>1000){msg("Cantidad inválida: ingresá un número de 1 a 1000.");return;}act("build_batch",x.id,n)},!x.affordable||g.location!=="factory"||!!g.pending));pg.append(c)});p.append(pg);
let research=node("h2","","REVOLUCIÓN TECNOLÓGICA");p.append(research);
let techGrid=node("div","grid");g.tech.forEach(x=>{let c=card(x.name,x.desc,"Créditos "+x.cost+" · Inteligencia "+x.intel+" · Chips "+x.chips+" · Cómputo "+x.compute+(x.requires?" · Requiere "+x.requires:""));c.append(btn(x.unlocked?"Investigada":"Investigar tecnología",()=>act("technology",x.id),x.unlocked||!x.affordable||!!g.pending));techGrid.append(c)});p.append(techGrid);
p.append(node("h2","","MEGAPROYECTOS · NUEVA ERA"));
let megaGrid=node("div","grid");g.megaprojects.forEach(x=>{let c=card(x.name,x.desc,"Créditos "+x.cost+" · Madera "+x.wood+" · Mineral "+x.ore+" · Chips "+x.chips+" · Cómputo "+x.compute);c.append(btn(x.completed?"Completado":"Iniciar megaproyecto",()=>act("megaproject",x.id),x.completed||!x.affordable||!!g.pending));megaGrid.append(c)});p.append(megaGrid);
let contracts=el("contracts");contracts.replaceChildren(node("h2","","MERCADO Y CONTRATOS"));let cg=node("div","grid");g.contracts.forEach(x=>{let c=card(x.name,"Entregar "+Object.entries(x.needs).map(([k,v])=>v+" "+k).join(", "),"Recompensa: "+x.reward+" créditos / Confianza +"+x.trust);c.append(btn(x.completed?"Completado":"Entregar",()=>act("contract",x.id),!x.ready||x.completed||g.location!=="village"||!!g.pending));cg.append(c)});contracts.append(cg);
let en=el("environment");en.replaceChildren(node("h2","","ADA-OH · AUTORIDAD AMBIENTAL"));let eg=node("div","grid");let ec=card("Expediente FPSensor","Causas abiertas: "+g.environment.cases+" · Multas acumuladas: "+g.environment.fines+" créditos · Inspecciones: "+g.environment.inspections,"Contaminación actual: "+g.stats.pollution);ec.append(btn("Solicitar inspección (−1 energía)",()=>act("environment","inspect"),g.stats.energy<1||!!g.pending),btn("Jornada de saneamiento (−18 polución)",()=>act("environment","cleanup"),g.stats.credits<750||g.stats.wood<2||!!g.pending),btn("Acuerdo de reparación pública",()=>act("environment","settle"),g.environment.cases===0||!!g.pending),btn("Ofrecer 150.000 créditos al inspector",()=>act("environment","bribe"),g.stats.credits<150000||!!g.pending));eg.append(ec);let envInfo=card("Reglamento de Ohio","La contaminación superior a 12 reduce la confianza. A partir de 40, hay auditorías y multas cada dos días. Las depuradoras eliminan contaminación diariamente.","Ningún funcionario está en venta... o eso afirma la oficina.");eg.append(envInfo);en.append(eg);
render_world(g);
render_space(g);
render_enterprise(g);
render_energy(g);
let logs=el("logs");logs.replaceChildren(node("h2","","BITÁCORA DE OHIO"));[...g.log].reverse().forEach(v=>logs.append(node("div","log",v)));el("restart").hidden=!g.ending;
window.OhioMobile?.update(g);
window.OhioProgression?.update(g);
}
