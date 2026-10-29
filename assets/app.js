"use strict";
const el=x=>document.getElementById(x),msg=t=>el("message").textContent=t;
const bytes=s=>{let z=atob(s.replace(/-/g,"+").replace(/_/g,"/")+"===".slice((s.length+3)%4));return Uint8Array.from(z,c=>c.charCodeAt(0))};
const b64=v=>{let z="";for(const x of new Uint8Array(v))z+=String.fromCharCode(x);return btoa(z).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")};
async function api(p,data){const base=String(window.OHIO_API_ORIGIN||"").replace(/\/$/,"");let r;try{r=await fetch(base+"/api/"+p,data===undefined?{credentials:"include",cache:"no-store"}:{method:"POST",credentials:"include",cache:"no-store",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});}catch(err){throw Error("Servidor de Ohio desconectado o inaccesible. Verificá la conexión HTTPS y la configuración del servidor.");}let raw=await r.text(),o;try{o=JSON.parse(raw)}catch(_){throw Error("La API devolvió una respuesta no JSON (HTTP "+r.status+"). Revisá la consola del servidor. Ruta: /api/"+p)}if(!r.ok)throw Error(o.error||"Error HTTP "+r.status+" en /api/"+p);return o}
function decode(o){o.challenge=bytes(o.challenge);if(o.user)o.user.id=bytes(o.user.id);for(const key of ["excludeCredentials","allowCredentials"])if(o[key])o[key].forEach(x=>x.id=bytes(x.id));return o}
function serial(c){let r=c.response,v={clientDataJSON:b64(r.clientDataJSON)};for(const k of ["attestationObject","authenticatorData","signature","userHandle"])if(r[k])v[k]=b64(r[k]);if(r.getTransports)v.transports=r.getTransports();return {id:c.id,rawId:b64(c.rawId),type:c.type,response:v,clientExtensionResults:c.getClientExtensionResults()}}
async function safe(f){
 try{
  msg("");
  await f();
  const banner=el("server-connection-banner");
  if(banner){banner.hidden=true;banner.textContent="Servidor de Ohio conectado."}
 }catch(e){
  const message=String(e?.message||e);
  msg(message);
  const originDenied=/Origen web no autorizado/i.test(message);
  const disconnected=/desconectado|inaccesible|Failed to fetch|NetworkError|no JSON|HTTP 502|HTTP 503|HTTP 504|HTTP 403/i.test(message);
  const banner=el("server-connection-banner");
  if(banner&&(originDenied||disconnected)){
   banner.hidden=false;
   banner.textContent=originDenied
    ?"El servidor rechazó esta dirección. Usá http://localhost:8765 en esta PC o https://ohioascension.github.io para la versión pública."
    :"Servidor de Ohio desconectado. Reintentando conexión automáticamente…";
  }
 }
}
let sessionRevision=0;
async function refresh(){
 const revision=sessionRevision;
 let a=await api("auth/status");
 if(revision!==sessionRevision)return;
 if(a.authenticated&&a.lang&&window.OhioI18n)window.OhioI18n.setProfile(a.lang);
 el("authInfo").textContent=a.initialized?"Elegí tu cuenta o registrá un usuario nuevo.":"Registro del primer agente";
 // A credential registered on github.io cannot sign for the localhost RP ID.
 // PC users should open the canonical site to reuse their existing passkey.
 let hint=el("local-passkey-hint");
 const local=location.hostname==="localhost"||location.hostname==="127.0.0.1";
 if(local&&!a.authenticated&&a.public_frontend==="https://ohioascension.github.io"){
  if(!hint){
   hint=document.createElement("p");hint.id="local-passkey-hint";
   hint.className="ohio-public-login-hint";
   const label=document.createElement("span");
   label.textContent="¿Tu passkey está vinculada a GitHub Pages? Para usarla en la PC, ingresá desde el dominio original: ";
   const link=document.createElement("a");
   link.href="https://ohioascension.github.io";link.textContent="Abrir Ohio público";
   hint.append(label,link);
   el("auth").append(hint);
  }
  hint.hidden=false;
 }else if(hint){hint.hidden=true;}
 el("auth").hidden=!!a.authenticated;
 el("lab-name").textContent=a.authenticated?(a.username+" Labs"):"FPSENSOR LABS";
 el("username").hidden=a.authenticated;
 el("register").hidden=a.authenticated;
 el("login").hidden=!a.initialized||a.authenticated;
 el("logout").hidden=!a.authenticated;
 el("game").hidden=!a.authenticated;
 el("sidebar").hidden=!a.authenticated;
 window.OhioMobile?.authenticated(a.authenticated);
 if(a.authenticated){
  const g=await api("game");
  if(revision!==sessionRevision||el("game").hidden)return;
  render(g);pollSignature=signature(g);
  await updateSecurity();
 }else{
  pollSignature=null;
  window.currentGame=null;
 }
}
el("register").onclick=()=>safe(async()=>{let o=decode(await api("auth/register/options",{username:el("username").value,lang:el("login-language")?.value||"default"}));let c=await navigator.credentials.create({publicKey:o});await api("auth/register/verify",serial(c));await refresh()});
el("login").onclick=()=>safe(async()=>{let o=decode(await api("auth/login/options",{username:el("username").value.trim()}));let c=await navigator.credentials.get({publicKey:o});await api("auth/login/verify",serial(c));await refresh()});
el("logout").onclick=()=>safe(async()=>{
 ++sessionRevision; // Invalidate in-flight game and session requests immediately.
 await api("auth/logout",{});
 await refresh();
});
let busy=false;
async function act(kind,target,count){
 if(busy)return;
 busy=true;
 try{await safe(async()=>{
  const payload={kind,target};
  if(kind==="build_batch")payload.count=count;
  const previous=window.currentGame;
  const result=await api("game/action",payload);render(result);pollSignature=signature(result);
  // Animate only after the server confirms the action; never predict success.
  const cinematic=window.OhioCinematics?.observe(previous,result,kind);
  if(window.OhioAudio)OhioAudio.effect(cinematic==="failure"?"launch_failure":cinematic==="launch"?"launch_success":kind);
  window.OhioAmbience?.action(kind);
 })}finally{busy=false}
}
document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{document.querySelectorAll("[data-tab]").forEach(x=>x.classList.toggle("active",x===b));document.querySelectorAll(".view").forEach(v=>v.hidden=v.id!==b.dataset.tab)});
document.querySelectorAll("[data-action]").forEach(b=>{if(b.dataset.action==="advance"){b.hidden=true;b.disabled=true}else b.onclick=()=>act(b.dataset.action)});
const restButton=document.querySelector('[data-action="rest"]');
if(restButton){
 const sleep=document.createElement("button");
 sleep.type="button";sleep.id="night-sleep";sleep.className="full";
 sleep.textContent="Dormir hasta las 08:00 · 250 créditos · energía 10";
 sleep.addEventListener("click",()=>{
  const g=window.currentGame,h=g?.clock?.hour;
  const reasons=[];
  if(!g){msg("La partida todavía no está cargada.");return}
  if(h>=8&&h<20)reasons.push("Solo podés dormir entre las 20:00 y las 08:00.");
  if(g.stats.credits<250)reasons.push("Necesitás 250 créditos para dormir; te faltan "+(250-g.stats.credits)+".");
  if(g.pending)reasons.push("Primero resolvé el acontecimiento pendiente.");
  if(reasons.length){msg(reasons.join(" "));return}
  act("sleep");
 });
 restButton.insertAdjacentElement("afterend",sleep);
}
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

/* Additional, passwordless identity methods: RFC 6238 Authenticator. */
const authMethods=document.createElement("section");
authMethods.className="auth-methods";
authMethods.innerHTML='<h3>Otros métodos de acceso</h3><button type="button" id="ohio-totp-login">Entrar con Authenticator</button> <button type="button" id="ohio-totp-register">Crear cuenta con Authenticator</button><div id="ohio-totp-panel" hidden><p id="ohio-totp-hint"></p><div id="ohio-totp-qr"></div><p id="ohio-totp-secret" style="overflow-wrap:anywhere;user-select:all"></p><label>Código de seis dígitos <input id="ohio-totp-code" inputmode="numeric" autocomplete="one-time-code" maxlength="6"></label><button type="button" id="ohio-totp-confirm">Confirmar</button></div>';
el("auth").appendChild(authMethods);
let totpFlow="";
const totpPanel=document.getElementById("ohio-totp-panel");
const totpHint=document.getElementById("ohio-totp-hint");
const totpSecret=document.getElementById("ohio-totp-secret");
function presentTotpQr(container,data){
 container.replaceChildren();
 const img=document.createElement("img");img.alt="QR para configurar Ohio en Authenticator";img.src=data.qr_data_url;img.width=230;img.height=230;img.style.cssText="max-width:100%;height:auto;border:12px solid white;border-radius:12px;background:white";
 container.appendChild(img);
}

async function totpStart(kind){
 await safe(async()=>{
  totpFlow=kind;totpPanel.hidden=false;totpSecret.textContent="";document.getElementById("ohio-totp-qr").replaceChildren();
  if(kind==="register"||kind==="enroll"){
   const payload=kind==="register"?{username:el("username").value.trim(),lang:el("login-language")?.value||"default"}:{};
   const data=await api(kind==="register"?"auth/totp/register/start":"auth/totp/enroll/start",payload);
   presentTotpQr(document.getElementById("ohio-totp-qr"),data);
   totpSecret.textContent="O copiá esta clave en Authenticator: "+data.secret;
   totpHint.textContent="Escaneá el QR con Google Authenticator. Si estás en el mismo teléfono, copiá la clave de abajo y agregala como clave basada en tiempo. Luego ingresá el código generado.";
  }else totpHint.textContent="Ingresá el código de Google Authenticator para esta cuenta.";
 });
}
document.getElementById("ohio-totp-register").onclick=()=>totpStart("register");
document.getElementById("ohio-totp-login").onclick=()=>totpStart("login");
document.getElementById("ohio-totp-confirm").onclick=()=>safe(async()=>{
 const code=document.getElementById("ohio-totp-code").value.trim();
 if(!/^[0-9]{6}$/.test(code))throw Error("Ingresá seis dígitos");
 const path=totpFlow==="register"?"auth/totp/register/verify":"auth/totp/login";
 const payload=totpFlow==="register"?{code}:{username:el("username").value.trim(),code};
 await api(path,payload);
 totpPanel.hidden=true;document.getElementById("ohio-totp-code").value="";
 await refresh();
});
const securityPanel=document.createElement("section");
securityPanel.innerHTML='<h3>SEGURIDAD DE CUENTA</h3><p id="ohio-security-status"></p><button type="button" id="ohio-add-totp">Activar Authenticator</button> <button type="button" id="ohio-add-passkey">Agregar passkey</button><div id="ohio-enroll-panel" hidden><p>En Google Authenticator, agregá una clave basada en tiempo:</p><div id="ohio-enroll-qr"></div><p id="ohio-enroll-secret" style="overflow-wrap:anywhere;user-select:all"></p><label>Código de seis dígitos <input id="ohio-enroll-code" inputmode="numeric" maxlength="6"></label><button type="button" id="ohio-confirm-enroll">Activar</button></div>';
(el("ohio-security-slot")||el("sidebar")).appendChild(securityPanel);
async function updateSecurity(){
 if(el("sidebar").hidden)return;
 const st=await api("auth/security/status");
 document.getElementById("ohio-security-status").textContent="Passkeys: "+st.passkeys+" · Authenticator: "+(st.totp?"activo":"inactivo");
 document.getElementById("ohio-add-totp").hidden=st.totp;
}
document.getElementById("ohio-add-totp").onclick=()=>safe(async()=>{
 const data=await api("auth/totp/enroll/start",{});
 document.getElementById("ohio-enroll-panel").hidden=false;
 presentTotpQr(document.getElementById("ohio-enroll-qr"),data);
 document.getElementById("ohio-enroll-secret").textContent="O copiá esta clave en Authenticator: "+data.secret;
});
document.getElementById("ohio-confirm-enroll").onclick=()=>safe(async()=>{
 await api("auth/totp/enroll/verify",{code:document.getElementById("ohio-enroll-code").value.trim()});
 document.getElementById("ohio-enroll-panel").hidden=true;await updateSecurity();
});
document.getElementById("ohio-add-passkey").onclick=()=>safe(async()=>{
 let o=decode(await api("auth/passkeys/add/options",{}));
 let credential=await navigator.credentials.create({publicKey:o});
 if(!credential)throw Error("Registro de passkey cancelado");
 await api("auth/passkeys/add/verify",serial(credential));await updateSecurity();
});
safe(async()=>{await refresh();await updateSecurity()});

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
let polling=false;
setInterval(()=>{
 if(polling||busy||el("game").hidden||document.visibilityState!=="visible")return;
 polling=true;
 const revision=sessionRevision;
 safe(async()=>{
  const g=await api("game");
  if(revision!==sessionRevision||el("game").hidden)return;
  const next=signature(g);
  if(next!==pollSignature){render(g);pollSignature=next}
  else paintClock(g);
 }).finally(()=>{polling=false});
},10000);


// Restore sessions and the menu after a network interruption, even if the
// player is still on the unauthenticated landing screen.
let lastConnectRetry=0;
async function reconnectWhenNeeded(){
 const banner=el("server-connection-banner");
 if(!banner||banner.hidden||document.visibilityState!=="visible")return;
 const now=Date.now();
 if(now-lastConnectRetry<14000)return;
 lastConnectRetry=now;
 await safe(refresh);
}
window.addEventListener("online",reconnectWhenNeeded);
window.addEventListener("pageshow",reconnectWhenNeeded);
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")reconnectWhenNeeded()});
setInterval(reconnectWhenNeeded,16000);
