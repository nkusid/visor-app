/*
  Cette appli doit marcher hors connexion. Comme le modele de vision (TensorFlow.js
  + MobileNet) est telecharge depuis Internet, ce service worker met en cache TOUT
  ce qui est recupere avec succes (page, modele, poids), meme venant d'un autre
  site (jsdelivr, storage.googleapis.com), pour pouvoir le reservir sans connexion
  la prochaine fois. Il faut donc ouvrir l'appli une premiere fois avec Internet.
*/
var CACHE = "visor-v1";
var PRECACHE = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(PRECACHE); }));
  self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }));
  self.clients.claim();
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then(function (cached) {
      if (cached) return cached;
      return fetch(e.request).then(function (resp) {
        if (resp && (resp.status === 200 || resp.type === "opaque")) {
          var copy = resp.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        }
        return resp;
      }).catch(function () { return cached; });
    })
  );
});
