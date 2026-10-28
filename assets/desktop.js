"use strict";
/* Desktop-only command center. No changes to game actions or server state. */
const OhioDesktop=(()=>{
 const game=document.getElementById("game");
 const tabs=[...document.querySelectorAll(".tabs [data-tab]")];
 const fmt=n=>Number(n||0).toLocaleString(window.OhioI18n?.effective()==="en"?"en-US":"es-AR");
 if(!game)return {update(){}};

 const overview=document.createElement("section");
 overview.id="desktop-overview";
 overview.className="desktop-only";
 overview.setAttribute("aria-label","Resumen de la colonia");
 overview.innerHTML=
  '<div class="desktop-overview-heading"><div><span class="desktop-eyebrow">CENTRO DE COMANDO / TELEMETRÍA EN VIVO</span><strong id="desktop-colony-name">COLONIA OHIO</strong></div>'+
  '<button type="button" id="desktop-search-launch" aria-keyshortcuts="Control+K">⌕ Buscar sección <kbd>Ctrl K</kbd></button></div>'+
  '<div class="desktop-overview-grid">'+
  '<div class="desktop-kpi"><span>CRÉDITOS</span><strong id="desk-credits">—</strong><small>Capital disponible</small></div>'+
  '<div class="desktop-kpi"><span>ENERGÍA</span><strong id="desk-energy">—</strong><small>Turnos disponibles</small></div>'+
  '<div class="desktop-kpi"><span>DÍA / HORA</span><strong id="desk-clock">—</strong><small id="desk-shift">Turno en curso</small></div>'+
  '<div class="desktop-kpi"><span>INSTALACIONES</span><strong id="desk-buildings">—</strong><small id="desk-stage">Etapa industrial</small></div>'+
  '</div>';
 game.prepend(overview);

 const shell=document.createElement("div");
 shell.id="desktop-command";
 shell.className="desktop-only";
 shell.hidden=true;
 shell.innerHTML=
  '<div class="desktop-command-backdrop"></div>'+
  '<section class="desktop-command-window" role="dialog" aria-modal="true" aria-label="Ir a una sección">'+
  '<div class="desktop-command-field"><span aria-hidden="true">⌕</span><input type="search" id="desktop-command-search" placeholder="Buscar un área de Ohio…" autocomplete="off" aria-label="Buscar sección"><kbd>ESC</kbd></div>'+
  '<div id="desktop-command-results" role="listbox" aria-label="Secciones disponibles"></div>'+
  '<p class="desktop-command-help">↑ ↓ para navegar · Entrar para abrir · Secciones bloqueadas no aparecen</p></section>';
 document.body.append(shell);
 const input=document.getElementById("desktop-command-search");
 const results=document.getElementById("desktop-command-results");
 let paletteOpen=false,selected=0,entries=[],lastFocus=null;

 function allowed(){
  return tabs.filter(tab=>!tab.classList.contains("ohio-discovery-hidden"));
 }
 function draw(){
  const search=input.value.trim().toLocaleLowerCase("es");
  entries=allowed().filter(tab=>tab.textContent.toLocaleLowerCase("es").includes(search));
  selected=Math.max(0,Math.min(selected,entries.length-1));
  results.replaceChildren();
  if(!entries.length){
   const empty=document.createElement("p");empty.className="desktop-command-empty";
   empty.textContent="No hay secciones disponibles con ese nombre.";
   results.append(empty);return;
  }
  entries.forEach((tab,i)=>{
   const item=document.createElement("button");
   item.type="button";item.setAttribute("role","option");
   item.id="desktop-option-"+i;
   item.setAttribute("aria-selected",String(i===selected));
   const label=document.createElement("span");
   label.textContent=tab.textContent;
   const hint=document.createElement("small");
   hint.textContent=tab.classList.contains("active")?"ABIERTA":"IR ↗";
   item.append(label,hint);
   item.addEventListener("mouseenter",()=>{
    selected=i;results.querySelectorAll("button").forEach((btn,index)=>btn.setAttribute("aria-selected",String(index===i)));
   });
   item.addEventListener("click",()=>openTab(tab));
   results.append(item);
  });
  input.setAttribute("aria-activedescendant","desktop-option-"+selected);
 }
 function open(){
  if(window.matchMedia("(max-width:800px)").matches||game.hidden)return;
  lastFocus=document.activeElement;
  shell.hidden=false;paletteOpen=true;selected=0;input.value="";
  draw();input.focus();
 }
 function close(){
  if(!paletteOpen)return;
  paletteOpen=false;shell.hidden=true;
  input.removeAttribute("aria-activedescendant");
  lastFocus?.focus?.();lastFocus=null;
 }
 function openTab(tab){
  if(!tab||tab.classList.contains("ohio-discovery-hidden"))return;
  close();
  tab.click();
  const view=document.getElementById(tab.dataset.tab);
  if(view&&!view.hidden)view.scrollIntoView({block:"start",behavior:"smooth"});
 }
 function navigate(amount){
  if(!entries.length)return;
  selected=(selected+amount+entries.length)%entries.length;
  draw();
  results.querySelector('[aria-selected="true"]')?.scrollIntoView({block:"nearest"});
 }
 document.getElementById("desktop-search-launch").addEventListener("click",open);
 shell.querySelector(".desktop-command-backdrop").addEventListener("click",close);
 input.addEventListener("input",()=>{selected=0;draw()});
 shell.addEventListener("keydown",e=>{
  if(e.key==="Escape"){e.preventDefault();close()}
  if(e.key==="ArrowDown"){e.preventDefault();navigate(1)}
  if(e.key==="ArrowUp"){e.preventDefault();navigate(-1)}
  if(e.key==="Enter"){e.preventDefault();openTab(entries[selected])}
  if(e.key==="Tab"){
   // The only keyboard input in this dialog is search.
   e.preventDefault();input.focus();
  }
 });
 document.addEventListener("keydown",e=>{
  const shortcut=(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k";
  if(shortcut){e.preventDefault();paletteOpen?close():open();return}
  if(e.key==="Escape"&&paletteOpen){e.preventDefault();close()}
  if(e.key==="/"&&!paletteOpen&&!e.ctrlKey&&!e.metaKey
     &&!["INPUT","TEXTAREA","SELECT"].includes(document.activeElement?.tagName)
     &&!document.activeElement?.isContentEditable){
   e.preventDefault();open();
  }
 });
 tabs.forEach(tab=>tab.addEventListener("click",()=>{
  tabs.forEach(t=>{
   t.setAttribute("aria-current",t.classList.contains("active")?"page":"false");
  });
 }));
 function update(g){
  if(!g)return;
  document.getElementById("desk-credits").textContent=fmt(g.stats.credits);
  document.getElementById("desk-energy").textContent=fmt(g.stats.energy);
  document.getElementById("desk-clock").textContent=String(g.stats.day)+" / "+String(g.clock.hour).padStart(2,"0")+":"+String(g.clock.minute).padStart(2,"0");
  document.getElementById("desk-shift").textContent=g.clock.daylight?"Jornada activa":"Turno nocturno";
  const total=(g.projects||[]).reduce((n,p)=>n+Number(p.owned||0),0);
  document.getElementById("desk-buildings").textContent=fmt(total);
  const progress=window.OhioProgression?.state(g);
  document.getElementById("desk-stage").textContent=progress?"Etapa "+(progress.stage+1)+" / 7":"Industria";
  document.getElementById("desktop-colony-name").textContent=g.sectors?.find(s=>s.id===g.location)?.name||"Colonia Ohio";
  if(paletteOpen)draw();
 }
 return {update,open,close};
})();
window.OhioDesktop=OhioDesktop;
