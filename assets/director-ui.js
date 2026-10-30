"use strict";
/* Server-authoritative campaign director. Every control changes the actual save. */
window.OhioDirectorUI=(()=>{
 const fmt=n=>Number(n||0).toLocaleString("es-AR");
 function render(g){
  const host=document.getElementById("operations"),d=g.director;
  if(!host||!d)return;
  const statuses={dormant:"Sin descubrir",uncovered:"Descubierto",investigating:"En investigación",revealed:"Hallazgo confirmado",public:"Archivos públicos",private:"Acceso privatizado",sealed:"Sellado"};
  const section=node("section","ohio-director");
  section.setAttribute("aria-label","Consejo de operaciones");
  const top=node("div","ohio-director-top");
  const heading=node("div","","");
  heading.append(node("span","ohio-director-kicker","◈ CONSEJO DE OPERACIONES / INFORME DIARIO"),
   node("h2","","TUS DECISIONES CAMBIAN OHIO"),
   node("p","","Una orden puede mejorar la industria hoy y causar una crisis mañana. El tiempo, las personas y la confianza importan."));
  const gauge=node("div","ohio-morale");
  gauge.append(node("span","","MORAL DE LA TRIPULACIÓN"),
   node("strong","",fmt(d.morale)+"/100"));
  const bar=node("div","ohio-morale-track");
  const fill=node("span","");fill.style.width=Math.max(0,Math.min(100,d.morale))+"%";
  bar.append(fill);gauge.append(bar);
  top.append(heading,gauge);section.append(top);
  const data=node("div","ohio-director-stats");
  for(const [title,value] of [
   ["PRODUCCIÓN",fmt(d.production_percent)+"%"],
   ["DEMANDA ELÉCTRICA",fmt(d.power_percent)+"%"],
   ["VÍCTIMAS ESPACIALES",fmt(d.casualties)],
   ["EXPEDICIÓN B-12",d.b12==="investigating"?fmt(d.expedition_days)+"/6":statuses[d.b12]||d.b12]
  ]){
   const item=node("div","ohio-director-stat");
   item.append(node("small","",title),node("strong","",value));data.append(item);
  }
  section.append(data);
  if(d.mandate_days>0){
   const mandates={innovation:"Innovación industrial",labor:"Pacto laboral",extraction:"Extracción intensiva"};
   const active=node("div","ohio-director-signal",
    "MANDATO EN VIGOR · "+(mandates[d.mandate]||d.mandate)+" · "+d.mandate_days+" jornadas restantes.");
   section.append(active);
  }
  if(d.grounded_days){
   const alert=node("div","ohio-director-alert");
   alert.append(node("strong","","LANZAMIENTOS SUSPENDIDOS · "+d.grounded_days+" días"),
    node("p","","Después de una víctima los vuelos no pueden continuar como si nada. Una auditoría independiente restaura la confianza y reduce el riesgo futuro."));
   alert.append(btn("Auditoría independiente · 1.500.000 créditos + 150 cómputo",
    ()=>act("directive","safety:review"),!!g.pending||g.stats.credits<1500000||g.stats.compute<150));
   section.append(alert);
  }
  const layout=node("div","ohio-director-layout");
  const policy=card("POLÍTICA INDUSTRIAL",
    "Elegí un rumbo. El directorio obliga a sostenerlo tres jornadas antes de volver a cambiar.",
    "Política actual: "+d.policy_options[d.policy].name+" · Costo diario extraordinario: "+fmt(d.daily_strategy)+" créditos");
  for(const [key,item] of Object.entries(d.policy_options)){
   const chosen=d.policy===key;
   const line=node("div","ohio-director-option");
   line.append(node("p","",item.description));
   line.append(btn(chosen?"✓ "+item.name+" · VIGENTE":"Adoptar: "+item.name,
      ()=>act("directive","policy:"+key),chosen||!!g.pending));
   policy.append(line);
  }
  layout.append(policy);
  const auto=card("SISTEMAS AUTÓNOMOS",
   "El sistema ejecuta órdenes cada jornada sin pedirte que vuelvas a pulsar el mismo botón.",
   "Contratos automáticos: hasta 4 por jornada con investigación de nube. Nunca gastan recursos inexistentes.");
  const services=[
   ["contracts","Contratos y exportaciones","Renueva contratos disponibles cada 48 horas, cobra y actualiza inventario."],
   ["repairs","Mantenimiento preventivo","Repara averías de las redes establecidas cuando hay presupuesto."],
   ["staffing","Gestión de plantilla","Contrata automáticamente el personal industrial que exige la capacidad instalada."],
   ["construction","Plan de construcción","Levanta una instalación prioritaria por jornada, si alcanzan créditos y materiales."]
  ];
  for(const [key,title,desc] of services){
   const line=node("div","ohio-director-option");
   line.append(node("strong","",title),node("p","",desc));
   line.append(btn(d.auto[key]?"Desactivar automático":"Activar automático",
     ()=>act("directive","auto:"+key),!!g.pending||(key==="contracts"&&!g.tech.some(t=>t.id==="cloud"&&t.unlocked)),
     key==="contracts"?"Requiere Infraestructura de nube.":""));
   auto.append(line);
  }
  const priority=node("div","ohio-director-priority");
  const select=document.createElement("select");select.setAttribute("aria-label","Prioridad de construcción");
  for(const project of g.projects){
   const option=document.createElement("option");
   option.value=project.id;option.textContent=project.name;
   select.append(option);
  }
  select.value=d.priority;
  priority.append(node("strong","","Próxima construcción programada"),select,
   btn("Guardar prioridad",()=>act("directive","priority:"+select.value),!!g.pending));
  auto.append(priority);
  layout.append(auto);section.append(layout);
  const b12=card("B-12 / PROYECTO LÁZARO",
   "No es solo una bandera de progreso. La expedición requiere financiación, avanza con cómputo y puede alterar para siempre la industria y el gobierno de Ohio.",
   "Estado del expediente: "+(statuses[d.b12]||d.b12)+" · Progreso: "+d.expedition_days+"/6 jornadas de investigación");
  b12.dataset.directorFocus="b12";
  if(d.can_investigate){
   b12.append(btn("Financiar expedición · 1.000.000 créditos, 120 inteligencia, 100 chips",
    ()=>act("directive","b12:expedition"),!!g.pending||g.stats.credits<1000000||g.stats.intel<120||g.stats.chips<100));
  }else if(d.b12==="investigating"){
   b12.append(node("p","ohio-director-signal","TRANSMISIÓN ACTIVA · El equipo consume 40 cómputo por jornada. No requiere clics adicionales."));
   if(g.decisions?.effects?.b12_transparency)b12.append(node("p","meta","Los registros del día ocho aceleran la expedición: dos etapas por jornada."));
  }else if(d.b12==="revealed"){
   b12.append(node("p","ohio-director-signal","EXPEDICIÓN COMPLETA · El consejo deliberará sobre la divulgación del hallazgo."));
  }else if(d.b12==="dormant"){
   b12.append(node("p","meta","Visitá el subsuelo B-12 o descubrí a Lázaro para habilitar una expedición."));
  }
  section.append(b12);
  host.insertBefore(section,host.firstChild.nextSibling);
 }
 return {render};
})();
