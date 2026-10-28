"use strict";
/* Visual ambiance. All animation is CSS and aggregated; never one element per factory. */
const OhioAmbience=(()=>{
 let previous=null,toastTimer=null,lastAlarm=0;
 const $=id=>document.getElementById(id);
 const root=document.documentElement;
 const scene=$("live-console");
 if(scene)scene.innerHTML='<div class="live-heading"><span class="signal"></span><b id="live-condition">CENTRO DE CONTROL</b><span id="live-clock">08:00</span></div><div class="industrial-sky" aria-hidden="true"><div class="sun"></div><div class="moon"></div><div class="factory-stars"></div><div class="industrial-haze"></div><div class="cloud cloud-a"></div><div class="cloud cloud-b"></div><div class="plant p1"><i></i><i></i></div><div class="plant p2"><i></i><i></i></div><div class="plant p3"><i></i><i></i></div><div class="stack"></div><div class="smoke"></div><div class="crane"><i></i></div><div class="terrain"></div></div><div class="live-readouts"><span id="live-machines">0 instalaciones</span><span id="live-grid">RED ESTABLE</span><span id="live-shift">JORNADA</span></div><div class="ohio-signal-feed" aria-live="off"><span class="ohio-signal-id">◈ OHIO NETWORK</span><strong id="live-radio">SEÑAL INDUSTRIAL ESTABLECIDA</strong><span class="ohio-radio-led" aria-hidden="true"></span></div>';
 const toast=document.createElement("div");toast.className="ohio-toast";toast.setAttribute("role","status");toast.setAttribute("aria-live","polite");document.body.append(toast);
 function notify(message,emergency=false){
  if(!message)return;
  toast.textContent=message;toast.classList.toggle("emergency",emergency);toast.classList.add("visible");
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove("visible"),4800);
 }
 function apply(g,{initial=false}={}){
  if(!scene)return;
  const hour=g.clock.hour;
  root.dataset.phase=hour<6||hour>=20?"night":hour<8?"dawn":hour>=17?"dusk":"day";
  const grid=g.energy_worlds.find(w=>w.id==="earth").grid;
  const deficit=grid.last.unserved, outage=deficit>0;
  root.classList.toggle("grid-alert",outage);
  const severity=!outage?"normal":deficit>=100?"critical":"warning";
  root.dataset.severity=severity;
  window.OhioAudio?.setMode?.(severity);
  window.OhioAudio?.setEra?.(window.OhioProgression?.state?.(g)?.stage||0);
  const count=Object.values(g.projects).reduce((sum,p)=>sum+p.owned,0);
  const stage=window.OhioProgression?.state?.(g)?.stage||0;
  const signal=outage
   ?"PRIORIDAD ROJA · MANTENIMIENTO DE LA RED"
   :g.decision_event||g.pending
    ?"CONSEJO DE ADMINISTRACIÓN · DECISIÓN PENDIENTE"
    :stage>=5
     ?"RED ORBITAL · LA COLONIA MIRA HACIA LAS ESTRELLAS"
     :stage>=4
      ?"INGENIERÍA AEROESPACIAL · VENTANA DE LANZAMIENTO"
      :count===0
       ?"MISIÓN INICIAL · LEVANTAR LA PRIMERA INDUSTRIA"
       :g.clock.daylight
        ?"PLANTAS EN OPERACIÓN · PRODUCCIÓN MONITOREADA"
        :"CONTROL NOCTURNO · SISTEMAS EN VIGILANCIA";
  if($("live-radio").textContent!==signal)$("live-radio").textContent=signal;
  scene.classList.toggle("industrial-haze-active",g.stats.pollution>=40);
  scene.classList.toggle("orbital-ready",stage>=4);
  root.style.setProperty("--factory-intensity",Math.min(1,count/25).toFixed(2));
  $("live-clock").textContent=String(hour).padStart(2,"0")+":"+String(g.clock.minute).padStart(2,"0");
  $("live-condition").textContent=outage?"EMERGENCIA ELÉCTRICA":g.clock.daylight?"OHIO · INDUSTRIA EN MARCHA":"OHIO · TURNO NOCTURNO";
  $("live-machines").textContent=count.toLocaleString("es-AR")+" INSTALACIONES";
  $("live-grid").textContent=outage?"DÉFICIT "+deficit:"SUMINISTRO ESTABLE";
  $("live-shift").textContent=g.clock.daylight?"JORNADA ACTIVA":"DESCANSO INDUSTRIAL";
  scene.classList.toggle("industrial-active",g.clock.daylight&&count>0);
  scene.classList.toggle("has-outage",outage);
  if(previous&&!initial){
   if(outage&&!previous.outage){
    notify("ALERTA ELÉCTRICA · Déficit de "+deficit+" unidades",true);
    window.OhioCinematics?.play("blackout");
    if(Date.now()-lastAlarm>30000){window.OhioAudio?.alarm?.();lastAlarm=Date.now()}
   }else if(!outage&&previous.outage){
    notify("SUMINISTRO RESTABLECIDO · Red eléctrica estable");
   }else if(g.stats.day!==previous.day){
    notify("DÍA "+g.stats.day+" · Nuevo ciclo de operaciones");
   }else if(g.clock.daylight!==previous.daylight){
    notify(g.clock.daylight?"COMIENZA LA JORNADA INDUSTRIAL":"FIN DEL TURNO · La industria descansa");
   }
  }
  previous={outage,day:g.stats.day,daylight:g.clock.daylight};
 }
 function action(kind){
  if(kind==="build"||kind==="build_batch")notify("INSTALACIÓN COMPLETADA · Producción ampliada");
  else if(kind==="space_launch"||kind==="aero_attempt")notify("CONTROL DE MISIÓN · Operación aeroespacial en curso");
  else if(kind==="grid_repair")notify("MANTENIMIENTO · Reparación eléctrica finalizada");
 }
 return {apply,action,notify};
})();
window.OhioAmbience=OhioAmbience;
