// Service Worker Kalan Blon — version 1
const CACHE_NAME = "kalan-blon-v1";
const URLS_A_CACHER = ["/", "/login", "/accueil", "/manifest.json"];

// Installation : on met en cache les pages principales
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_A_CACHER);
    })
  );
  self.skipWaiting();
});

// Activation : on nettoie les anciens caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((noms) => {
      return Promise.all(
        noms.map((nom) => {
          if (nom !== CACHE_NAME) {
            return caches.delete(nom);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interception des requêtes : cache d'abord, réseau ensuite
self.addEventListener("fetch", (event) => {
  // On ne cache pas les requêtes API (toujours en ligne)
  if (event.request.url.includes("/api/")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((reponse) => {
      return (
        reponse ||
        fetch(event.request).then((reseauReponse) => {
          if (
            reseauReponse.status === 200 &&
            event.request.method === "GET"
          ) {
            const copie = reseauReponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, copie);
            });
          }
          return reseauReponse;
        })
      );
    })
  );
});