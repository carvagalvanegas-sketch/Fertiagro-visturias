/* Self-contained app shell. Supabase requests and photos stay outside this cache. */
const CACHE='hati-shell-20261001-v14-offline';
const SHELL=new URL('./index.html',self.location.href).href;
const ROOT=new URL('./',self.location.href);
let shellRefresh=null,lastRefresh=0;
async function fetchShell(){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
  try{
    const response=await fetch(SHELL,{cache:'no-store',signal:controller.signal});
    if(!response.ok)throw new Error('Application unavailable');
    const html=await response.text();
    if(!html.includes('name="hati-build"')||!html.includes('id="hati-supabase-lib"')||!html.includes('id="hati-zip-lib"'))throw new Error('Incomplete offline application');
    const headers=new Headers(response.headers);headers.delete('content-length');headers.delete('content-encoding');headers.set('Content-Type','text/html; charset=utf-8');
    const safe=new Response(html,{status:200,headers});
    const cache=await caches.open(CACHE);await cache.put(SHELL,safe.clone());lastRefresh=Date.now();return safe;
  }finally{clearTimeout(timer)}
}
function refreshShell(){
  if(!shellRefresh)shellRefresh=fetchShell().finally(()=>{shellRefresh=null});
  return shellRefresh;
}
self.addEventListener('install',event=>event.waitUntil(fetchShell()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  if(await cache.match(SHELL))for(const name of await caches.keys())if(name.startsWith('hati-shell-')&&name!==CACHE)await caches.delete(name);
  await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||event.request.mode!=='navigate')return;
  const url=new URL(event.request.url);
  if(url.origin!==ROOT.origin||![ROOT.pathname,new URL(SHELL).pathname].includes(url.pathname))return;
  const result=(async()=>{const cache=await caches.open(CACHE);const cached=await cache.match(SHELL);return {cached,network:(!cached||Date.now()-lastRefresh>300000)?refreshShell():null}})();
  event.waitUntil(result.then(({network})=>network).catch(()=>{}));
  event.respondWith(result.then(({cached,network})=>cached||network).catch(()=>new Response('Abra esta página uma vez com internet para preparar o acesso offline.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}})));
});

