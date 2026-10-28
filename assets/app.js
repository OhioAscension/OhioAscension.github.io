"use strict";
const el=x=>document.getElementById(x),msg=t=>el("message").textContent=t;
const bytes=s=>{let z=atob(s.replace(/-/g,"+").replace(/_/g,"/")+"===".slice((s.length+3)%4));return Uint8Array.from(z,c=>c.charCodeAt(0))};
const b64=v=>{let z="";for(const x of new Uint8Array(v))z+=String.fromCharCode(x);return btoa(z).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")};
async function api(p,data){const base=String(window.OHIO_API_ORIGIN||"").replace(/\/$/,"");let r;try{r=await fetch(base+"/api/"+p,data===undefined?{credentials:"include"}:{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});}catch(err){throw Error("Servidor de Ohio desconectado o inaccesible. Verificá la conexión HTTPS y la configuración del servidor.");}let raw=await r.text(),o;try{o=JSON.parse(raw)}catch(_){throw Error("La API devolvió una respuesta no JSON (HTTP "+r.status+"). Revisá la consola del servidor. Ruta: /api/"+p)}if(!r.ok)throw Error(o.error||"Error HTTP "+r.status+" en /api/"+p);return o}
function decode(o){o.challenge=bytes(o.challenge);if(o.user)o.user.id=bytes(o.user.id);for(const key of ["excludeCredentials","allowCredentials"])if(o[key])o[key].forEach(x=>x.id=bytes(x.id));return o}
function serial(c){let r=c.response,v={clientDataJSON:b64(r.clientDataJSON)};for(const k of ["attestationObject","authenticatorData","signature","userHandle"])if(r[k])v[k]=b64(r[k]);if(r.getTransports)v.transports=r.getTransports();return {id:c.id,rawId:b64(c.rawId),type:c.type,response:v,clientExtensionResults:c.getClientExtensionResults()}}
async function safe(f){try{msg("");await f();const banner=el("server-connection-banner");if(banner)banner.hidden=true;}catch(e){msg(e.message);if(/desconectado|inaccesible|Failed to fetch|NetworkError|no JSON|HTTP 502|HTTP 503|HTTP 504/i.test(e.message)){const banner=el("server-connection-banner");if(banner)banner.hidden=false;}}}
async function refresh(){
 let a=await api("auth/status");
 el("authInfo").textContent=a.initialized?"Elegí tu cuenta o registrá un usuario nuevo.":"Registro del primer agente";
 el("auth").hidden=!!a.authenticated;
 el("lab-name").textContent=a.authenticated?(a.username+" Labs"):"FPSENSOR LABS";
 el("username").hidden=a.authenticated;
 el("register").hidden=a.authenticated;
 el("login").hidden=!a.initialized||a.authenticated;
 el("logout").hidden=!a.authenticated;
 el("game").hidden=!a.authenticated;
 el("sidebar").hidden=!a.authenticated;
 window.OhioMobile?.authenticated(a.authenticated);
 if(a.authenticated){const g=await api("game");render(g);pollSignature=signature(g);}
}
el("register").onclick=()=>safe(async()=>{let o=decode(await api("auth/register/options",{username:el("username").value}));let c=await navigator.credentials.create({publicKey:o});await api("auth/register/verify",serial(c));await refresh()});
el("login").onclick=()=>safe(async()=>{let o=decode(await api("auth/login/options",{username:el("username").value.trim()}));let c=await navigator.credentials.get({publicKey:o});await api("auth/login/verify",serial(c));await refresh()});
el("logout").onclick=()=>safe(async()=>{await api("auth/logout",{});await refresh()});
let busy=false;
async function act(kind,target,count){
 if(busy)return;
 busy=true;
 try{await safe(async()=>{
  const payload={kind,target};
  if(kind==="build_batch")payload.count=count;
  const result=await api("game/action",payload);render(result);pollSignature=signature(result);
  if(window.OhioAudio)OhioAudio.effect(kind);
  window.OhioAmbience?.action(kind);
 })}finally{busy=false}
}
document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{document.querySelectorAll("[data-tab]").forEach(x=>x.classList.toggle("active",x===b));document.querySelectorAll(".view").forEach(v=>v.hidden=v.id!==b.dataset.tab)});
document.querySelectorAll("[data-action]").forEach(b=>{if(b.dataset.action==="advance"){b.hidden=true;b.disabled=true}else b.onclick=()=>act(b.dataset.action)});
// Keyboard controls: Tab / Shift+Tab remain native and accessible.
document.addEventListener("keydown",e=>{
 const t=e.target;
 if(e.altKey||e.ctrlKey||e.metaKey||["INPUT","TEXTAREA","SELECT"].includes(t.tagName)||t.isContentEditable)return;
 const tabs=[...document.querySelectorAll("[data-tab]")];
 const current=tabs.findIndex(b=>b.classList.contains("active"));
 if(e.key==="ArrowRight"||e.key==="ArrowLeft"){
  if(!el("game").hidden&&current>=0){e.preventDefault();const next=tabs[(current+(e.key==="ArrowRight"?1:-1)+tabs.length)%tabs.length];next.click();next.focus();}
 }else if(/^Digit[1-9]$/.test(e.code)&&!el("game").hidden){
  const next=tabs[Number(e.code.slice(5))-1];if(next){e.preventDefault();next.click();next.focus();}
 }else if(e.key==="Escape"&&document.activeElement instanceof HTMLElement){document.activeElement.blur();}
});
el("restart").onclick=()=>safe(async()=>render(await api("game/restart",{})));
const audioToggle=el("audio-toggle");
const MUSIC_PREF="ohio-music-enabled";
let musicWanted=localStorage.getItem(MUSIC_PREF)==="true";
function updateMusicLabel(){if(audioToggle)audioToggle.textContent=musicWanted?"Silenciar música":"Activar música"}
updateMusicLabel();
if(audioToggle)audioToggle.onclick=async()=>{
 try{
  if(musicWanted){OhioAudio.pause();musicWanted=false}
  else {musicWanted=await OhioAudio.start()}
  localStorage.setItem(MUSIC_PREF,String(musicWanted));
  updateMusicLabel();
 }catch(e){msg("Audio no disponible: "+e.message)}
};
// Browsers forbid audible autoplay without interaction. Honor saved preference
// at the first permitted input, without asking for another click on the audio toggle.
function restoreMusic(){
 if(!musicWanted||OhioAudio.status())return;
 OhioAudio.start().catch(()=>{});
}
for(const event of ["pointerdown","keydown"])document.addEventListener(event,restoreMusic,{passive:true});

const musicSlider=document.getElementById("music-volume"),musicReadout=document.getElementById("music-volume-value");
if(musicSlider){
 const stored=localStorage.getItem("ohio-music-volume");
 const saved=stored===null?50:Number(stored);
 const initial=Number.isFinite(saved)&&saved>=0&&saved<=100?saved:50;
 musicSlider.value=String(initial);
 OhioAudio.setMusicVolume(initial/100);
 musicReadout.textContent=initial+"%";
 musicSlider.addEventListener("input",()=>{
  const n=Number(musicSlider.value);
  OhioAudio.setMusicVolume(n/100);musicReadout.textContent=n+"%";
  localStorage.setItem("ohio-music-volume",String(n));
 });
}
safe(refresh);

// Polling lento: el servidor es la autoridad temporal, no el reloj del navegador.
// Re-render only when authoritative game state changes, not every clock minute.
let pollSignature=null;
function signature(g){
 const copy={...g,clock:{...g.clock,minute:0}};
 return JSON.stringify(copy);
}
function paintClock(g){
 const time=String(g.clock.hour).padStart(2,"0")+":"+String(g.clock.minute).padStart(2,"0");
 const clock=el("mobile-clock");if(clock)clock.textContent=time;
 const live=el("live-clock");if(live)live.textContent=time;
 const summary=el("summary");
 if(summary&&window.currentGame){
  summary.textContent=summary.textContent.replace(/(Día \d+ · )\d{2}:\d{2}/,"$1"+time);
 }
}
setInterval(()=>{if(!busy&&!el("game").hidden&&document.visibilityState==="visible")safe(async()=>{
 const g=await api("game"),next=signature(g);
 if(next!==pollSignature){render(g);pollSignature=next}
 else paintClock(g);
})},10000);
