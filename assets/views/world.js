"use strict";
function render_world(g){
let world=el("world");world.replaceChildren(node("h2","","RED ELÉCTRICA Y AGUA POTABLE MUNDIAL"));
const ns="http://www.w3.org/2000/svg";const diagram=document.createElementNS(ns,"svg");diagram.setAttribute("viewBox","0 0 860 350");diagram.setAttribute("role","img");diagram.setAttribute("aria-label","Esquema de nodos de red eléctrica mundial con cobertura regional");diagram.style.cssText="width:100%;max-height:350px;background:#071c17;border:1px solid #2f6250;border-radius:10px";
const positions={americas:[170,150],europe:[420,95],africa:[425,205],asia:[620,125],oceania:[720,270]};
for(const [a,b] of [["americas","europe"],["europe","africa"],["europe","asia"],["asia","oceania"]]){let p1=positions[a],p2=positions[b],line=document.createElementNS(ns,"line");for(let [k,v] of Object.entries({x1:p1[0],y1:p1[1],x2:p2[0],y2:p2[1],stroke:"#356b59","stroke-width":3,"stroke-dasharray":"8 7"}))line.setAttribute(k,v);diagram.append(line)}
g.world.forEach(r=>{let [x,y]=positions[r.id],ratio=(r.delivered_power/r.power+r.delivered_water/r.water)/2;let ring=document.createElementNS(ns,"circle");for(let [k,v] of Object.entries({cx:x,cy:y,r:30,fill:r.connected?"#176849":"#24352e",stroke:ratio===1?"#70e4a7":"#5da98a","stroke-width":4}))ring.setAttribute(k,v);diagram.append(ring);let name=document.createElementNS(ns,"text");for(let [k,v] of Object.entries({x,y:y+52,fill:"#d4fbe6","font-size":16,"text-anchor":"middle"}))name.setAttribute(k,v);name.textContent=r.name;diagram.append(name);let pct=document.createElementNS(ns,"text");for(let [k,v] of Object.entries({x,y:y+5,fill:"#ffffff","font-size":15,"font-weight":"bold","text-anchor":"middle"}))pct.setAttribute(k,v);pct.textContent=Math.round(ratio*100)+"%";diagram.append(pct)});world.append(diagram);
let worldGrid=node("div","grid");
g.world.forEach(r=>{let c=card(r.name,"Electricidad "+r.delivered_power+"/"+r.power+" · Agua "+r.delivered_water+"/"+r.water,"Tendido inicial: "+r.cost+" créditos, "+(r.power*2)+" mineral");
if(!r.connected)c.append(btn("Conectar región",()=>act("world_connect",r.id),!!g.pending));
else c.append(btn("Extender 100 de electricidad",()=>act("world_supply",r.id+":power"),r.delivered_power>=r.power||!!g.pending),btn("Potabilizar 100 de agua",()=>act("world_supply",r.id+":water"),r.delivered_water>=r.water||!!g.pending));worldGrid.append(c)});
world.append(worldGrid);

}
