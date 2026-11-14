// Service worker mínimo: permite instalar la agenda como app en el celular.
// No guarda nada en caché, así que siempre se ven los datos actualizados.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
