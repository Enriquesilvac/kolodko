// Caché para que la app abra aunque no haya cobertura. La página se pide primero a la red (para tener siempre la última versión).
const C = "kolodko-v2";
const CORE = ["./", "index.html", "icon-180.png", "icon-192.png", "icon-512.png", "manifest.webmanifest"];
self.addEventListener("install", e => { e.waitUntil(caches.open(C).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.hostname.endsWith("googleapis.com") && !url.hostname.startsWith("fonts")) return; // Firestore: nunca desde caché
  const isPage = req.mode === "navigate" || url.pathname.endsWith(".html") || url.pathname.endsWith("/");
  if (isPage) {
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(C).then(c => c.put(req, cp)); return r; }).catch(() => caches.match(req).then(r => r || caches.match("index.html"))));
  } else if (url.origin === location.origin || url.hostname === "www.gstatic.com" || url.hostname.startsWith("fonts.")) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok || r.type === "opaque") { const cp = r.clone(); caches.open(C).then(c => c.put(req, cp)); } return r; })));
  }
});
