"use strict";
/* Original procedural Ohio soundscape; no samples, downloads or copyrighted tracks.
   AudioContext starts only after an explicit user gesture. */
const OhioAudio=(()=>{
 let context=null,master=null,music=null,effects=null,active=false,muted=false,timer=null,step=0,mode="normal",volume=.5,era=0;
 const AudioContextClass=()=>window.AudioContext||window.webkitAudioContext;
 function ensure(){
  if(context)return true;
  const Class=AudioContextClass();if(!Class)return false;
  context=new Class();
  master=context.createGain();master.gain.value=.62;master.connect(context.destination);
  music=context.createGain();music.gain.value=volume;music.connect(master);
  effects=context.createGain();effects.gain.value=.42;effects.connect(master);
  return true;
 }
 function tone(frequency,duration=.3,type="sine",volume=.12,destination=null){
  if(!context||context.state!=="running"||muted)return;
  let now=context.currentTime,o=context.createOscillator(),g=context.createGain();
  o.type=type;o.frequency.value=frequency;
  g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),now+.04);
  g.gain.exponentialRampToValueAtTime(.0001,now+duration);
  o.connect(g);g.connect(destination||effects);o.start(now);o.stop(now+duration+.02);
 }
 function sweep(from,to,duration=.7,gain=.11){
  if(!context||context.state!=="running"||muted)return;
  const at=context.currentTime,osc=context.createOscillator(),env=context.createGain();
  osc.type="sawtooth";
  osc.frequency.setValueAtTime(Math.max(25,from),at);
  osc.frequency.exponentialRampToValueAtTime(Math.max(25,to),at+duration);
  env.gain.setValueAtTime(.001,at);
  env.gain.exponentialRampToValueAtTime(gain,at+.05);
  env.gain.exponentialRampToValueAtTime(.0001,at+duration);
  osc.connect(env);env.connect(effects);
  osc.start(at);osc.stop(at+duration+.03);
 }
 // Small original motifs for important milestones in the actual campaign.
 function milestone(name){
  if(!active||muted)return;
  if(name==="launch_failure"){
   sweep(430,55,.86,.12);
   [[155,.15],[118,.33],[92,.48]].forEach(([hz,delay])=>
    setTimeout(()=>tone(hz,.58,"sawtooth",.105),delay*1000));
   alarm();return;
  }
  if(name==="launch_success"||name==="space_launch"){
   sweep(80,480,1.3,.09);
   const notes=[261.63,392,523.25,659.25,783.99,1046.5];
   const delays=[0,210,440,660,1020,1320];
   notes.forEach((hz,i)=>setTimeout(()=>{
    tone(hz,i===notes.length-1?1.6:.55,"triangle",.11);
    if(i>=3)tone(hz/2,.95,"sine",.065);
   },delays[i]));
   return;
  }
 }
 // Written specifically for Ohio: 16-bar looping score, not random pulsations.
 const melody=[0,4,7,9,7,4,2,4, 0,4,7,12,9,7,4,2,
  -2,2,5,7,5,2,0,2, -2,2,5,9,7,5,2,0,
  0,4,7,11,9,7,4,2, 0,4,7,12,11,9,7,4,
  -4,0,4,7,4,0,-2,0, -4,0,4,7,9,7,4,0];
 const semitone=n=>220*Math.pow(2,n/12);
 function soundtrack(){
  if(!active||muted||!context||context.state!=="running")return;
  const i=step++%64, beat=i%8, bar=Math.floor(i/8);
  const root=[0,-2,3,-4][Math.floor(bar/2)%4];
  if(beat===0||beat===4)tone(semitone(root-12),.62,"triangle",.16,music);
  if(beat%2===0)tone(semitone(root+7),.24,"sine",.045,music);
  const pitch=melody[i]+(mode==="critical"?-5:0)+(era>=4?7:era>=2?2:0);
  if(i%8!==7)tone(semitone(pitch+12),mode==="critical"?.25:.38,mode==="critical"?"sawtooth":"triangle",.105,music);
  if(mode!=="normal"&&i%2===1)tone(semitone(root+12),.14,"triangle",.057,music);
  if(era>=3&&i%4===0)tone(semitone(root+19),.6,"sine",.038,music);
 }
 async function start(){
  if(!ensure())return false;
  await context.resume();active=true;muted=false;master.gain.value=.62;
  soundtrack();if(!timer)timer=setInterval(soundtrack,375);
  return true;
 }
 function pause(){active=false;if(timer){clearInterval(timer);timer=null}}
 function toggle(){if(active&&!muted){muted=true;master.gain.value=0;return Promise.resolve(false)}return start()}
 function effect(name){
  if(!active||muted)return;
  if(["launch_success","launch_failure","space_launch"].includes(name)){milestone(name);return}
  const patterns={
   build:[[329.63,.11],[493.88,.19]],
   work:[[220,.08],[277.18,.12]],
   aero_attempt:[[196,.23],[293.66,.28],[392,.3]],
   space_launch:[[130.81,.35],[261.63,.5],[523.25,.65]],
   grid_upgrade:[[261.63,.1],[392,.12]],
   investor:[[349.23,.1],[440,.16]],
   licence:[[440,.13],[587.33,.18]],
   decision:[[261.63,.18],[329.63,.25]]
  };
  let seq=patterns[name]||[[246.94,.1]];
  seq.forEach(([freq,duration],i)=>setTimeout(()=>tone(freq,duration,"triangle",.06),i*125));
 }
 function alarm(){
  if(!active||muted)return;
  [660,440,660,440].forEach((frequency,i)=>{
   setTimeout(()=>tone(frequency,.19,"triangle",.09),i*230);
  });
 }
 function setMode(value){const next=["normal","warning","critical"].includes(value)?value:"normal";if(next===mode)return;mode=next;if(active&&!muted)soundtrack()}
 function setMusicVolume(level){volume=Math.max(0,Math.min(1,Number(level)||0));if(music&&context)music.gain.setTargetAtTime(volume,context.currentTime,.06)}
 function setEra(stage){era=Math.max(0,Math.min(6,Number(stage)||0))}
 function getMusicVolume(){return volume}
 function status(){return active&&!muted}
 return {start,toggle,pause,effect,alarm,status,setMode,setMusicVolume,getMusicVolume,setEra};
})();
window.OhioAudio=OhioAudio;
