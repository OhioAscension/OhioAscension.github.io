"use strict";
/* A language selector on sign-in and inside the authenticated account panel.
 * No changes to the existing WebAuthn flow; save settings through the
 * authenticated, signed-campaign language endpoint.
 */
(()=>{
 const i18n=window.OhioI18n;
 if(!i18n||document.getElementById("login-language"))return;
 const $=id=>document.getElementById(id);
 const stylesheet=document.createElement("link");
 stylesheet.rel="stylesheet";
 const source=document.currentScript?.src||location.origin+"/assets/i18n-ui.js";
 const sheet=new URL("i18n.css",source);
 sheet.search=new URL(source,location.href).search;
 stylesheet.href=sheet.href;
 document.head.append(stylesheet);
 const auth=$("auth"),sidebar=$("sidebar");
 if(!auth||!sidebar)return;
 // Legacy source HTML included English branding; Spanish source is canonical.
 const heading=auth.querySelector("h2");
 if(heading&&heading.textContent==="IDENTITY GATE")heading.textContent="ACCESO A OHIO";
 const hero=document.querySelector(".hero h1");
 if(hero&&hero.textContent.includes("INDUSTRIAL")){
  hero.firstChild.nodeValue="REVOLUCIÓN ";
  const em=hero.querySelector("em");if(em)em.textContent="INDUSTRIAL";
 }
 const footer=document.querySelector("main footer");
 if(footer&&footer.textContent.includes("AUTHORIZED PERSONNEL ONLY"))
  footer.textContent="SISTEMAS OHIO · SOLO PERSONAL AUTORIZADO · Todo bien por suerte.";
 const base=String(window.OHIO_API_ORIGIN||"").replace(/\/$/,"");
 const request=async(method,route,body)=>{
  const response=await fetch(base+"/api/"+route,{
   method,credentials:"include",cache:"no-store",
   ...(body===undefined?{}:{headers:{"Content-Type":"application/json"},body:JSON.stringify(body)})
  });
  const value=await response.json();
  if(!response.ok)throw Error(value.error||"HTTP "+response.status);
  return value;
 };
 const createPicker=(id,extra)=>{
  const box=document.createElement("section");
  box.className="ohio-language-settings"+(extra?" profile-language":"");
  const label=document.createElement("label");
  label.htmlFor=id;label.textContent="Idioma";
  const select=document.createElement("select");
  select.id=id;select.setAttribute("aria-label","Idioma");
  for(const [value,name] of [
   ["default","Automático (idioma del sistema)"],
   ["es","Español"],
   ["en","English"]
  ]){const option=document.createElement("option");option.value=value;option.textContent=name;select.append(option)}
  const explanation=document.createElement("small");
  explanation.textContent="Detectado: "+(i18n.detect()==="es"?"Español":"English");
  box.append(label,select,explanation);
  return {box,select,explanation};
 };
 const login=createPicker("login-language",false);
 const profile=createPicker("profile-language",true);
 login.select.value="default";
 i18n.setProfile("default",{remember:false}); // Detect system locale on sign-in.
 const accountName=$("username");
 accountName?.insertAdjacentElement("afterend",login.box);
 if(!accountName)auth.append(login.box);
 sidebar.insertBefore(profile.box,sidebar.firstChild);
 // Unauthenticated users can try the UI in their own language. Once logged
 // in, the preference from the signed JSON save overrides this selection.
 login.select.addEventListener("change",()=>i18n.setProfile(login.select.value));
 let updating=false;
 async function refreshProfile(){
  if(updating)return;
  updating=true;
  try{
   const status=await request("GET","auth/status");
   if(!status.authenticated)return;
   const choice=status.lang||"default";
   i18n.setProfile(choice);
   profile.select.value=choice;
   profile.explanation.textContent="Idioma aplicado: "+(i18n.effective()==="es"?"Español":"English");
  }catch(error){
   profile.explanation.textContent="No se pudo cargar el idioma: "+String(error.message||error);
  }finally{updating=false}
 }
 profile.select.addEventListener("change",async()=>{
  const previous=i18n.preference(),selected=profile.select.value;
  profile.select.disabled=true;
  try{
   await request("POST","profile/language",{lang:selected});
   i18n.setProfile(selected);
   profile.explanation.textContent="Idioma guardado: "+(i18n.effective()==="es"?"Español":"English");
   // Refresh server-rendered labels and dynamic sections in the new locale.
   if(window.currentGame&&typeof render==="function")render(window.currentGame);
  }catch(error){
   profile.select.value=previous;
   profile.explanation.textContent="No se pudo guardar el idioma: "+String(error.message||error);
  }finally{profile.select.disabled=false}
 });
 // The original app uses auth.hidden for both registration methods and login.
 // The backend persists the locale at registration; reread the signed profile.
 const monitor=new MutationObserver(()=>{
  if(auth.hidden&&!updating)refreshProfile();
 });
 monitor.observe(auth,{attributes:true,attributeFilter:["hidden"]});
 document.addEventListener("ohio:languagechange",()=>{
  login.explanation.textContent="Detectado: "+(i18n.detect()==="es"?"Español":"English");
 });
 i18n.paint();
 // Existing cookie sessions may already have completed refresh when this JS
 // arrives; load their authoritative preference immediately.
 refreshProfile();
})();
