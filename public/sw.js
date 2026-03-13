const CACHE_NAME = 'mindful-stride-board-static-v1';
const API_CACHE_NAME = 'mindful-stride-board-api-v1';

const OFFLINE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/robots.txt',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(OFFLINE_URLS))
      .then(() => _cacheHtmlAssets())
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME && key !== API_CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // Network-first for API calls (same-origin)
  if (isApiRequest(url)) {
    event.respondWith(networkFirst(request, API_CACHE_NAME));
    return;
  }

  // Cache-first for static assets (JS/CSS/images/fonts/etc.)
  if (isStaticAsset(request)) {
    event.respondWith(cacheFirst(request, CACHE_NAME));
    return;
  }

  // Navigation requests should fall back to the app shell (index.html)
  if (request.mode === 'navigate') {
    event.respondWith(
      networkFirst(request, CACHE_NAME).then((response) => {
        if (response) return response;
        return caches.match('/index.html');
      })
    );
    return;
  }

  // Default: network-first, falling back to cache
  event.respondWith(networkFirst(request, CACHE_NAME));
});

function isApiRequest(url) {
  if (url.origin !== self.location.origin) return false;
  return (
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/functions') ||
    url.pathname.startsWith('/supabase')
  );
}

function isStaticAsset(request) {
  const dest = request.destination;
  if (['script', 'style', 'image', 'font', 'document'].includes(dest)) {
    return true;
  }

  const pathname = new URL(request.url).pathname;
  return /\.(js|mjs|css|png|jpg|jpeg|svg|webp|gif|ico|json|woff2?|ttf|eot|otf)$/.test(pathname);
}

function cacheFirst(request, cacheName) {
  return caches.open(cacheName).then((cache) =>
    cache.match(request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetchAndCache(request, cache);
    })
  );
}

function networkFirst(request, cacheName) {
  return caches.open(cacheName).then((cache) =>
    fetch(request)
      .then((response) => {
        if (response && response.ok) {
          cache.put(request, response.clone());
        }
        return response;
      })
      .catch(() => cache.match(request))
  );
}

function fetchAndCache(request, cache) {
  return fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cache.match(request));
}

function _cacheHtmlAssets() {
  return fetch('/index.html', { cache: 'no-cache' })
    .then((response) => response.text())
    .then((html) => {
      const urls = extractAssetUrls(html);
      const toCache = Array.from(new Set([...OFFLINE_URLS, ...urls]));
      return caches.open(CACHE_NAME).then((cache) => cache.addAll(toCache));
    })
    .catch(() => {
      // Ignore failures; install should still succeed.
    });
}

function extractAssetUrls(html) {
  const urls = [];
  const regex = /(?:href|src)=["']([^"']+)["']/g;
  let match;

  while ((match = regex.exec(html))) {
    const raw = match[1];
    // Skip external resources
    if (/^(https?:)?\/\//.test(raw)) continue;
    if (raw.startsWith('data:')) continue;

    try {
      const url = new URL(raw, self.location.origin);
      if (url.origin === self.location.origin) {
        urls.push(url.pathname);
      }
    } catch (e) {
      // Ignore bad URLs
    }
  }

  return urls;
}
