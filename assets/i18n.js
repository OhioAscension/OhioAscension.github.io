"use strict";
/* Ohio i18n: original Spanish text is canonical; English is a display layer.
 * This never translates engine IDs, API requests, save state or credentials.
 * Legacy translated nodes remain switchable without a page reload.
 */
window.OhioI18n=(()=>{
 const supported=new Set(["default","es","en"]);
 const detect=()=>{
  const raw=(navigator.languages?.[0]||navigator.language||"es").toLowerCase();
  return raw.startsWith("es")?"es":"en";  // en-US and en-GB share a catalogue.
 };
 let preference="default";
 try{
  const stored=localStorage.getItem("ohio-language-choice");
  if(supported.has(stored))preference=stored;
 }catch(_){}
 const effective=()=>preference==="default"?detect():preference;
 const pairs=(window.OhioLocaleEnglish||[]).filter(p=>Array.isArray(p)&&p.length===2&&p[0]&&p[1])
  .sort((a,b)=>b[0].length-a[0].length);
 const original=new WeakMap();
 const originalAttributes=new WeakMap();
 const attrs=["placeholder","title","aria-label"];
 let observer=null,working=false;
 const spanishSource=[
  ["IDENTITY GATE","ACCESO A OHIO"],
  ["AUTHORIZED PERSONNEL ONLY","SOLO PERSONAL AUTORIZADO"],
  ["OHIO SYSTEMS","SISTEMAS OHIO"],
  ["OHIO NETWORK","RED OHIO"]
 ];
 function translateText(value,language=effective()){
  let result=String(value);
  // Normalize legacy English shell labels even when Spanish is selected.
  for(const [src,dst] of spanishSource)result=result.split(src).join(dst);
  if(language!=="en")return result;
  for(const [src,dst] of pairs){
   if(result.includes(src))result=result.split(src).join(dst);
  }
  return result;
 }
 function paintText(node){
  if(node.nodeType!==3||!node.parentNode||
      ["SCRIPT","STYLE","NOSCRIPT"].includes(node.parentNode.nodeName))return;
  const current=node.nodeValue||"";
  const stored=original.get(node);
  const source=stored&&stored.translated===current?stored.source:current;
  // The heading has an <em> child, so its two text nodes cannot be
  // translated as a single "INDUSTRIAL REVOLUTION" string.
  const inHero=node.parentNode.closest?.(".hero h1");
  let output;
  if(inHero){
   const emphasis=node.parentNode.nodeName==="EM";
   if(emphasis)output=effective()==="es"?"INDUSTRIAL":"REVOLUTION";
   else output=effective()==="es"?"REVOLUCIÓN ":"INDUSTRIAL ";
  }else output=translateText(source);
  original.set(node,{source,translated:output});
  if(current!==output)node.nodeValue=output;
 }
 function paintAttributes(element){
  if(element.nodeType!==1)return;
  const prev=originalAttributes.get(element)||{};
  for(const attr of attrs){
   if(!element.hasAttribute(attr))continue;
   const value=element.getAttribute(attr);
   const memo=prev[attr];
   const source=memo&&memo.translated===value?memo.source:value;
   const output=translateText(source);
   prev[attr]={source,translated:output};
   if(value!==output)element.setAttribute(attr,output);
  }
  originalAttributes.set(element,prev);
 }
 function paint(root=document.documentElement){
  if(!root||working)return;
  working=true;
  try{
   if(root.nodeType===3){paintText(root);return}
   if(root.nodeType===1)paintAttributes(root);
   const tree=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);
   while(tree.nextNode()){
    if(tree.currentNode.nodeType===3)paintText(tree.currentNode);
    else paintAttributes(tree.currentNode);
   }
   document.documentElement.lang=effective();
  }finally{working=false}
 }
 function setProfile(raw,{remember=true}={}){
  if(!supported.has(raw))throw Error("Idioma no disponible.");
  preference=raw;
  if(remember){try{localStorage.setItem("ohio-language-choice",raw)}catch(_){}}
  paint();
  document.dispatchEvent(new CustomEvent("ohio:languagechange",{detail:{preference,language:effective()}}));
  return effective();
 }
 function listen(){
  if(observer||!document.documentElement)return;
  observer=new MutationObserver(changes=>{
   if(working)return;
   for(const change of changes){
    if(change.type==="characterData"){paintText(change.target);continue}
    if(change.type==="attributes"){paintAttributes(change.target);continue}
    for(const node of change.addedNodes)paint(node);
   }
  });
  observer.observe(document.documentElement,{
   childList:true,subtree:true,characterData:true,
   attributes:true,attributeFilter:attrs
  });
  paint();
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",listen,{once:true});
 else listen();
 return {detect,effective,preference:()=>preference,setProfile,translateText,paint,supported:[...supported]};
})();
