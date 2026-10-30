"use strict";
const $=id=>document.getElementById(id);
const apiBase=()=>String(window.OHIO_API_ORIGIN||"").replace(/\/$/,"");
async function api(path,post){
 const options={credentials:"include",cache:"no-store"};
 if(post!==undefined){options.method="POST";options.headers={"Content-Type":"application/json"};options.body=JSON.stringify(post);}
 const response=await fetch(apiBase()+"/api/"+path,options);
 const data=await response.json();
 if(!response.ok)throw Error(data.error||"HTTP "+response.status);
 return data;
}
const fmt=n=>Number(n||0).toLocaleString("es-AR");
const hours=n=>(Number(n||0)/3600).toFixed(2)+" h";
const date=s=>s?new Date(s).toLocaleString("es-AR"):"Sin registro";
function cell(row,value){const td=document.createElement("td");td.textContent=String(value??"—");row.append(td);}
function metric(label,value){
 const div=document.createElement("div");div.className="stat";
 const strong=document.createElement("strong");strong.textContent=String(value);
 const small=document.createElement("span");small.textContent=label;
 div.append(strong,small);return div;
}
let lastSnapshot=null,loading=false;
function draw(data){
 lastSnapshot=data;
 $("updated").textContent="Actualizado: "+date(data.generated_at);
 $("totals").replaceChildren(
  metric("Cuentas registradas",fmt(data.accounts)),
  metric("Partidas en cuentas mostradas",fmt(data.game_saves)),
  metric("Cuentas con Authenticator",fmt(data.registered_totp_accounts)),
  metric("Passkeys registradas",fmt(data.registered_passkeys)),
  metric("Cuentas con actividad medida",fmt(data.activity_tracked_accounts)),
  metric("Tiempo activo estimado, total",hours(data.estimated_active_seconds)),
  metric("Cuentas en esta página",fmt(data.accounts_shown)),
  metric("Tiempo activo servidor",hours(data.server?.uptime_seconds)),
  metric("Respuestas HTTP",fmt(data.server?.http_responses)),
  metric("HTTP 5xx",fmt(Object.entries(data.server?.http_status_codes||{}).reduce((total,[status,n])=>total+(status.startsWith("5")?n:0),0)))
 );
 const body=$("users");body.replaceChildren();
 for(const user of data.users){
  const tr=document.createElement("tr"),save=user.save||{},activity=user.activity||{};
  cell(tr,user.username+" (#"+user.id+")"+(user.registered_at?" · alta "+date(user.registered_at):""));
  cell(tr,(user.auth.totp?"TOTP":"Sin TOTP")+" · "+user.auth.passkeys+" passkeys");
  cell(tr,save.status);
  cell(tr,save.status==="ok"?"Día "+save.day+" · "+fmt(save.credits)+" cr.":"—");
  cell(tr,save.status==="ok"?fmt(save.installation_count)+" instalaciones · etapa "+save.aerospace_stage+" · "+fmt(save.outposts)+" puestos":"—");
  cell(tr,hours(activity.active_seconds)+" · "+fmt(activity.actions)+" acciones");
  cell(tr,date(activity.last_seen));
  body.append(tr);
 }
 $("notes").replaceChildren(...data.notes.map(note=>{let li=document.createElement("li");li.textContent=note;return li;}));
 $("dashboard").hidden=false;
}
async function load(){
 if(loading)return;
 loading=true;$("refresh").disabled=true;
 try{
  const status=await api("auth/status");
  if(!status.admin){$("auth-warning").hidden=false;$("dashboard").hidden=true;$("status").textContent="Acceso administrativo requerido.";return;}
  $("auth-warning").hidden=true;
  draw(await api("admin/overview"));
  $("status").textContent="";
 }catch(error){$("status").textContent="No se pudo leer el servidor: "+error.message;}
 finally{loading=false;$("refresh").disabled=false;}
}
$("refresh").addEventListener("click",load);
$("logout").addEventListener("click",async()=>{
 try{await api("auth/logout",{});window.location.assign(new URL("./",location.href).href);}
 catch(error){$("status").textContent="No se pudo cerrar la sesión: "+error.message;}
});
$("export").addEventListener("click",()=>{
 if(!lastSnapshot)return;
 const blob=new Blob([JSON.stringify(lastSnapshot,null,2)],{type:"application/json"});
 const url=URL.createObjectURL(blob);
 const link=document.createElement("a");link.href=url;link.download="ohio-admin-telemetry.json";link.click();
 URL.revokeObjectURL(url);
});
load();
setInterval(()=>{if(document.visibilityState==="visible")load();},30000);
