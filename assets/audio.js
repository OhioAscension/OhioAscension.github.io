"use strict";
/* Ohio: Ascension — ORIGINAL adaptive orchestral/electronic score.
   Synthesized locally with Web Audio: no copyrighted recordings, no network.
   Uses look-ahead scheduling to avoid timer drift and bar-aware transitions. */
const OhioAudio=(()=>{
 const AC=()=>window.AudioContext||window.webkitAudioContext;
 let ctx=null,master=null,music=null,fx=null,echo=null,feedback=null,noiseBuffer=null;
 let active=false,muted=false,volume=.5,mode="normal",era=0,narrative="dormant";
 let nextTime=0,step=0,timer=null,sceneKey="",lastPulse=0;
 const midi=n=>440*Math.pow(2,(n-69)/12);
 const originalTheme=[0,7,12,10,7,5,3,7, 0,5,8,12,10,7,5,3,
  -2,5,10,12,10,7,3,5, -4,3,7,10,7,3,0,5];
 const progression={
  frontier:[[45,48,52,57],[41,45,48,53],[48,52,55,60],[43,47,50,55]],
  industry:[[45,48,52,57],[43,47,50,55],[41,45,48,53],[40,44,47,52]],
  science:[[45,48,52,57],[46,50,53,58],[41,45,48,53],[43,47,50,55]],
  orbit:[[48,52,55,60],[43,47,50,55],[45,48,52,57],[41,45,48,53]],
  b12:[[45,48,51,57],[46,49,53,58],[43,46,50,55],[40,44,47,52]],
  crisis:[[45,48,51,57],[43,46,50,55],[41,44,48,53],[40,43,47,52]]
 };
 function init(){
  if(ctx)return true;
  const Klass=AC();if(!Klass)return false;
  ctx=new Klass();
  master=ctx.createGain();master.gain.value=.62;
  const compressor=ctx.createDynamicsCompressor();
  compressor.threshold.value=-19;compressor.knee.value=18;
  compressor.ratio.value=3;compressor.attack.value=.012;compressor.release.value=.28;
  master.connect(compressor);compressor.connect(ctx.destination);
  music=ctx.createGain();music.gain.value=volume*.75;music.connect(master);
  fx=ctx.createGain();fx.gain.value=.36;fx.connect(master);
  echo=ctx.createDelay(.8);echo.delayTime.value=.34;
  feedback=ctx.createGain();feedback.gain.value=.15;
  music.connect(echo);echo.connect(feedback);feedback.connect(music);
  noiseBuffer=ctx.createBuffer(1,Math.floor(ctx.sampleRate*.35),ctx.sampleRate);
  const data=noiseBuffer.getChannelData(0);
  for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
  return true;
 }
 function voice(note,when,length=.4,{shape="triangle",gain=.07,filter=2500,attack=.018,bus=music,pan=0}={}){
  if(!ctx)return;
  const at=Math.max(ctx.currentTime+.008,when),osc=ctx.createOscillator(),
    low=ctx.createBiquadFilter(),envelope=ctx.createGain();
  osc.type=shape;osc.frequency.setValueAtTime(midi(note),at);
  low.type="lowpass";low.frequency.value=filter;
  envelope.gain.setValueAtTime(.0001,at);
  envelope.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),at+Math.min(attack,length*.33));
  envelope.gain.setTargetAtTime(.0001,at+length*.7,Math.max(.018,length*.12));
  osc.connect(low);low.connect(envelope);
  if(ctx.createStereoPanner){const stereo=ctx.createStereoPanner();stereo.pan.value=pan;envelope.connect(stereo);stereo.connect(bus)}
  else envelope.connect(bus);
  osc.start(at);osc.stop(at+length+.18);
 }
 function noise(when,style="hat",level=.025){
  if(!ctx)return;
  const at=Math.max(ctx.currentTime+.008,when),src=ctx.createBufferSource(),
    band=ctx.createBiquadFilter(),env=ctx.createGain();
  src.buffer=noiseBuffer;
  band.type=style==="impact"?"lowpass":"highpass";
  band.frequency.value=style==="hat"?7300:style==="snare"?1700:900;
  const len=style==="impact"?.44:style==="snare"?.14:.065;
  env.gain.setValueAtTime(Math.max(.001,level),at);
  env.gain.exponentialRampToValueAtTime(.0001,at+len);
  src.connect(band);band.connect(env);env.connect(style==="impact"?fx:music);
  src.start(at);src.stop(at+len+.015);
 }
 function kick(at,level=.18){
  const osc=ctx.createOscillator(),env=ctx.createGain();
  at=Math.max(ctx.currentTime+.005,at);
  osc.type="sine";osc.frequency.setValueAtTime(128,at);
  osc.frequency.exponentialRampToValueAtTime(41,at+.17);
  env.gain.setValueAtTime(Math.max(.001,level),at);
  env.gain.exponentialRampToValueAtTime(.0001,at+.19);
  osc.connect(env);env.connect(music);osc.start(at);osc.stop(at+.2);
 }
 function currentScene(){
  if(mode==="critical")return "crisis";
  if(narrative==="command"||narrative==="private"||narrative==="investigating")return "b12";
  if(era>=5)return "orbit";
  if(era>=3)return "science";
  return era>=1?"industry":"frontier";
 }
 function score(at){
  const scene=currentScene();
  const bpm=mode==="critical"?132:scene==="orbit"?116:scene==="industry"?108:scene==="science"?96:scene==="b12"?86:78;
  const eighth=30/bpm,i=step++,index=Math.floor(i/8)%4,beat=i%8;
  const chord=progression[scene][index];
  const crowded=scene==="industry"||scene==="orbit"||mode!=="normal";
  if(beat===0){
   for(let j=0;j<3;j++)voice(chord[j]+12,at,eighth*7.3,{
    shape:j===1?"triangle":"sine",gain:scene==="b12"?.023:.027,
    filter:scene==="b12"?1000:1750,attack:.32,pan:(j-1)*.34});
   voice(chord[0]-12,at,eighth*6.6,{shape:"triangle",gain:.095,filter:680,attack:.045});
  }
  if(beat===0||beat===4){
   voice(chord[0]-12+(beat===4?7:0),at,eighth*2.6,{
    shape:"triangle",gain:.11,filter:1000,attack:.01});
  }
  if(i%2===0){
   const theme=originalTheme[i%originalTheme.length];
   const offset=chord[0]-45,variation=(Math.floor(i/32)%2)*12;
   voice(69+theme+offset+(variation===12&&i%8===0?12:0),at,eighth*(scene==="frontier"?1.9:1.4),{
    shape:scene==="crisis"?"sawtooth":scene==="orbit"?"triangle":"sine",
    gain:scene==="frontier"?.067:scene==="crisis"?.063:.052,
    filter:scene==="b12"?1250:3000,attack:scene==="frontier"?.045:.016,
    pan:i%4===0?-.2:.2});
  }
  if(crowded){
   if(beat===0||beat===4)kick(at,mode==="critical"?.24:.14);
   if(beat===2||beat===6)noise(at,"snare",.065);
   if(i%2)noise(at,"hat",.024);
  }else{
   if(beat===0)kick(at,.065);
   if(beat===4)noise(at,"hat",.018);
  }
  if(scene==="orbit"&&beat===0){
   voice(chord[2]+24,at,eighth*5,{shape:"sine",gain:.038,filter:3300,attack:.2,pan:.32});
  }
  if(scene==="b12"&&beat===6){
   voice(chord[1]+13,at,eighth*3,{shape:"sine",gain:.033,filter:1150,attack:.24,pan:-.32});
  }
  return eighth;
 }
 function schedule(){
  if(!active||muted||!ctx||ctx.state!=="running")return;
  const nextScene=currentScene();
  if(nextScene!==sceneKey&&step%8===0){sceneKey=nextScene;lastPulse=step}
  const horizon=ctx.currentTime+.22;
  for(let count=0;nextTime<horizon&&count<24;count++)nextTime+=score(nextTime);
 }
 async function start(){
  if(!init())return false;
  await ctx.resume();
  if(ctx.state!=="running")return false;
  active=true;muted=false;master.gain.setTargetAtTime(.62,ctx.currentTime,.06);
  nextTime=ctx.currentTime+.06;clearInterval(timer);timer=setInterval(schedule,60);
  schedule();return true;
 }
 function pause(){
  active=false;clearInterval(timer);timer=null;
  if(master&&ctx)master.gain.setTargetAtTime(.0001,ctx.currentTime,.035);
 }
 function toggle(){return active?(pause(),Promise.resolve(false)):start()}
 function audible(){return active&&!muted&&ctx?.state==="running"}
 function effect(name){
  if(!audible())return;
  const at=ctx.currentTime+.02;
  if(name==="launch_success"||name==="space_launch"){
   for(let i=0;i<6;i++)voice([60,67,72,76,79,84][i],at+i*.17,i===5?1.5:.5,
    {shape:"triangle",gain:.14,filter:3800,bus:fx,pan:i%2?-.23:.23});
   noise(at+.28,"impact",.085);return;
  }
  if(name==="launch_failure"){alarm();noise(at,"impact",.22);return}
  const patterns={
   build:[60,67,72],build_batch:[60,67,72],directive:[57,64,69],
   work:[57,60],aero_attempt:[48,55,60],grid_upgrade:[60,64],
   investor:[62,69],licence:[67,72],decision:[55,62,67],
   space_launch:[60,67,72]
  };
  const notes=patterns[name]||[64,67];
  notes.forEach((n,i)=>voice(n, .03+at+i*.1,.23,
   {shape:"triangle",gain:.08,filter:2200,bus:fx}));
 }
 function alarm(){
  if(!audible())return;
  const at=ctx.currentTime+.02;
  for(let i=0;i<4;i++)voice(i%2?63:70,at+i*.23,.2,
   {shape:"sawtooth",gain:.14,filter:1200,bus:fx});
 }
 function setMode(value){mode=["normal","warning","critical"].includes(value)?value:"normal"}
 function setEra(stage){era=Math.max(0,Math.min(6,Number(stage)||0))}
 function setNarrative(value){narrative=String(value||"dormant")}
 function setMusicVolume(level){
  volume=Math.max(0,Math.min(1,Number(level)||0));
  if(music&&ctx)music.gain.setTargetAtTime(volume*.75,ctx.currentTime,.08);
 }
 function status(){return audible()}
 return {start,pause,toggle,effect,alarm,status,setMode,setEra,setNarrative,setMusicVolume,getMusicVolume:()=>volume};
})();
window.OhioAudio=OhioAudio;
