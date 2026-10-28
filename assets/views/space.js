"use strict";
function render_space(g){
let space=el("space");space.replaceChildren(node("h2","","PROGRAMA AEROESPACIAL · PRUEBAS Y DESARROLLO"));
let a=g.aerospace, ac=card("Centro de lanzamientos de Ohio","Etapas superadas: "+a.stage+"/"+a.completed+" · Intentos: "+a.attempts+" · Fallos: "+a.failures+" · Reputación espacial: "+a.reputation,"Próxima prueba: "+(a.current?a.current.name:"Campaña orbital completada"));
if(a.blocked){ac.append(node("p","","LANZAMIENTOS SUSPENDIDOS · Se requiere investigación correctiva "+a.blocked));let repair=a.repair_options.find(x=>x.id===a.blocked);if(repair)ac.append(btn("Investigar "+repair.name+" · "+repair.credits+" créditos",()=>act("aero_repair",repair.id),!!g.pending));}
else if(a.current)ac.append(btn("Preparar y lanzar prototipo · "+a.current.credits+" créditos",()=>act("aero_attempt"),!!g.pending));
space.append(ac,node("h2","","COLONIAS EXTRATERRESTRES · LUNA Y MARTE"));
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
