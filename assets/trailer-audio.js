"use strict";
/*
 * Ohio: Ascension — original adaptive cinematic score.
 * Five composed movements, scored action cues and a unique orchestral
 * launch victory. No recorded music, samples, external network or licensing
 * required. Audio is activated by an explicit user gesture.
 */
const OhioTrailerAudio=(()=>{
 const AudioContextClass=()=>window.AudioContext||window.webkitAudioContext;
 const CHAPTERS=[
  {bpm:96,root:45,mode:"minor",chords:[[0,3,7,10],[-2,2,5,9],[3,7,10,14],[-4,0,3,7]],melody:[0,7,10,7,3,7,0,-2],texture:"ambient"},
  {bpm:128,root:45,mode:"major",chords:[[0,4,7,12],[-2,2,5,9],[5,9,12,16],[7,11,14,19]],melody:[0,7,12,16,12,7,4,12],texture:"industrial"},
  {bpm:140,root:43,mode:"minor",chords:[[0,3,6,10],[-2,1,5,8],[-5,-2,3,7],[2,5,9,12]],melody:[0,6,3,10,6,3,-2,0],texture:"crisis"},
  {bpm:148,root:47,mode:"minor",chords:[[0,5,7,12],[-2,3,7,10],[3,7,10,15],[5,9,12,17]],melody:[0,7,12,17,12,7,19,17],texture:"ascent"},
  {bpm:110,root:48,mode:"major",chords:[[0,4,7,12],[5,9,12,16],[-2,2,5,9],[7,11,14,19]],melody:[0,7,12,16,19,16,12,24],texture:"wonder"}
 ];
 let context=null,master=null,mix=null,scoreGain=null,fxGain=null,compressor=null,echo=null,echoGain=null;
 let noiseBuffer=null,volume=.55,playing=false,paused=false,chapter=0,step=0,nextTime=0,timer=null;
 const hz=n=>440*Math.pow(2,(n-69)/12);
 function create(){
  if(context)return true;
  const C=AudioContextClass();if(!C)return false;
  context=new C();
  master=context.createGain();master.gain.value=0;
  compressor=context.createDynamicsCompressor();
  compressor.threshold.value=-18;compressor.knee.value=18;compressor.ratio.value=3;
  compressor.attack.value=.006;compressor.release.value=.22;
  mix=context.createGain();mix.gain.value=.88;
  scoreGain=context.createGain();scoreGain.gain.value=.72;
  fxGain=context.createGain();fxGain.gain.value=.8;
  echo=context.createDelay(.9);echo.delayTime.value=.32;
  echoGain=context.createGain();echoGain.gain.value=.13;
  scoreGain.connect(mix);fxGain.connect(mix);
  mix.connect(compressor);compressor.connect(master);master.connect(context.destination);
  scoreGain.connect(echo);echo.connect(echoGain);echoGain.connect(mix);
  noiseBuffer=context.createBuffer(1,Math.floor(context.sampleRate*.6),context.sampleRate);
  const data=noiseBuffer.getChannelData(0);
  for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1);
  return true;
 }
 function output(destination){return destination==="fx"?fxGain:scoreGain}
 function tone(note,at,duration=.25,type="triangle",gain=.1,{to=0,channel="score",lowpass=4500,attack=.02}={}){
  if(!context)return;
  at=Math.max(context.currentTime+.005,at);
  const osc=context.createOscillator(),env=context.createGain(),filter=context.createBiquadFilter();
  osc.type=type;osc.frequency.setValueAtTime(hz(note),at);
  if(to)osc.frequency.exponentialRampToValueAtTime(Math.max(30,hz(note+to)),at+Math.max(.04,duration));
  filter.type="lowpass";filter.frequency.value=lowpass;
  env.gain.setValueAtTime(.0001,at);
  env.gain.exponentialRampToValueAtTime(Math.max(.0003,gain),at+Math.min(attack,duration*.35));
  env.gain.setTargetAtTime(.0001,at+duration*.75,Math.max(.03,duration*.13));
  osc.connect(filter);filter.connect(env);env.connect(output(channel));
  osc.start(at);osc.stop(at+duration+.16);
 }
 function noise(at,kind="hat",gain=.07){
  if(!context)return;
  at=Math.max(at,context.currentTime+.005);
  const src=context.createBufferSource(),filter=context.createBiquadFilter(),env=context.createGain();
  src.buffer=noiseBuffer;
  filter.type=kind==="impact"?"lowpass":"highpass";
  filter.frequency.value=kind==="impact"?1250:kind==="snare"?1800:6600;
  const length=kind==="impact"?.5:kind==="snare"?.14:.075;
  env.gain.setValueAtTime(Math.max(.001,gain),at);
  env.gain.exponentialRampToValueAtTime(.0001,at+length);
  src.connect(filter);filter.connect(env);env.connect(kind==="impact"?fxGain:scoreGain);
  src.start(at);src.stop(at+length+.02);
 }
 function drum(at,kind="kick"){
  if(kind!=="kick"){noise(at,kind,kind==="snare"?.075:.043);return}
  const osc=context.createOscillator(),env=context.createGain();
  at=Math.max(context.currentTime+.005,at);
  osc.type="sine";osc.frequency.setValueAtTime(148,at);
  osc.frequency.exponentialRampToValueAtTime(43,at+.18);
  env.gain.setValueAtTime(.25,at);
  env.gain.exponentialRampToValueAtTime(.0001,at+.2);
  osc.connect(env);env.connect(scoreGain);osc.start(at);osc.stop(at+.22);
 }
 function score(at){
  const s=CHAPTERS[chapter],i=step++,eighth=30/s.bpm;
  const chordIndex=Math.floor(i/8)%4,notes=s.chords[chordIndex],root=s.root;
  const note=root+s.melody[i%8];
  if(i%8===0){
   for(let n=0;n<3;n++)tone(root+notes[n]+12,at,eighth*7.2,"sine",.022,{lowpass:1200,attack:.38});
   tone(root+notes[0]-12,at,eighth*5,"triangle",.12,{lowpass:620,attack:.06});
  }
  if(s.texture==="ambient"){
   if(i%2===0)tone(note+12,at,eighth*1.65,"sine",.092,{lowpass:2700});
   if(i%4===2)noise(at,"hat",.015);
  }else if(s.texture==="crisis"){
   if(i%2===0)tone(note+12,at,eighth*.65,"sawtooth",.085,{lowpass:1400});
   if(i%2===0)drum(at,i%4===0?"kick":"snare");
   else drum(at,"hat");
  }else{
   tone(note+12,at,eighth*.9,s.texture==="industrial"?"triangle":"sawtooth",
        s.texture==="ascent"?.09:.073,{lowpass:s.texture==="ascent"?3200:2200});
   if(i%4===0)drum(at);
   if(i%4===2)drum(at,"snare");
   if(i%2===1)drum(at,"hat");
   if(s.texture==="wonder"&&i%4===0)tone(root+notes[2]+24,at,eighth*3.2,"sine",.045);
  }
  return eighth;
 }
 function schedule(){
  if(!playing||paused||!context||context.state!=="running")return;
  const horizon=context.currentTime+.18;
  for(let n=0;nextTime<horizon&&n<16;n++)nextTime+=score(nextTime);
 }
 function fade(target,time=.075){
  if(!context)return;
  const at=context.currentTime;
  master.gain.cancelScheduledValues(at);
  master.gain.setTargetAtTime(Math.max(.00001,target),at,time);
 }
 async function start(){
  if(!create())return false;
  await context.resume();
  if(context.state!=="running")return false;
  playing=true;paused=false;step=0;nextTime=context.currentTime+.045;
  fade(volume*.88,.035);
  clearInterval(timer);timer=setInterval(schedule,55);
  schedule();
  return true;
 }
 function pause(){paused=true;fade(0,.04)}
 function resume(){
  if(!playing||!context)return;
  context.resume().catch(()=>{});
  paused=false;nextTime=context.currentTime+.06;
  fade(volume*.88);schedule();
 }
 function stop(){
  playing=false;paused=false;
  clearInterval(timer);timer=null;
  fade(0,.04);
 }
 function setChapter(n){
  chapter=Math.max(0,Math.min(CHAPTERS.length-1,Number(n)||0));
  step=0;
  if(context)nextTime=context.currentTime+.09;
  if(playing&&!paused)schedule();
 }
 function setVolume(n){
  volume=Math.max(0,Math.min(1,Number(n)||0));
  if(playing&&!paused)fade(volume*.88,.04);
 }
 function fanfare(at,root){
  // New original Ohio melody. Intentionally not an interpolation of "Day One".
  const sequence=[
   [0,0,.52],[.16,7,.65],[.40,12,.55],[.67,16,.7],
   [.96,19,.8],[1.32,24,1.35],[1.42,16,1.0],[1.42,19,1.0]
  ];
  for(const [offset,pitch,duration] of sequence)
   tone(root+pitch+12,at+offset,duration,"triangle",.125,{channel:"fx",attack:.05});
  tone(root+12,at+.95,2.0,"sine",.095,{channel:"fx",lowpass:1300,attack:.3});
  noise(at+.5,"impact",.11);
 }
 function cue(type){
  if(!playing||paused||!context||context.state!=="running")return;
  const at=context.currentTime+.035,root=CHAPTERS[chapter].root;
  if(type==="blackout"||type==="failure"){
   noise(at,"impact",.2);
   tone(root+12,at,.8,"sawtooth",.13,{to:-16,channel:"fx",lowpass:1900});
   tone(root-10,at+.12,.7,"triangle",.18,{to:-9,channel:"fx",lowpass:850});
   if(type==="failure")noise(at+.28,"impact",.23);
  }else if(type==="launch"){
   noise(at,"impact",.16);
   tone(root-12,at,1.25,"sawtooth",.15,{to:14,channel:"fx",lowpass:1700,attack:.12});
   tone(root+7,at+.22,.9,"triangle",.09,{to:12,channel:"fx"});
   // This is the hero moment, not a tiny two-note UI beep.
   fanfare(at+.48,root);
  }else if(type==="resolve"||type==="finale"){
   fanfare(at,root);
  }else if(type==="build"||type==="repair"||type==="power"){
   noise(at,"hat",.07);
   [0,7,12].forEach((v,i)=>tone(root+v+12,at+i*.11,.31,"triangle",.09,{channel:"fx"}));
  }else if(type==="approve"){
   [0,4,7].forEach((v,i)=>tone(root+v+12,at+i*.1,.34,"sine",.09,{channel:"fx"}));
  }else if(type==="warning"){
   tone(root+9,at,.48,"sawtooth",.1,{to:-3,channel:"fx",lowpass:950});
  }else if(type==="work"||type==="move"){
   tone(root+12,at,.14,"sine",.05,{channel:"fx"});
  }
 }
 return {
  start,pause,resume,stop,setChapter,setVolume,cue,
  get playing(){return playing},
  get paused(){return paused},
  get supported(){return !!AudioContextClass()}
 };
})();
window.OhioTrailerAudio=OhioTrailerAudio;
