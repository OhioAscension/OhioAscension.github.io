"use strict";
/* Read-only animated world vignette. Shares scene/beat lifecycle with game view. */
const OhioLive=(()=>{
 const $=id=>document.getElementById(id);
 const shapes={
  factory:`<rect x="35" y="190" width="570" height="34" fill="#1a4736"/><rect x="118" y="105" width="170" height="90" fill="#245846"/><rect x="118" y="105" width="170" height="8" fill="#65b98b"/><rect x="315" y="85" width="130" height="110" fill="#235441"/><rect x="476" y="45" width="24" height="150" fill="#647975"/><g fill="#f8d77c"><rect x="145" y="142" width="25" height="23"/><rect x="192" y="142" width="25" height="23"/><rect x="348" y="123" width="28" height="24"/></g><path d="M500 52 L590 52" stroke="#e6ba65" stroke-width="9"/><path d="M551 52 V148" stroke="#e6ba65" stroke-width="3"/><rect id="payload" x="533" y="148" width="37" height="24" rx="3" fill="#c4d5c8"/>`,
  power:`<path d="M55 207 H590" stroke="#508578" stroke-width="4"/><path d="M95 187 L155 55 L215 187 M155 55 V205 M111 148 H198 M122 121 H185" fill="none" stroke="#b0c6bb" stroke-width="7"/><path d="M260 205 V84 H365 V205" fill="#26493c" stroke="#76bd98" stroke-width="4"/><rect x="278" y="103" width="68" height="78" rx="5" fill="#4b9477"/><path d="M389 152 H548" stroke="#9cb5a6" stroke-width="5"/><circle id="station-led" cx="552" cy="152" r="15" fill="#75f3aa"/><path d="M155 77 C250 45 320 45 389 152" stroke="#74e5af" stroke-width="3" fill="none" stroke-dasharray="7 12" class="current"/>`,
  rocket:`<rect x="50" y="209" width="540" height="17" fill="#225d45"/><path d="M205 213 V45 M205 45 H315" stroke="#647d78" stroke-width="8" fill="none"/><rect x="290" y="110" width="16" height="96" fill="#71887d"/><g id="rocket"><path d="M387 52 Q410 4 433 52 L433 170 L387 170 Z" fill="#d8e9dd" stroke="#9fd8bb" stroke-width="3"/><circle cx="410" cy="77" r="13" fill="#388a72"/><path d="M387 142 L366 172 L386 172 M433 142 L454 172 L434 172" fill="#d98762"/><path id="rocket-flame" d="M393 174 Q410 230 427 174" fill="#ffb54c"/></g><path d="M455 205 H525" stroke="#44705b" stroke-width="4"/>`,
  orbit:`<circle cx="315" cy="138" r="77" fill="#2c7173"/><path d="M257 104 Q330 87 362 142 Q295 155 345 188" stroke="#75b6a4" stroke-width="13" fill="none"/><ellipse cx="315" cy="138" rx="225" ry="75" fill="none" stroke="#568976" stroke-width="2" stroke-dasharray="9 8"/><g id="satellite"><rect x="466" y="116" width="35" height="25" rx="4" fill="#c1dacc"/><rect x="416" y="113" width="44" height="30" fill="#347460"/><rect x="507" y="113" width="44" height="30" fill="#347460"/></g>`
 };
 function scene(index,beat){
  const type=index===2?"power":index>=5&&index<=7?"rocket":index===8?"orbit":"factory";
  $("visual-objects").innerHTML=shapes[type];
  $("visual-background").innerHTML='<circle cx="540" cy="50" r="24" fill="#9ad7bc" opacity=".28"/><path d="M0 225 H640" stroke="#376953" stroke-width="2"/>';
  $("live-visual").dataset.kind=type;
  $("live-visual").dataset.beat=String(beat);
  $("visual-label").textContent=type==="rocket"?"OHIO AEROSPACE":type==="power"?"CENTRO DE RED":"OHIO · "+(type==="orbit"?"HELIOS":"INDUSTRIA");
  $("visual-event").textContent=["INICIANDO OPERACIÓN","OPERACIÓN EN CURSO","EVENTO DETECTADO","RESULTADO ACTUALIZADO"][beat];
  $("visual-progress").textContent=Math.round((beat+1)*25)+"%";
  $("live-visual").classList.toggle("critical",index===2&&beat===2);
 }
 return {scene};
})();
window.OhioLive=OhioLive;