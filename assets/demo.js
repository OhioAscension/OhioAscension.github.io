"use strict";
/* OHIO: ASCENSION — an uninterrupted five-act film, not a media player.
 * All gameplay frames originate in game/demo.py; no user saves are modified.
 * One tap/click pauses or resumes; the always-available Salir link returns home.
 */
const $=id=>document.getElementById(id);
const ACT_MS=15000,BEAT_COUNT=5;
const frame=$("game-frame"),trailer=$("trailer"),audio=window.OhioTrailerAudio;
document.body.classList.add("ohio-trailer-playback");

// Android's system navigation and browser/TWA chrome can obscure the layout
// viewport even with 100dvh. Give the caption the actual visual-viewport
// bottom occlusion as a CSS variable, without changing playback dimensions.
function updateVisibleBottom(){
 const vv=window.visualViewport;
 const height=Number(window.innerHeight);
 if(!vv||!Number.isFinite(height)||height<=0)return;
 const visibleBottom=Number(vv.height)+Number(vv.offsetTop);
 if(!Number.isFinite(visibleBottom))return;
 const occluded=Math.min(height,Math.max(0,height-visibleBottom));
 trailer.style?.setProperty?.("--ohio-vv-bottom",Math.ceil(occluded)+"px");
}
updateVisibleBottom();
window.addEventListener("resize",updateVisibleBottom);
window.visualViewport?.addEventListener("resize",updateVisibleBottom);
window.visualViewport?.addEventListener("scroll",updateVisibleBottom);
const musicSlider=$("music-volume"),musicReadout=$("music-volume-value");
let scenes=[],ready=false,frameReady=false,chapter=0,beat=-1,elapsed=0;
let paused=false,finished=false,failed=false,started=false,last=performance.now(),flashTimer=0;
let sound=false;

// This setting belongs to the premiere, never to a persistent playback HUD.
let initial=55;
try{
 const stored=localStorage.getItem("ohio-trailer-volume");
 if(stored!==null&&Number.isFinite(Number(stored)))initial=Number(stored);
}catch(_){/* private browsing may disable storage */}
musicSlider.value=String(Math.min(100,Math.max(0,initial)));
musicReadout.textContent=musicSlider.value+"%";
audio?.setVolume(Number(musicSlider.value)/100);
musicSlider.addEventListener("input",()=>{
 const value=Number(musicSlider.value);
 musicReadout.textContent=value+"%";
 audio?.setVolume(value/100);
 try{localStorage.setItem("ohio-trailer-volume",String(value))}catch(_){}
});

function setStatus(){
 // No timer, transport or chapter navigation to maintain.
 $("trailer-paused").hidden=!started||!paused||finished;
}

function cut(){
 const layer=$("trailer-cut");
 clearTimeout(flashTimer);
 layer.classList.remove("cutting");
 void layer.offsetWidth;
 layer.classList.add("cutting");
 flashTimer=setTimeout(()=>layer.classList.remove("cutting"),1250);
}
function showBeat(index,chapterStart=false){
 if(!ready||!frameReady||finished)return;
 const scene=scenes[chapter],part=Math.min(BEAT_COUNT-1,Math.max(0,index));
 beat=part;
 if(chapterStart){
  $("act-number").textContent="ACTO "+String(chapter+1).padStart(2,"0")+" / 05";
  $("scene-title").textContent=scene.title;
  trailer.dataset.chapter=String(chapter+1);
  cut();
 }
 // Unlike the old redundant subtitle/tagline, each beat is a real
 // engine-driven event. Keep this single short contextual sentence.
 const caption=$("scene-description");
 caption.classList.remove("beat-entrance");
 caption.textContent=scene.beats[part]||"";
 void caption.offsetWidth;
 caption.classList.add("beat-entrance");
 const cue=scene.cues?.[part]||"reveal";
 trailer.dataset.mood=scene.moods?.[part]||"normal";
 if(sound)audio?.cue(cue);
 if(started&&part>0)window.OhioCinematics?.play(cue);
 frame.contentWindow?.postMessage({
  type:"OHIO_DEMO_SCENE",
  state:scene.frames[part],tab:scene.tabs[part],beat:part,
  focus:scene.focus?.[part]||scene.tabs[part],cue
 },location.origin);
}
function jump(i){
 if(!ready||!started||i<0||i>=scenes.length)return;
 $("trailer-end").hidden=true;
 finished=false;paused=false;chapter=i;elapsed=0;beat=-1;
 audio?.setChapter(chapter);
 if(sound)audio?.resume();
 showBeat(0,true);
 setStatus();
}
function end(){
 finished=true;paused=true;
 $("trailer-end").hidden=false;
 audio?.pause();
 setStatus();
}
function togglePause(){
 if(!ready||!started||finished)return;
 paused=!paused;
 if(sound){if(paused)audio?.pause();else audio?.resume()}
 setStatus();
}
// A clean viewing surface doubles as an invisible pause/resume target.
// Buttons and the completion screen keep their own semantics.
trailer.addEventListener("click",event=>{
 if(!started||finished||!ready||!frameReady)return;
 if(event.target.closest("a,button,input,label,.trailer-gate,.trailer-end"))return;
 togglePause();
});

function syncGate(){
 const available=ready&&frameReady&&!failed;
 for(const id of ["trailer-start-audio","trailer-start-muted"])
  $(id).disabled=!available;
 if(available)$("trailer-gate-status").textContent="SECUENCIAS LISTAS · ELEGÍ CÓMO COMENZAR";
}
// Browsers and TWA require the AudioContext to start in a real click.
async function begin(withSound){
 if(started||!ready||!frameReady)return;
 const playButton=$("trailer-start-audio"),quietButton=$("trailer-start-muted");
 playButton.disabled=true;quietButton.disabled=true;
 if(withSound){
  try{
   const active=await audio?.start();
   sound=!!active;
   if(sound)audio.setChapter(chapter); // showBeat() plays the opening cue once
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
$("replay").addEventListener("click",()=>jump(0));
document.addEventListener("keydown",event=>{
 const tag=event.target?.tagName;
 if(event.altKey||event.ctrlKey||event.metaKey||["INPUT","BUTTON","SELECT","TEXTAREA","A"].includes(tag))return;
 if(event.code==="Space"){event.preventDefault();togglePause()}
 else if(event.key.toLowerCase()==="f"&&document.fullscreenEnabled
         &&!(typeof navigator!=="undefined"&&/Electron\//.test(navigator.userAgent))){
  event.preventDefault();
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
  }else{
   const next=Math.min(BEAT_COUNT-1,Math.floor(elapsed/(ACT_MS/BEAT_COUNT)));
   if(next!==beat)showBeat(next);
  }
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
