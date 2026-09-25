/* HATI app shell only. Supabase API and photos use their own version-aware cache. */
const CACHE='hati-shell-20260925-v9-record-icons';
const LIBS=['https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2','https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js'];
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);await cache.add(new Request('./index.html',{cache:'reload'}));
  await Promise.allSettled(LIBS.map(url=>cache.add(url)));
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  for(const name of await caches.keys())if(name.startsWith('hati-shell-')&&name!==CACHE)await caches.delete(name);
  await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin===self.location.origin&&event.request.mode==='navigate'){
    event.respondWith((async()=>{const cache=await caches.open(CACHE);try{const response=await fetch(event.request);if(response.ok)await cache.put('./index.html',response.clone());return response;}catch(e){return await cache.match('./index.html')||Response.error();}})());
  }else if(LIBS.includes(url.href)){
    event.respondWith((async()=>{const cache=await caches.open(CACHE),cached=await cache.match(event.request);if(cached)return cached;const response=await fetch(event.request);if(response.ok)await cache.put(event.request,response.clone());return response;})());
  }
});
