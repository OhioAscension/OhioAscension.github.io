"use strict";
function render_space(g){
let space=el("space");space.replaceChildren(node("h2","","PROGRAMA AEROESPACIAL · PRUEBAS Y DESARROLLO"));
let a=g.aerospace, ac=card("Centro de lanzamientos de Ohio","Etapas superadas: "+a.stage+"/"+a.completed+" · Intentos: "+a.attempts+" · Fallos: "+a.failures+" · Reputación espacial: "+a.reputation,"Próxima prueba: "+(a.current?a.current.name:"Campaña orbital completada"));
if(a.blocked){ac.append(node("p","","LANZAMIENTOS SUSPENDIDOS · Se requiere investigación correctiva "+a.blocked));let repair=a.repair_options.find(x=>x.id===a.blocked);if(repair)ac.append(btn("Investigar "+repair.name+" · "+repair.credits+" créditos",()=>act("aero_repair",repair.id),!!g.pending));}
else if(a.current)ac.append(btn("Preparar y lanzar prototipo · "+a.current.credits+" créditos",()=>act("aero_attempt"),!!g.pending));
space.append(ac,node("h2","","COLONIAS EXTRATERRESTRES · LUNA Y MARTE"));
let spaceGrid=node("div","grid");g.space.forEach(p=>{let buildings=p.structures;let c=card(p.name,"Base: "+(p.active?"fundada":"sin fundar")+" · Autosuficiencia: "+(p.self_sufficient?"LOGRADA":"pendiente"),p.active?"Hábitats "+buildings.habitat+"/"+p.required.habitat+" · Solares "+buildings.solar+"/"+p.required.solar+" · Extractores "+buildings.extractor+"/"+p.required.extractor+" · Mineral local "+buildings.ore:"Lanzamiento "+p.launch+" créditos · "+p.ore+" mineral · "+p.chips+" chips · "+p.compute+" cómputo");
if(!p.active)c.append(btn("Fundar base",()=>act("space_launch",p.id),!!g.pending));
else c.append(btn("Construir solar",()=>act("space_build",p.id+":solar"),!!g.pending),btn("Construir hábitat",()=>act("space_build",p.id+":habitat"),!!g.pending),btn("Construir extractor",()=>act("space_build",p.id+":extractor"),!!g.pending),btn("Transportar 1000 mineral desde Tierra",()=>act("space_transfer",p.id),!!g.pending));spaceGrid.append(c)});space.append(spaceGrid);

}
