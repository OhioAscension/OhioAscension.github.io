"use strict";
const $=id=>document.getElementById(id);
const DURATION=15000;
const sceneDuration=()=>DURATION;
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

let scenes=[],index=0,paused=false,last=performance.now(),elapsed=0,loaded=false,frameReady=false,beat=-1;
const frame=$("game-frame");
function mood(chapter,part){return chapter===2&&part===2?"critical":chapter===2&&part===1?"warning":chapter===3&&part===2?"critical":chapter===4&&part===2?"warning":"normal"}
function updateMood(part){const level=mood(index,part);$("showcase").classList.toggle("severity-warning",level==="warning");$("showcase").classList.toggle("severity-critical",level==="critical");window.OhioAudio?.setMode?.(level)}
function show(){
 if(!loaded||!frameReady)return;
 const scene=scenes[index];
 $("scene-number").textContent=String(index+1).padStart(2,"0")+" / "+String(scenes.length).padStart(2,"0");
 $("scene-title").textContent=scene.title;
 $("scene-description").textContent=scene.beats?.[0]||scene.narration;
 updateMood(0);
 const panel=document.querySelector(".callout");panel.style.animation="none";void panel.offsetWidth;panel.style.animation="";
 frame.contentWindow.postMessage({type:"OHIO_DEMO_SCENE",state:scene.frames?.[0]||scene.state,tab:scene.tabs?.[0]||scene.tab,beat:0},location.origin);
 if(window.OhioAudio&&OhioAudio.status())OhioAudio.effect(index>=5?"space_launch":index===2?"grid_upgrade":"build");
}
function advance(to){if(!scenes.length)return;index=(to+scenes.length)%scenes.length;elapsed=0;beat=0;show()}
frame.addEventListener("load",()=>{frameReady=true;show()});
$("previous").addEventListener("click",()=>advance(index-1));
$("next").addEventListener("click",()=>advance(index+1));
const musicPref="ohio-music-enabled";
let musicWanted=localStorage.getItem(musicPref)==="true";
function labelAudio(){$("sound-button").textContent=musicWanted?"Silenciar música":"Activar sonido"}
labelAudio();
$("sound-button").addEventListener("click",async()=>{
 try{
  if(musicWanted){OhioAudio.pause();musicWanted=false}
  else musicWanted=await OhioAudio.start();
  localStorage.setItem(musicPref,String(musicWanted));
  updateMood(beat<0?0:beat);labelAudio();
 }catch(e){$("sound-button").textContent="Audio no disponible"}
});
function restoreDemoAudio(){
 if(musicWanted&&!OhioAudio.status())OhioAudio.start().catch(()=>{});
}
for(const event of ["pointerdown","keydown"])document.addEventListener(event,restoreDemoAudio,{passive:true});
function togglePause(){paused=!paused;$("live-status").textContent=paused?"PAUSADO":"REPRODUCIENDO"}
document.addEventListener("keydown",e=>{
 if(e.target instanceof HTMLElement && ["INPUT","BUTTON","SELECT","TEXTAREA"].includes(e.target.tagName))return;
 if(e.key==="ArrowRight")advance(index+1);
 if(e.key==="ArrowLeft")advance(index-1);
 if(e.code==="Space"){e.preventDefault();togglePause()}
 if(e.key.toLowerCase()==="f"&&document.fullscreenEnabled){
  if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen();
 }
});
function tick(now){
 const dt=Math.min(now-last,1000);last=now;
 if(loaded&&!paused){
  elapsed+=dt;
  if(elapsed>=sceneDuration())advance(index+1);
  else if(frameReady){
   const scene=scenes[index],steps=scene.frames?.length||1,nextBeat=Math.min(steps-1,Math.floor(elapsed/(DURATION/steps)));
   if(beat!==nextBeat){
    beat=nextBeat;
    $("scene-description").textContent=scene.beats?.[beat]||scene.narration;
    updateMood(beat);
    frame.contentWindow.postMessage({type:"OHIO_DEMO_SCENE",state:scene.frames?.[beat]||scene.state,tab:scene.tabs?.[beat]||scene.tab,beat},location.origin);
    if(beat&&window.OhioAudio?.status?.()){
     if(index===2&&beat===2)OhioAudio.alarm();
     else OhioAudio.effect(index>=5?"aero_attempt":index===4?"decision":"build");
    }
   }
  }
 }
 if(loaded)$("bar-progress").style.width=(((index+elapsed/sceneDuration())/scenes.length)*100)+"%";
 requestAnimationFrame(tick);
}
fetch((window.OHIO_API_ORIGIN||"")+"/api/demo/scenes",{credentials:"include"}).then(r=>{if(!r.ok)throw Error("HTTP "+r.status);return r.json()}).then(data=>{
 scenes=data.scenes;loaded=true;show();
}).catch(err=>{$("scene-title").textContent="Error de demostración";$("scene-description").textContent=String(err)});
requestAnimationFrame(tick);
