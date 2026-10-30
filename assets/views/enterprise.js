"use strict";
function render_enterprise(g){
let enterprise=el("enterprise");enterprise.replaceChildren(node("h2","","OHIO CORPORATION · PERSONAL, INVERSORES Y JUSTICIA"));
let person=g.personnel,overview=card("Balance del grupo","Salarios por día: "+person.payroll+" · Ingreso diario inversores: "+person.income,"Personal industrial requerido: "+person.required_industry+" · Demandas: "+person.lawsuits+" · Acuerdos: "+person.settlements);
enterprise.append(overview);
let employees=node("div","grid");
person.roles.forEach(r=>{
 const c=card(r.name,"Empleados: "+r.count,"Salario individual: "+r.salary+" créditos por día");
 const form=document.createElement("form");
 form.className="ohio-workforce-form";
 form.setAttribute("aria-label","Gestión de personal · "+r.name);
 const label=node("label","ohio-workforce-label","Cantidad de trabajadores (1–1000)");
 const quantity=document.createElement("input");
 quantity.type="number";quantity.min="1";quantity.max="1000";quantity.step="1";
 quantity.value="10";quantity.inputMode="numeric";quantity.required=true;
 quantity.className="ohio-workforce-quantity";
 quantity.id="employees-"+r.id;
 label.htmlFor=quantity.id;
 const actions=node("div","ohio-workforce-actions");
 const feedback=node("p","ohio-workforce-feedback","");
 feedback.setAttribute("role","status");feedback.setAttribute("aria-live","polite");
 const getQuantity=()=>{
  const raw=quantity.value.trim();
  const n=Number(raw);
  if(!raw||!Number.isSafeInteger(n)||n<1||n>1000){
   feedback.textContent="Ingresá una cantidad entera de 1 a 1000.";
   quantity.setCustomValidity("Cantidad inválida");
   quantity.reportValidity();
   return null;
  }
  quantity.setCustomValidity("");
  feedback.textContent="";
  return n;
 };
 quantity.addEventListener("input",()=>{quantity.setCustomValidity("");feedback.textContent=""});
 const hire=btn("Contratar personal",()=>{
  const n=getQuantity();if(n!==null)act("hire",r.id+":"+n);
 },!!g.pending);
 hire.type="button";
 const fire=btn("Reducir plantilla",()=>{
  const n=getQuantity();if(n!==null)act("fire",r.id+":"+n);
 },!r.count||!!g.pending);
 fire.type="button";
 form.addEventListener("submit",event=>{event.preventDefault();hire.click()});
 actions.append(hire,fire);
 form.append(label,quantity,actions,feedback);
 c.append(form);employees.append(c);
});
enterprise.append(employees,node("h2","","RELACIONES CON INVERSORES"));
let investors=node("div","grid");person.offers.forEach(i=>{
 const details="Reputación requerida: "+i.required+" · Actual: "+g.aerospace.reputation+
  (i.id===3?" · Nivel orbital "+(i.funding_level+1)+"/5":"");
 const c=card(i.name,"Financiación: "+i.income.toLocaleString("es-AR")+" créditos por jornada",details);
 if(!i.eligible&&!i.signed)c.append(node("p","meta","Todavía no cumplís los requisitos. Los logros espaciales existentes cuentan retroactivamente."));
 c.append(btn(i.signed?"Fondo activo":"Solicitar inversión",()=>act("investor",String(i.id)),i.signed||!i.eligible||!!g.pending));
 investors.append(c);
});
enterprise.append(investors);
const a=g.aerospace;
const certification=card("HOMOLOGACIÓN AEROESPACIAL",
 "Reputación: "+a.reputation+" (lanzamientos: "+a.launch_reputation+" · infraestructura: +"+a.experience_bonus+")",
 "Después de las ocho etapas podés auditar tus operaciones para recuperar +8 reputación. Costo: 2.000.000 créditos, 150 chips y 150 cómputo. Renovación cada 24 horas de Ohio.");
const missing=[
 a.stage<a.completed?"Completá primero las ocho etapas aeroespaciales.":"",
 a.certification_remaining_hours>0?"Disponible dentro de "+a.certification_remaining_hours+" horas de Ohio.":"",
 a.reputation>=80?"Ya alcanzaste la reputación máxima necesaria.":"",
 g.stats.credits<2000000?"Necesitás 2.000.000 créditos.":"",
 g.stats.chips<150?"Necesitás 150 chips.":"",
 g.stats.compute<150?"Necesitás 150 cómputo.":"",
 g.pending?"Resolvé el acontecimiento pendiente.":""
].filter(Boolean);
if(missing.length)certification.append(node("p","meta",missing.join(" ")));
certification.append(btn("Homologar operaciones · +8 reputación",()=>act("aero_certify"),missing.length>0,missing.join(" ")));
enterprise.append(node("h2","","REPUTACIÓN Y EXPERIENCIA ESPACIAL"),certification,node("h2","","AUTORIZACIONES Y LITIGIOS"));
let legal=card("Autoridad Aeroespacial","Autorizaciones vigentes: "+(person.licences.join(", ")||"ninguna")+" · Causas pendientes: "+person.lawsuits,"Tasas de homologación: 150.000 créditos por autorización");
for(const [id,name] of [["launch","Lanzamiento"],["crew","Vuelo tripulado"],["station","Estación orbital"],["lunar","Misión lunar"]])legal.append(btn(person.licences.includes(id)?name+" autorizado":"Homologar "+name,()=>act("licence",id),person.licences.includes(id)||!!g.pending));
legal.append(btn("Acuerdo extrajudicial (750.000)",()=>act("settle_lawsuit"),person.lawsuits===0||!!g.pending));enterprise.append(legal);

}
