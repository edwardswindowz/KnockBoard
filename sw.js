const V="kb-shell-v1",T="kb-tiles-v1",MAX_TILES=400;
const SHELL=["./","index.html","manifest.webmanifest","icon-192.png","icon-512.png",
"https://unpkg.com/leaflet@1.9.4/dist/leaflet.css","https://unpkg.com/leaflet@1.9.4/dist/leaflet.js","https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"];
self.addEventListener("install",e=>{e.waitUntil((async()=>{const c=await caches.open(V);await Promise.all(SHELL.map(u=>c.add(u).catch(()=>{})));self.skipWaiting()})())});
self.addEventListener("activate",e=>{e.waitUntil((async()=>{for(const k of await caches.keys())if(k!==V&&k!==T)await caches.delete(k);await self.clients.claim()})())});
const isTile=h=>h.endsWith("arcgisonline.com")||h.endsWith("cartocdn.com");
const isLib=h=>h==="unpkg.com"||h==="cdn.jsdelivr.net";
async function trim(c){const ks=await c.keys();for(let i=0;i<ks.length-MAX_TILES;i++)await c.delete(ks[i])}
self.addEventListener("fetch",e=>{
  const r=e.request;if(r.method!=="GET")return;
  const u=new URL(r.url);
  if(u.hostname.endsWith("supabase.co")||u.hostname.endsWith("stripe.com"))return; // never touch data or billing
  if(isTile(u.hostname)){
    e.respondWith((async()=>{const c=await caches.open(T),hit=await c.match(r);if(hit)return hit;
      try{const n=await fetch(r);if(n&&(n.ok||n.type==="opaque")){c.put(r,n.clone());trim(c)}return n}catch(err){return Response.error()}})());return}
  if(isLib(u.hostname)){
    e.respondWith((async()=>{const c=await caches.open(V),hit=await c.match(r);if(hit)return hit;
      const n=await fetch(r);if(n.ok)c.put(r,n.clone());return n})());return}
  if(u.origin===location.origin){
    e.respondWith((async()=>{const c=await caches.open(V);
      const fromCache=async()=>(await c.match(r,{ignoreSearch:true}))||((u.pathname.endsWith("/")||u.pathname.endsWith("/index.html"))?await c.match("index.html"):undefined);
      try{
        const n=await Promise.race([fetch(r),new Promise((_,rej)=>setTimeout(rej,4000))]);
        if(n.ok)c.put(r,n.clone());return n;
      }catch(err){const h=await fromCache();if(h)return h;return fetch(r)}})())}
});
