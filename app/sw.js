// Cache para o app abrir sem internet (versão web). Só guarda os arquivos do próprio app: as respostas do Google
// (dados da conta) nunca passam pelo cache.
const CACHE = 'financas-v7';
const FILES = ['./', './index.html', './app.css', './js/dados.js', './js/telas.js', './js/assistente.js', './js/formularios.js', './js/novidades.js', './js/guia.js', './js/config.js', './js/arte.js','./js/planilha.js', './js/idioma.js', './js/web.js', './js/inicio.js', './manifest.json', './icon.svg', './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
));
// Rede primeiro (para pegar atualizações), cache como reserva offline. A volta do login (com # no endereço) vai à rede.
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok){ const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return r;
  }).catch(() => caches.match(e.request, {ignoreSearch:true})));
});