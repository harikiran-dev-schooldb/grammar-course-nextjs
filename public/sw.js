const VERSION = "grammar-studio-v17-guided-navigation";
const CORE_CACHE = `${VERSION}-core`;
// Preserve previously downloaded audio: the audio library itself has not changed.
const AUDIO_CACHE = "grammar-studio-v5-complete-english-audio";
const OFFLINE_MARKER = "/__grammar_studio_complete_english_ready_v5__";

const audioFiles = [];
for (let day = 1; day <= 30; day += 1) {
  const number = String(day).padStart(2, "0");
  for (const language of ["en", "te"]) {
    audioFiles.push(`/audio/day-${number}-teacher-${language}.mp3`);
    audioFiles.push(`/audio/day-${number}-speak-${language}.mp3`);
    for (let example = 1; example <= 3; example += 1) {
      audioFiles.push(`/audio/day-${number}-example-${String(example).padStart(2, "0")}-${language}.mp3`);
    }
  }
  for (let word = 1; word <= 3; word += 1) {
    audioFiles.push(`/audio/day-${number}-word-${String(word).padStart(2, "0")}-en.mp3`);
  }
  audioFiles.push(`/audio/day-${number}-listening-en.mp3`);
}

async function cacheAppShell() {
  const cache = await caches.open(CORE_CACHE);
  const response = await fetch("/", { cache: "reload" });
  if (!response.ok || !response.headers.get("content-type")?.includes("text/html")) {
    throw new Error("Could not download the HTML app shell");
  }
  await cache.put("/", response.clone());

  const html = await response.text();
  const assets = [...html.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+)"/g)].map((match) => match[1]);
  const coreFiles = ["/manifest.webmanifest", "/icon-192.png", "/icon-512.png", ...new Set(assets)];
  await Promise.all(coreFiles.map(async (url) => {
    const asset = await fetch(url, { cache: "reload" });
    if (asset.ok) await cache.put(url, asset);
  }));
}

async function tellClients(message) {
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  clients.forEach((client) => client.postMessage(message));
}

async function downloadAudioLibrary() {
  const cache = await caches.open(AUDIO_CACHE);
  let completed = 0;

  for (let index = 0; index < audioFiles.length; index += 10) {
    const batch = audioFiles.slice(index, index + 10);
    await Promise.all(batch.map(async (url) => {
      const existing = await cache.match(url);
      if (!existing) {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Could not download ${url}`);
        await cache.put(url, response);
      }
      completed += 1;
      await tellClients({ type: "OFFLINE_PROGRESS", completed, total: audioFiles.length });
    }));
  }

  await cache.put(OFFLINE_MARKER, new Response(new Date().toISOString()));
  await tellClients({ type: "OFFLINE_READY", total: audioFiles.length });
}

self.addEventListener("install", (event) => {
  event.waitUntil(cacheAppShell().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith("grammar-studio-") && ![CORE_CACHE, AUDIO_CACHE].includes(name)).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "CACHE_ALL_AUDIO") {
    event.waitUntil(cacheAppShell().then(downloadAudioLibrary).catch(async () => {
      await tellClients({ type: "OFFLINE_ERROR" });
    }));
  }
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then(async (response) => {
      if (url.pathname === "/" && response.ok && response.headers.get("content-type")?.includes("text/html")) {
        try {
          const cache = await caches.open(CORE_CACHE);
          await cache.put("/", response.clone());
        } catch {
          // A full cache must never prevent a successful online navigation.
        }
      }
      return response;
    }).catch(async () => {
      const cached = await (await caches.open(CORE_CACHE)).match("/");
      return cached ?? new Response("You are offline and this page has not been saved yet.", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }));
    return;
  }

  event.respondWith(caches.match(request).then(async (cached) => {
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok && (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/audio/") || url.pathname.startsWith("/icon-"))) {
        const cache = await caches.open(url.pathname.startsWith("/audio/") ? AUDIO_CACHE : CORE_CACHE);
        await cache.put(request, response.clone());
      }
      return response;
    } catch {
      return new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
    }
  }));
});
