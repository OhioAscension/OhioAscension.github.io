"use strict";
/*
 * OHIO Trailer Score — five original procedural movements.
 * Synthesized in-browser; no samples, external music, or copyrighted material.
 * Browser policy: sound begins only after the viewer explicitly activates it.
 */
const OhioTrailerAudio=(()=>{
 const Audio=()=>window.AudioContext||window.webkitAudioContext;
 const CHAPTERS=[
  {bpm:96, root:45, chord:[0,3,7,10], melody:[0,7,3,10,7,3,0,7], bass:"triangle",lead:"sine"},
  {bpm:128,root:45, chord:[0,4,7,12], melody:[0,7,12,7,4,12,7,16],bass:"sawtooth",lead:"triangle"},
  {bpm:142,root:43, chord:[0,3,6,10], melody:[0,6,3,10,6,3,0,-2],bass:"sawtooth",lead:"sawtooth"},
  {bpm:154,root:47, chord:[0,5,7,12],melody:[0,7,12,17,12,7,19,17],bass:"triangle",lead:"sawtooth"},
  {bpm:114,root:48, chord:[0,4,7,12],melody:[0,7,12,16,19,16,12,24],bass:"triangle",lead:"triangle"}
 ];
 let context=null,master=null,track=null;
 let volume=.55,playing=false,paused=false,chapter=0,step=0,nextTime=0,timer=null,noise=null;
 const hz=midi=>440*Math.pow(2,(midi-69)/12);
 function create(){
  if(context)return true;
  const C=Audio();if(!C)return false;
  context=new C();
  master=context.createGain();
  master.gain.value=volume*.72;
  master.connect(context.destination);
  track=context.createGain();
  track.gain.value=.9;
  track.connect(master);
  noise=context.createBuffer(1,context.sampleRate*.35,context.sampleRate);
  const data=noise.getChannelData(0);
  for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
  return true;
 }
 function tone(note,at,duration=.22,type="triangle",gain=.09,glide=0){
  if(!context)return;
  const oscillator=context.createOscillator();
  const envelope=context.createGain();
  const filter=context.createBiquadFilter();
  oscillator.type=type;
  oscillator.frequency.setValueAtTime(hz(note),at);
  if(glide)oscillator.frequency.exponentialRampToValueAtTime(Math.max(25,hz(note+glide)),at+duration);
  filter.type="lowpass";filter.frequency.value=type==="sawtooth"?2000:5000;
  envelope.gain.setValueAtTime(.0001,at);
  envelope.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),at+.014);
  envelope.gain.exponentialRampToValueAtTime(.0001,at+duration);
  oscillator.connect(filter);filter.connect(envelope);envelope.connect(track);
  oscillator.start(at);oscillator.stop(at+duration+.03);
 }
 function percussion(at,kind){
  if(!context)return;
  if(kind==="kick"){
   const o=context.createOscillator(),e=context.createGain();
   o.type="sine";o.frequency.setValueAtTime(125,at);
   o.frequency.exponentialRampToValueAtTime(43,at+.16);
   e.gain.setValueAtTime(.13,at);e.gain.exponentialRampToValueAtTime(.0001,at+.18);
   o.connect(e);e.connect(track);o.start(at);o.stop(at+.2);
  }else{
   const src=context.createBufferSource(),f=context.createBiquadFilter(),e=context.createGain();
   src.buffer=noise;f.type="highpass";f.frequency.value=kind==="crash"?850:5000;
   e.gain.setValueAtTime(kind==="crash"?.12:.035,at);
   e.gain.exponentialRampToValueAtTime(.0001,at+(kind==="crash"?.28:.07));
   src.connect(f);f.connect(e);e.connect(track);src.start(at);src.stop(at+(kind==="crash"?.3:.09));
  }
 }
 function beat(at){
  const score=CHAPTERS[chapter],i=step++,eighth=60/score.bpm/2;
  const bar=Math.floor(i/8),root=score.root+[0,-2,3,-4][bar%4];
  const note=root+score.melody[i%8];
  if(i%4===0)tone(root-12,at,eighth*3.1,score.bass,chapter===2?.12:.09);
  if(i%2===0)tone(root+score.chord[(i/2)%4],at,eighth*1.65,"sine",.035);
  if(chapter===0){
   if(i%2===0)tone(note+12,at,eighth*1.65,score.lead,.055);
  }else if(chapter===2){
   if(i%2===0)tone(note+12,at,eighth*.78,score.lead,.075);
   percussion(at,i%4===0?"kick":"hat");
  }else{
   tone(note+12,at,eighth*.8,score.lead,chapter===3?.065:.055);
   if(i%4===0)percussion(at,"kick");
   if(i%2===1)percussion(at,"hat");
  }
  if(i%16===0&&chapter===4)tone(root+24,at,eighth*6,"sine",.04);
  return eighth;
 }
 function schedule(){
  if(!playing||paused||!context||context.state!=="running")return;
  const until=context.currentTime+.16;
  let attempts=0;
  while(nextTime<until&&attempts++<12){
   nextTime+=beat(nextTime);
  }
 }
 function fade(target){
  if(!context)return;
  master.gain.cancelScheduledValues(context.currentTime);
  master.gain.setTargetAtTime(target,context.currentTime,.065);
 }
 async function start(){
  if(!create())return false;
  await context.resume();
  playing=true;paused=false;
  nextTime=context.currentTime+.03;
  step=0;
  fade(volume*.72);
  clearInterval(timer);timer=setInterval(schedule,60);
  schedule();
  return true;
 }
 function pause(){
  paused=true;fade(0);
 }
 function resume(){
  if(!playing)return;
  paused=false;
  nextTime=context.currentTime+.06;
  fade(volume*.72);
  schedule();
 }
 function stop(){
  playing=false;paused=false;
  clearInterval(timer);timer=null;
  fade(0);
 }
 function setChapter(n){
  chapter=Math.max(0,Math.min(CHAPTERS.length-1,Number(n)||0));
  step=0;
  if(context)nextTime=context.currentTime+.08;
  if(playing&&!paused)schedule();
 }
 function setVolume(n){volume=Math.min(1,Math.max(0,Number(n)||0));if(playing&&!paused)fade(volume*.72)}
 function cue(type){
  if(!playing||paused||!context)return;
  const at=context.currentTime+.015,root=CHAPTERS[chapter].root;
  if(type==="blackout"||type==="failure"){
   percussion(at,"crash");
   tone(root+5,at,.65,"sawtooth",.18,-14);
   tone(root-7,at,.8,"sawtooth",.10,-9);
  }else if(type==="launch"){
   tone(root+12,at,.85,"sawtooth",.12,12);
   tone(root+19,at+.17,.6,"triangle",.11,7);
   percussion(at+.3,"crash");
  }else if(type==="resolve"||type==="finale"){
   [0,4,7,12].forEach((v,i)=>tone(root+v+12,at+i*.11,.76,"triangle",.07));
   percussion(at+.2,"crash");
  }else if(type==="build"||type==="repair"||type==="power"){
   tone(root+12,at,.16,"triangle",.065);
   tone(root+19,at+.11,.28,"triangle",.07);
  }else if(type==="approve"){
   tone(root+7,at,.14,"sine",.06);
   tone(root+12,at+.10,.25,"sine",.07);
  }else if(type==="warning"){
   tone(root+9,at,.3,"sawtooth",.055,-2);
  }
 }
 return {start,pause,resume,stop,setChapter,setVolume,cue,get playing(){return playing},get paused(){return paused}};
})();
