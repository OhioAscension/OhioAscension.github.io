"use strict";
function render_space(g){
let space=el("space");space.replaceChildren(node("h2","","PROGRAMA AEROESPACIAL · PRUEBAS Y DESARROLLO"));
let a=g.aerospace, ac=card("Centro de lanzamientos de Ohio","Etapas superadas: "+a.stage+"/"+a.completed+" · Intentos: "+a.attempts+" · Fallos: "+a.failures+" · Reputación espacial: "+a.reputation,"Próxima prueba: "+(a.current?a.current.name:"Campaña orbital completada"));
if(a.blocked){ac.append(node("p","","LANZAMIENTOS SUSPENDIDOS · Se requiere investigación correctiva "+a.blocked));let repair=a.repair_options.find(x=>x.id===a.blocked);if(repair)ac.append(btn("Investigar "+repair.name+" · "+repair.credits+" créditos",()=>act("aero_repair",repair.id),!!g.pending));}
else if(a.current)ac.append(btn("Preparar y lanzar prototipo · "+a.current.credits+" créditos",()=>act("aero_attempt"),!!g.pending));
space.append(ac);
const ohioNet=g.megaprojects.find(project=>project.id==="ohio_net");
if(ohioNet){
 const cloudReady=g.tech.some(tech=>tech.id==="cloud"&&tech.unlocked);
 const needs=[
  !cloudReady?"Investigá Infraestructura de nube (Construcción → Revolución tecnológica).":"",
  ...[["credits","créditos","cost"],["wood","madera","wood"],["ore","mineral","ore"],["chips","chips","chips"],["compute","cómputo","compute"]]
   .filter(([key,,costKey])=>g.stats[key]<ohioNet[costKey])
   .map(([key,label,costKey])=>"Faltan "+(ohioNet[costKey]-g.stats[key]).toLocaleString("es-AR")+" "+label+"."),
  g.pending?"Resolvé primero el acontecimiento pendiente.":""
 ].filter(Boolean);
 const status=ohioNet.completed
  ?"OhioNet está operativa. La red soberana ya permite avanzar hacia la Luna."
  :"Requisito obligatorio para fundar la base lunar y desplegar puestos fuera de la Tierra.";
 const netCard=card("OhioNet · Red soberana",status,
  "Costo: "+ohioNet.cost.toLocaleString("es-AR")+" créditos · "+ohioNet.wood.toLocaleString("es-AR")+" madera · "+ohioNet.ore.toLocaleString("es-AR")+" mineral · "+ohioNet.chips.toLocaleString("es-AR")+" chips · "+ohioNet.compute.toLocaleString("es-AR")+" cómputo");
 netCard.dataset.megaprojectId="ohio_net";
 if(needs.length&&!ohioNet.completed)netCard.append(node("p","meta",needs.join(" ")));
 netCard.append(btn(ohioNet.completed?"OhioNet completada":"Completar OhioNet",()=>act("megaproject","ohio_net"),
  ohioNet.completed||!ohioNet.affordable||!!g.pending,needs.join(" ")));
 space.append(node("h2","","INFRAESTRUCTURA PREVIA AL LANZAMIENTO"),netCard);
}
// Helios is part of the aerospace roadmap, not a secret control at the end of Energy.
const outposts=g.energy_worlds.filter(world=>world.id!=="earth");
const missingOutposts=outposts.filter(world=>!world.established);
const heliosReady=outposts.filter(world=>["moon","mars"].includes(world.id)).every(world=>world.established);
const heliosRequirements=[
 !heliosReady?"Primero necesitás puestos en la Luna y Marte.":"",
 g.stats.credits<5000000?"Faltan "+(5000000-g.stats.credits).toLocaleString("es-AR")+" créditos para un colector.":"",
 g.stats.chips<250?"Faltan "+(250-g.stats.chips).toLocaleString("es-AR")+" chips.":"",
 g.pending?"Resolvé el acontecimiento pendiente.":""
].filter(Boolean);
const heliosCard=card("PROYECTO HELIOS · RED SOLAR DEL SISTEMA",
 "Colectores: "+g.helios.collectors+" · Repetidores: "+g.helios.relay+
 " · Puestos establecidos: "+(outposts.length-missingOutposts.length)+"/"+outposts.length,
 "Helios se habilita con puestos en Luna y Marte. Cada pareja entrega hasta 1.000 unidades/h a redes con déficit; 3 créditos por unidad retransmitida.");
if(heliosRequirements.length)heliosCard.append(node("p","meta",heliosRequirements.join(" ")));
heliosCard.append(btn("Desplegar colector · 5.000.000 créditos + 250 chips",
 ()=>act("helios_build"),heliosRequirements.length>0,heliosRequirements.join(" ")));
const relayRequirements=[
 !g.helios.active?"Primero desplegá al menos un colector.":"",
 g.stats.credits<2000000?"Faltan "+(2000000-g.stats.credits).toLocaleString("es-AR")+" créditos.":"",
 g.pending?"Resolvé el acontecimiento pendiente.":""
].filter(Boolean);
heliosCard.append(btn("Construir repetidor · 2.000.000 créditos",
 ()=>act("helios_route"),relayRequirements.length>0,relayRequirements.join(" ")));
space.append(node("h2","","PROYECTO HELIOS · SIGUIENTE ETAPA"),heliosCard);
space.append(node("h2","","COLONIAS EXTRATERRESTRES · LUNA Y MARTE"));
let spaceGrid=node("div","grid");g.space.forEach(p=>{let buildings=p.structures;let c=card(p.name,"Base: "+(p.active?"fundada":"sin fundar")+" · Autosuficiencia: "+(p.self_sufficient?"LOGRADA":"pendiente"),p.active?"Hábitats "+buildings.habitat+"/"+p.required.habitat+" · Solares "+buildings.solar+"/"+p.required.solar+" · Extractores "+buildings.extractor+"/"+p.required.extractor+" · Mineral local "+buildings.ore:"Lanzamiento "+p.launch+" créditos · "+p.ore+" mineral · "+p.chips+" chips · "+p.compute+" cómputo");
if(!p.active){
 const why=[g.pending?"Resolvé el acontecimiento pendiente.":"",
 !g.megaprojects.some(m=>m.id==="ohio_net"&&m.completed)?"Primero completá OhioNet.":"",
 g.aerospace.stage<g.aerospace.completed?"Completá la campaña aeroespacial.":"",
 !g.personnel.licences.includes("lunar")?"Necesitás autorización de misión lunar.":"",
 g.stats.credits<p.launch?"Faltan "+(p.launch-g.stats.credits)+" créditos.":"",
 ...["ore","chips","compute"].filter(k=>g.stats[k]<p[k]).map(k=>"Faltan "+(p[k]-g.stats[k])+" "+k+".")].filter(Boolean);
 c.append(btn("Fundar base · "+p.launch.toLocaleString("es-AR")+" créditos",()=>act("space_launch",p.id),why.length>0,why.join(" ")));
}
else{
 for(const [id,label] of [["solar","Construir solar"],["habitat","Construir hábitat"],["extractor","Construir extractor"]]){
  const price=p[id],why=[g.pending?"Resolvé el acontecimiento pendiente.":"",
    g.stats.credits<price?"Faltan "+(price-g.stats.credits)+" créditos.":"",
    id!=="solar"&&buildings.solar<=buildings[id]?"Necesitás un panel solar adicional.":""].filter(Boolean);
  c.append(btn(label+" · "+price.toLocaleString("es-AR")+" créditos",()=>act("space_build",p.id+":"+id),why.length>0,why.join(" ")));
 }
 const why=[g.pending?"Resolvé el acontecimiento pendiente.":"",
  g.stats.credits<1500000?"Faltan "+(1500000-g.stats.credits)+" créditos.":"",
  g.stats.ore<1000?"Faltan "+(1000-g.stats.ore)+" mineral." :""].filter(Boolean);
 c.append(btn("Transportar 1000 mineral · 1.500.000 créditos",()=>act("space_transfer",p.id),why.length>0,why.join(" ")));
}spaceGrid.append(c)});space.append(spaceGrid);

}
