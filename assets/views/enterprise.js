"use strict";
function render_enterprise(g){
let enterprise=el("enterprise");enterprise.replaceChildren(node("h2","","OHIO CORPORATION · PERSONAL, INVERSORES Y JUSTICIA"));
let person=g.personnel,overview=card("Balance del grupo","Salarios por día: "+person.payroll+" · Ingreso diario inversores: "+person.income,"Personal industrial requerido: "+person.required_industry+" · Demandas: "+person.lawsuits+" · Acuerdos: "+person.settlements);
enterprise.append(overview);
let employees=node("div","grid");person.roles.forEach(r=>{let c=card(r.name,"Empleados: "+r.count,"Salario individual: "+r.salary+" créditos por día");c.append(btn("Contratar personal",()=>{let raw=prompt("Cantidad para contratar (1–1000)","10");if(raw===null)return;let n=Number(raw);if(!Number.isInteger(n)||n<1||n>1000)return msg("Cantidad inválida.");act("hire",r.id+":"+n)},!!g.pending),btn("Reducir plantilla",()=>{let raw=prompt("Cantidad a desvincular (1–1000)","1");if(raw===null)return;let n=Number(raw);if(!Number.isInteger(n)||n<1||n>1000)return msg("Cantidad inválida.");act("fire",r.id+":"+n)},!r.count||!!g.pending));employees.append(c)});enterprise.append(employees,node("h2","","RELACIONES CON INVERSORES"));
let investors=node("div","grid");person.offers.forEach(i=>{let c=card(i.name,"Financiación: "+i.income+" créditos por jornada","Reputación mínima: "+i.required);c.append(btn(i.signed?"Fondo activo":"Solicitar inversión",()=>act("investor",String(i.id)),i.signed||!!g.pending));investors.append(c)});enterprise.append(investors,node("h2","","AUTORIZACIONES Y LITIGIOS"));
let legal=card("Autoridad Aeroespacial","Autorizaciones vigentes: "+(person.licences.join(", ")||"ninguna")+" · Causas pendientes: "+person.lawsuits,"Tasas de homologación: 150.000 créditos por autorización");
for(const [id,name] of [["launch","Lanzamiento"],["crew","Vuelo tripulado"],["station","Estación orbital"],["lunar","Misión lunar"]])legal.append(btn(person.licences.includes(id)?name+" autorizado":"Homologar "+name,()=>act("licence",id),person.licences.includes(id)||!!g.pending));
legal.append(btn("Acuerdo extrajudicial (750.000)",()=>act("settle_lawsuit"),person.lawsuits===0||!!g.pending));enterprise.append(legal);

}
