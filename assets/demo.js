"use strict";
/* OHIO cinematic showcase: five live engine chapters × fifteen seconds. */
const $=id=>document.getElementById(id);
const ACT_MS=15000,BEAT_COUNT=5,TOTAL_MS=5*ACT_MS;
const frame=$("game-frame"),trailer=$("trailer"),progress=$("bar-progress");
const audio=window.OhioTrailerAudio;
const cueNames={
 reveal:"NUEVA HISTORIA",move:"DESPLAZAMIENTO",work:"RECURSOS OBTENIDOS",
 build:"CONSTRUCCIÓN COMPLETADA",power:"ENERGÍA DISPONIBLE",
 blackout:"CORTE DE SUMINISTRO",warning:"INCIDENTE DETECTADO",
 recover:"OPERACIÓN DE SANEAMIENTO",resolve:"CRISIS RESUELTA",
 approve:"AUTORIZACIÓN CONCEDIDA",failure:"LANZAMIENTO FALLIDO",
 repair:"INVESTIGACIÓN COMPLETADA",launch:"DESPEGUE CONFIRMADO",
 finale:"UN NUEVO MUNDO"
};
const cueIcons={
 reveal:"◈",move:"⌖",work:"◬",build:"▤",power:"ϟ",blackout:"⚠",
 warning:"!",recover:"✓",resolve:"✓",approve:"✓",failure:"✕",
 repair:"⚙",launch:"↑",finale:"✦"
};
const musicSlider=$("music-volume"),musicReadout=$("music-volume-value");
let scenes=[],ready=false,frameReady=false,chapter=0,beat=-1,elapsed=0;
let paused=false,finished=false,failed=false,started=false,last=performance.now(),lastPaint=0,flashTimer=0,actionTimer=0;
let sound=false;
const stored=Number(localStorage.getItem("ohio-trailer-volume"));
const initial=localStorage.getItem("ohio-trailer-volume")===null?55:(Number.isFinite(stored)?stored:55);
musicSlider.value=String(Math.max(0,Math.min(100,initial)));
musicReadout.textContent=musicSlider.value+"%";
audio?.setVolume(Number(musicSlider.value)/100);
musicSlider.addEventListener("input",()=>{
 const value=Number(musicSlider.value);
 musicReadout.textContent=value+"%";
 audio?.setVolume(value/100);
 localStorage.setItem("ohio-trailer-volume",String(value));
});
const formatTime=t=>{
 const n=Math.max(0,Math.floor(t/1000));
 return String(Math.floor(n/60)).padStart(2,"0")+":"+String(n%60).padStart(2,"0");
};
function setStatus(){
 const value=failed?"SIN CONEXIÓN":!ready||!frameReady?"CARGANDO":!started?"LISTO":finished?"FINALIZADO":paused?"PAUSADO":"EN VIVO";
 $("live-status").textContent=value;
 $("pause-button").textContent=paused?"▶":"Ⅱ";
 $("pause-button").setAttribute("aria-label",paused?"Reproducir":"Pausar");
 $("pause-button").setAttribute("aria-pressed",String(paused));
 const t=finished?TOTAL_MS:chapter*ACT_MS+elapsed;
 $("trailer-clock").textContent=formatTime(t)+" / 01:15";
 progress.style.width=Math.min(100,t/TOTAL_MS*100)+"%";
 $("sound-button").textContent=sound?"♫ Silenciar":"♫ Activar música";
 $("sound-button").setAttribute("aria-pressed",String(sound));
}
function chapterButtons(){
 const host=$("chapter-list");
 host.replaceChildren();
 scenes.forEach((scene,i)=>{
  const b=document.createElement("button");
  b.type="button";b.dataset.chapter=String(i);
  const number=document.createElement("span");
  number.textContent=String(i+1).padStart(2,"0");
  const title=document.createElement("strong");
  title.textContent=scene.title;
  b.append(number,title);
  b.setAttribute("aria-label","Acto "+(i+1)+": "+scene.title);
  b.addEventListener("click",()=>jump(i));
  host.append(b);
 });
}
function syncChapterButtons(){
 $("chapter-list").querySelectorAll("button").forEach((b,i)=>{
  const current=i===chapter;
  b.classList.toggle("active",current);
  if(current)b.setAttribute("aria-current","step");
  else b.removeAttribute("aria-current");
  b.style.setProperty("--chapter-fill",i<chapter||finished?"100%":current?(elapsed/ACT_MS*100)+"%":"0%");
 });
}
function cut(){
 const layer=$("trailer-cut");
 clearTimeout(flashTimer);
 layer.classList.remove("cutting");
 void layer.offsetWidth;
 layer.classList.add("cutting");
 flashTimer=setTimeout(()=>layer.classList.remove("cutting"),1250);
}
function actionFlash(cue){
 const popup=$("trailer-action");
 clearTimeout(actionTimer);
 $("action-icon").textContent=cueIcons[cue]||"◈";
 $("action-label").textContent=cueNames[cue]||"OHIO EN OPERACIÓN";
 popup.classList.remove("visible","danger");
 if(cue==="blackout"||cue==="failure")popup.classList.add("danger");
 void popup.offsetWidth;
 popup.classList.add("visible");
 actionTimer=setTimeout(()=>popup.classList.remove("visible"),1450);
}
function showBeat(index,chapterStart=false){
 if(!ready||!frameReady||finished)return;
 const scene=scenes[chapter],part=Math.min(BEAT_COUNT-1,Math.max(0,index));
 beat=part;
 if(chapterStart){
  $("act-number").textContent="ACTO "+String(chapter+1).padStart(2,"0")+" / 05";
  $("act-subtitle").textContent=scene.subtitle||"";
  $("scene-title").textContent=scene.title;
  $("scene-tagline").textContent=scene.tagline||"";
  trailer.dataset.chapter=String(chapter+1);
  cut();
 }
 const caption=$("scene-description");
 caption.classList.remove("beat-entrance");
 caption.textContent=scene.beats[part];
 void caption.offsetWidth;
 caption.classList.add("beat-entrance");
 const mood=scene.moods?.[part]||"normal";
 trailer.dataset.mood=mood;
 const cue=scene.cues?.[part]||"reveal";
 if(part>0||chapterStart)actionFlash(cue);
 if(sound)audio?.cue(cue);
 if(started&&part>0)window.OhioCinematics?.play(cue);
 frame.contentWindow?.postMessage({
  type:"OHIO_DEMO_SCENE",
  state:scene.frames[part],
  tab:scene.tabs[part],
  beat:part,
  focus:scene.focus?.[part]||scene.tabs[part],
  cue
 },location.origin);
 syncChapterButtons();
}
function jump(i){
 if(!ready||!started||i<0||i>=scenes.length)return;
 $("trailer-end").hidden=true;
 finished=false;paused=false;
 chapter=i;elapsed=0;beat=-1;
 audio?.setChapter(chapter);
 if(sound)audio?.resume();
 showBeat(0,true);
 setStatus();
}
function end(){
 finished=true;paused=true;
 clearTimeout(actionTimer);
 $("trailer-action").classList.remove("visible");
 $("trailer-end").hidden=false;
 audio?.pause();
 syncChapterButtons();
 setStatus();
}
function skip(delta){
 if(!ready||!started)return;
 if(finished){jump(delta<0?4:0);return}
 const next=chapter+delta;
 if(next>=scenes.length){end();return}
 jump(Math.max(0,next));
}
function togglePause(){
 if(!ready||!started)return;
 if(finished){jump(0);return}
 paused=!paused;
 if(sound){if(paused)audio?.pause();else audio?.resume()}
 setStatus();
}
// Browsers will not play sound until a user gesture. Start the trailer and
// its sound in the SAME click; never promise audible autoplay.
function syncGate(){
 const available=ready&&frameReady&&!failed;
 for(const id of ["trailer-start-audio","trailer-start-muted"])
  $(id).disabled=!available;
 if(available)$("trailer-gate-status").textContent="SECUENCIAS LISTAS · ELEGÍ CÓMO COMENZAR";
}
async function begin(withSound){
 if(started||!ready||!frameReady)return;
 const playButton=$("trailer-start-audio");
 const quietButton=$("trailer-start-muted");
 playButton.disabled=true;quietButton.disabled=true;
 if(withSound){
  try{
   const active=await audio?.start();
   sound=!!active;
   if(sound){audio.setChapter(chapter);audio.cue("reveal")}
   else $("trailer-gate-status").textContent="Audio no disponible; reproduciendo sin sonido.";
  }catch(err){
   sound=false;
   $("trailer-gate-status").textContent="El navegador no habilitó sonido: "+String(err?.message||err);
  }
 }
 started=true;paused=false;
 $("trailer-gate").hidden=true;
 $("trailer-end").hidden=true;
 elapsed=0;beat=-1;last=performance.now();
 showBeat(0,true);
 setStatus();
}
$("trailer-start-audio").addEventListener("click",()=>begin(true));
$("trailer-start-muted").addEventListener("click",()=>begin(false));
$("trailer-retry").addEventListener("click",()=>location.reload());
async function toggleMusic(){
 if(!started){await begin(true);return}
 if(sound){
  sound=false;audio?.stop();
 }else{
  try{
   if(!await audio?.start()){
    $("sound-button").textContent="Audio no disponible";
    return;
   }
   sound=true;audio.setChapter(chapter);
   if(paused||finished)audio.pause();
   else audio.cue(scenes[chapter].cues?.[Math.max(beat,0)]||"reveal");
  }catch(_){
   $("sound-button").textContent="Audio no disponible";
   return;
  }
 }
 setStatus();
}
$("previous").addEventListener("click",()=>skip(-1));
$("next").addEventListener("click",()=>skip(1));
$("pause-button").addEventListener("click",togglePause);
$("sound-button").addEventListener("click",toggleMusic);
$("replay").addEventListener("click",()=>jump(0));
document.addEventListener("keydown",event=>{
 const tag=event.target?.tagName;
 if(event.altKey||event.ctrlKey||event.metaKey||["INPUT","BUTTON","SELECT","TEXTAREA","A"].includes(tag))return;
 if(event.key==="ArrowRight"){event.preventDefault();skip(1)}
 else if(event.key==="ArrowLeft"){event.preventDefault();skip(-1)}
 else if(event.code==="Space"){event.preventDefault();togglePause()}
 else if(event.key.toLowerCase()==="m")toggleMusic();
 else if(event.key.toLowerCase()==="f"&&document.fullscreenEnabled){
  if(document.fullscreenElement)document.exitFullscreen();
  else document.documentElement.requestFullscreen().catch(()=>{});
 }
});
frame.addEventListener("load",()=>{
 frameReady=true;
 if(ready&&!finished)showBeat(Math.max(beat,0),true);
 syncGate();
});
function tick(now){
 const dt=Math.min(150,Math.max(0,now-last));last=now;
 if(started&&ready&&frameReady&&!paused&&!finished&&!document.hidden){
  elapsed+=dt;
  if(elapsed>=ACT_MS){
   if(chapter===scenes.length-1)end();
   else jump(chapter+1);
  }else if(frameReady){
   const next=Math.min(BEAT_COUNT-1,Math.floor(elapsed/(ACT_MS/BEAT_COUNT)));
   if(next!==beat)showBeat(next);
  }
 }
 if(now-lastPaint>90){
  if(ready&&!finished)syncChapterButtons();
  setStatus();lastPaint=now;
 }
 requestAnimationFrame(tick);
}
function showError(err){
 $("trailer-error").hidden=false;
 $("trailer-error").textContent="No se pudo cargar el gameplay del tráiler: "+String(err?.message||err)+". Verificá la conexión con el servidor e intentá recargar.";
 failed=true;paused=true;syncGate();
 $("trailer-gate-status").textContent="No se pudo preparar el tráiler: "+String(err?.message||err);
 $("trailer-retry").hidden=false;
 setStatus();
}
fetch((window.OHIO_API_ORIGIN||"")+"/api/demo/scenes",{credentials:"include"})
 .then(response=>{
  if(!response.ok)throw Error("HTTP "+response.status);
  return response.json();
 })
 .then(data=>{
  if(!Array.isArray(data.scenes)||data.scenes.length!==5
      ||data.scenes.some(s=>s.duration!==15||s.frames?.length!==5||s.tabs?.length!==5||s.beats?.length!==5)){
   throw Error("El servidor no devolvió los cinco capítulos completos.");
  }
  scenes=data.scenes;
  ready=true;
  chapterButtons();
  audio?.setChapter(0);
  if(frameReady)showBeat(0,true);
  syncGate();
  setStatus();
 })
 .catch(showError);
document.addEventListener("visibilitychange",()=>{
 if(!sound)return;
 if(document.hidden)audio?.pause();
 else if(!paused&&!finished)audio?.resume();
});
window.addEventListener("pagehide",()=>{audio?.stop();sound=false;setStatus()});
requestAnimationFrame(tick);
