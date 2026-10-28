"use strict";
/*
 * Ohio cinematic effects shared by PC, phone and the public trailer.
 * Events are read-only visual interpretations of confirmed engine results.
 * Bounded particle counts, capped DPR and zero animation when reduced motion.
 */
const OhioCinematics=(()=>{
 const motion=window.matchMedia("(prefers-reduced-motion: reduce)");
 const layer=document.createElement("div");
 layer.className="ohio-cinematic-stage";
 layer.setAttribute("aria-live","off");
 layer.setAttribute("aria-hidden","true");
 const canvas=document.createElement("canvas");
 canvas.className="ohio-cinematic-canvas";
 const label=document.createElement("div");
 label.className="ohio-cinematic-label";
 const eyebrow=document.createElement("span");
 eyebrow.className="ohio-cinematic-eyebrow";
 eyebrow.textContent="OHIO · CONTROL DE MISIÓN";
 const headline=document.createElement("strong");
 const detail=document.createElement("small");
 label.append(eyebrow,headline,detail);
 layer.append(canvas,label);
 document.body.append(layer);
 const ctx=canvas.getContext("2d",{alpha:true});
 let active=null,raf=0,displayTimer=0,seed=14563;
 const PREF="ohio-cinematic-effects";
 let enabled=localStorage.getItem(PREF)!=="false";
 const toggle=document.getElementById("cinematics-toggle");
 function syncToggle(){
  if(!toggle)return;
  toggle.textContent=enabled?"Efectos cinematográficos: activados":"Efectos cinematográficos: desactivados";
  toggle.setAttribute("aria-pressed",String(enabled));
 }
 if(toggle)toggle.addEventListener("click",()=>{
  enabled=!enabled;localStorage.setItem(PREF,String(enabled));
  if(!enabled){
   cancelAnimationFrame(raf);clearTimeout(displayTimer);
   layer.classList.remove("active");layer.style.opacity="0";active=null;
  }
  syncToggle();
 });
 syncToggle();
 const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
 const ease=x=>1-Math.pow(1-clamp(x,0,1),3);
 const config={
  failure:{title:"LANZAMIENTO FALLIDO",sub:"Anomalía crítica · Iniciando investigación",duration:3600},
  blackout:{title:"RED ELÉCTRICA EN CRISIS",sub:"Suministro interrumpido · Ejecutar protocolo",duration:2600},
  warning:{title:"INCIDENTE DETECTADO",sub:"El centro de mando requiere atención",duration:2000},
  launch:{title:"DESPEGUE CONFIRMADO",sub:"La siguiente frontera empieza acá",duration:4900},
  finale:{title:"PRIMERA BASE EXTRATERRESTRE",sub:"Ohio ya no pertenece solamente a la Tierra",duration:3700},
  resolve:{title:"OPERACIONES RESTABLECIDAS",sub:"La colonia sigue adelante",duration:2500},
  repair:{title:"REPARACIÓN COMPLETADA",sub:"Ingeniería devuelve el control",duration:2300},
  build:{title:"INSTALACIÓN CONSTRUIDA",sub:"La industria sigue creciendo",duration:2200},
  power:{title:"ENERGÍA EN LÍNEA",sub:"La red recupera capacidad",duration:2300},
  approve:{title:"AUTORIZACIÓN CONCEDIDA",sub:"Control legal confirmado",duration:1850},
  work:{title:"RECURSOS OBTENIDOS",sub:"El siguiente paso ya está en marcha",duration:1650}
 };
 function fit(){
  if(!ctx)return;
  const dpr=Math.min(2,window.devicePixelRatio||1);
  const width=window.innerWidth,height=window.innerHeight;
  if(canvas.width!==Math.ceil(width*dpr)||canvas.height!==Math.ceil(height*dpr)){
   canvas.width=Math.ceil(width*dpr);canvas.height=Math.ceil(height*dpr);
  }
  ctx.setTransform(dpr,0,0,dpr,0,0);
  return {w:width,h:height};
 }
 function dot(x,y,r,color,alpha=1){
  ctx.globalAlpha=clamp(alpha,0,1);
  ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,Math.max(.2,r),0,2*Math.PI);ctx.fill();
  ctx.globalAlpha=1;
 }
 function ring(x,y,r,color,alpha=1,width=2){
  ctx.globalAlpha=clamp(alpha,0,1);
  ctx.lineWidth=width;ctx.strokeStyle=color;
  ctx.beginPath();ctx.arc(x,y,Math.max(0,r),0,Math.PI*2);ctx.stroke();
  ctx.globalAlpha=1;
 }
 function spawn(kind,w,h){
  seed=14563+kind.length*787;
  const x=w*(w<650?.52:.61),y=h*(w<650?.43:.52);
  const count=kind==="failure"?125:kind==="launch"?80:kind==="finale"?85:kind==="blackout"?65:48;
  return Array.from({length:count},(_,i)=>{
   const theta=rand()*Math.PI*2,speed=(.25+rand()*.8)*(kind==="failure"?350:kind==="launch"?155:210);
   return {x,y,theta,speed,r:1.5+rand()*5,life:.45+rand()*.55,phase:rand()*Math.PI*2,offset:rand(),i};
  });
 }
 function grid(w,h,t,kind){
  const alpha=(kind==="blackout"?.17:.08)*(1-ease(Math.max(0,t-.65)));
  ctx.strokeStyle=kind==="failure"?"rgba(248,113,91,"+alpha+")":"rgba(130,243,171,"+alpha+")";
  ctx.lineWidth=1;
  for(let i=0;i<Math.ceil(w/66);i++){
   ctx.beginPath();ctx.moveTo(i*66,0);ctx.lineTo(i*66,h);ctx.stroke();
  }
  for(let j=0;j<Math.ceil(h/66);j++){
   ctx.beginPath();ctx.moveTo(0,j*66);ctx.lineTo(w,j*66);ctx.stroke();
  }
 }
 function rocket(x,y,scale,kind,t){
  ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
  const flame=ease(Math.min(1,t*3));
  if(kind==="launch"){
   const plume=ctx.createLinearGradient(0,20,0,150);
   plume.addColorStop(0,"rgba(255,255,205,.92)");
   plume.addColorStop(.24,"rgba(255,171,51,.9)");
   plume.addColorStop(1,"rgba(255,72,36,0)");
   ctx.fillStyle=plume;
   ctx.beginPath();ctx.moveTo(-9,20);ctx.quadraticCurveTo(-24,85,-5,150+35*rand());
   ctx.quadraticCurveTo(24,90,9,20);ctx.closePath();ctx.fill();
   for(let i=0;i<6;i++)dot((rand()-.5)*24,32+rand()*85,3+rand()*5,"#ffba66",.35+rand()*.6);
  }
  ctx.fillStyle="#d9fff0";
  ctx.beginPath();ctx.moveTo(0,-45);ctx.quadraticCurveTo(14,-27,13,12);
  ctx.lineTo(9,28);ctx.lineTo(-9,28);ctx.lineTo(-13,12);
  ctx.quadraticCurveTo(-14,-27,0,-45);ctx.fill();
  ctx.fillStyle="#46c785";ctx.fillRect(-11,6,22,5);
  ctx.fillStyle="#173f35";ctx.beginPath();ctx.arc(0,-8,6,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#67e6aa";
  ctx.beginPath();ctx.moveTo(-11,10);ctx.lineTo(-25,29);ctx.lineTo(-9,22);ctx.fill();
  ctx.beginPath();ctx.moveTo(11,10);ctx.lineTo(25,29);ctx.lineTo(9,22);ctx.fill();
  ctx.restore();
 }
 function draw(now){
  if(!active||!ctx)return;
  const elapsed=now-active.start,p=clamp(elapsed/active.duration,0,1);
  const {w,h}=fit();
  ctx.clearRect(0,0,w,h);
  const kind=active.kind,particles=active.particles,x=w*(w<650?.52:.61),y=h*(w<650?.43:.52);
  grid(w,h,p,kind);
  if(["failure","blackout","warning"].includes(kind)){
   const bg=ctx.createRadialGradient(x,y,5,x,y,Math.min(w,h)*.7);
   bg.addColorStop(0,kind==="failure"?"rgba(255,113,61,.29)":"rgba(220,117,38,.16)");
   bg.addColorStop(1,"rgba(11,14,12,0)");
   ctx.globalAlpha=1-ease(Math.max(0,p-.42));
   ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);ctx.globalAlpha=1;
  }
  if(kind==="launch"){
   const travel=ease(clamp((p-.06)/.78,0,1));
   const sx=x,sy=h*.73-travel*h*.9;
   rocket(sx,sy,Math.min(1.65,Math.max(.8,w/590)),kind,p);
   const trailX=sx,trailY=sy+35;
   for(const pt of particles){
    const age=(p*2+pt.offset)%1;
    dot(trailX+Math.sin(pt.theta)*age*70,
        trailY+age*(85+pt.speed*.33),
        pt.r*(.5+age*2),"#ffba72",(1-age)*.42);
   }
   ring(sx,sy+42,25+easing(p)*140,"#96f3b4",.5*(1-p),2);
  }else if(kind==="failure"){
   if(p<.23)rocket(x,y+40-p*210,Math.max(.8,w/680),"failure",p);
   const blast=ease(clamp((p-.17)/.23,0,1));
   if(blast>0){
    const radius=Math.min(w,h)*.48*blast;
    ring(x,y,radius,"#ffc27b",.85*(1-p),4);
    ring(x,y,radius*.73,"#ff7455",.6*(1-p),12);
    dot(x,y,Math.max(1,70*(1-blast)),"#fff3c7",.8*(1-p));
    for(const pt of particles){
     const spread=blast*pt.speed*.52;
     dot(x+Math.cos(pt.theta)*spread,
         y+Math.sin(pt.theta)*spread+blast*blast*65,
         pt.r*(1+blast*.5),pt.i%3===0?"#ffdb91":pt.i%2===0?"#e8a672":"#fa6846",
         (1-p)*pt.life);
    }
   }
  }else if(kind==="blackout"||kind==="power"){
   const f=kind==="power"?easing(p):1-easing(p);
   for(let i=0;i<11;i++){
    const yy=h*.22+i*h*.055;
    ctx.lineWidth=3;ctx.strokeStyle=kind==="power"?"rgba(130,255,190,.75)":"rgba(255,128,82,.62)";
    ctx.beginPath();ctx.moveTo(w*.1,yy);
    for(let j=0;j<8;j++){
     const xx=w*(.1+j*.115);
     ctx.lineTo(xx,yy+Math.sin(p*11+j*2+i)*9*f);
    }
    ctx.stroke();
   }
   for(const pt of particles){
    const px=pt.x+Math.cos(pt.theta)*p*pt.speed;
    const py=pt.y+Math.sin(pt.theta)*p*pt.speed;
    dot(px,py,pt.r,kind==="power"?"#8bffbc":"#fba067",(1-p)*.55);
   }
  }else{
   const green=kind==="finale"?"#c9f5fe":"#9cfac1";
   ring(x,y,Math.min(w,h)*(.10+p*.45),green,(1-p)*.72,kind==="finale"?4:2);
   ring(x,y,Math.min(w,h)*(.02+p*.36),"#5be39e",(1-p)*.48,3);
   for(const pt of particles){
    const distance=pt.speed*p*.36;
    dot(pt.x+Math.cos(pt.theta)*distance,pt.y+Math.sin(pt.theta)*distance,
        pt.r*(1-p*.55),green,(1-p)*pt.life);
   }
  }
  layer.style.opacity=String(clamp(Math.min(1,p*8,(1-p)*9),0,1));
  if(p<1)raf=requestAnimationFrame(draw);
  else{ctx.clearRect(0,0,w,h);layer.classList.remove("active");layer.style.opacity="0";active=null}
 }
 function easing(n){return 1-Math.pow(1-clamp(n,0,1),2)}
 function play(kind,options={}){
  if(!enabled)return;
  const base=config[kind];
  if(!base)return;
  cancelAnimationFrame(raf);clearTimeout(displayTimer);
  headline.textContent=options.title||base.title;
  detail.textContent=options.sub||base.sub;
  layer.dataset.kind=kind;
  layer.classList.add("active");
  layer.classList.toggle("no-motion",motion.matches||!ctx);
  if(motion.matches||!ctx){
   layer.style.opacity="1";
   displayTimer=setTimeout(()=>{layer.classList.remove("active");layer.style.opacity="0"},1600);
   return;
  }
  const dims=fit();
  active={kind,duration:base.duration,start:performance.now(),particles:spawn(kind,dims.w,dims.h)};
  layer.style.opacity="1";
  raf=requestAnimationFrame(draw);
 }
 function observe(before,after,kind){
  if(!after)return;
  const prev=before?.aerospace,cur=after.aerospace;
  if(kind==="aero_attempt"){
   if(cur?.blocked&&cur.blocked!==prev?.blocked){play("failure",{sub:"Control de misión: "+cur.blocked+". Preparando reparación."});return "failure"}
   if((cur?.stage||0)>(prev?.stage||0)){play("launch");return "launch"}
   return null;
  }
  if(kind==="space_launch"){play("finale");return "finale"}
  if(kind==="grid_repair"||kind==="grid_upgrade"){play("power");return "power"}
  if(kind==="aero_repair"){play("repair");return "repair"}
  if(kind==="build"||kind==="build_batch"||kind==="space_build"){play("build");return "build"}
  if(kind==="technology"||kind==="megaproject"){play("resolve");return "resolve"}
  return null;
 }
 return {play,observe};
})();
window.OhioCinematics=OhioCinematics;
