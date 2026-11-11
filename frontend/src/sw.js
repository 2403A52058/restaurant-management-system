// KodiKart Service Worker — sw.js
// Cache name — bump version to force update
const CACHE_NAME = 'kodikart-v1';

// Shell assets pre-cached at install time
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Public navigable pages (SPA routes) safe to serve from cache
const PUBLIC_PAGES = [
  '/',
  '/farms',
  '/about',
  '/how-it-works',
  '/contact',
  '/privacy',
  '/terms',
];

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Returns true for requests that must NEVER be cached:
 * - Any /api/* route (auth, payments, bookings, etc.)
 * - Requests that carry an Authorization header
 */
function isNeverCache(request) {
  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/')) return true;
  if (request.headers.get('Authorization')) return true;
  return false;
}

/**
 * Returns true for static asset requests (JS, CSS, fonts, images in /icons/).
 */
function isStaticAsset(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  return (
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/icons/') ||
    /\.(js|css|woff2?|ttf|otf|eot|png|jpg|jpeg|gif|webp|svg|ico)$/i.test(pathname)
  );
}

/**
 * Returns true for SPA navigation requests (HTML page loads).
 */
function isNavigation(request) {
  return request.mode === 'navigate';
}

// Offline JSON response for failed API calls
function offlineApiResponse() {
  return new Response(
    JSON.stringify({ success: false, error: 'offline', message: 'You appear to be offline.' }),
    {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

// ─── Install ───────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  console.log('[KodiKart SW] Installing…');
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        // Pre-cache shell; failures on individual assets are non-fatal
        return Promise.allSettled(
          SHELL_ASSETS.map((url) =>
            cache.add(url).catch((err) => {
              console.warn('[KodiKart SW] Pre-cache miss for', url, err.message);
            })
          )
        );
      })
      .then(() => {
        console.log('[KodiKart SW] Install done — skipping waiting');
        return self.skipWaiting();
      })
  );
});

// ─── Activate ──────────────────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  console.log('[KodiKart SW] Activating…');
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((oldCache) => {
              console.log('[KodiKart SW] Deleting old cache:', oldCache);
              return caches.delete(oldCache);
            })
        );
      })
      .then(() => {
        console.log('[KodiKart SW] Activated — claiming clients');
        return self.clients.claim();
      })
  );
});

// ─── Fetch ─────────────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET; pass through everything else (POST, PUT, DELETE, etc.)
  if (request.method !== 'GET') return;

  // ── 1. API calls → Network only; never cache ──────────────────────────
  if (isNeverCache(request)) {
    event.respondWith(
      fetch(request).catch(() => offlineApiResponse())
    );
    return;
  }

  // ── 2. Static assets → Cache first, fallback to network ───────────────
  if (isStaticAsset(request)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // ── 3. Navigation (SPA page loads) → Network first, fallback index.html ─
  if (isNavigation(request)) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          // Network failed — serve cached page or fall back to SPA shell
          return caches.match(request).then(
            (cached) => cached || caches.match('/index.html')
          );
        })
    );
    return;
  }

  // ── 4. Everything else → Network first, cache fallback ────────────────
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// ─── Background Sync (optional — offline booking requests) ─────────────────

self.addEventListener('sync', (event) => {
  if (event.tag === 'kodikart-booking-sync') {
    console.log('[KodiKart SW] Background sync: retrying pending bookings');
    event.waitUntil(retryPendingBookings());
  }
});

async function retryPendingBookings() {
  // Reads queued booking requests from IndexedDB (populated by the app)
  // and replays them to /api/bookings when connectivity is restored.
  // The app is responsible for writing to the queue; the SW only drains it.
  try {
    const db = await openBookingQueue();
    const pending = await getAllPending(db);
    await Promise.all(
      pending.map(async (item) => {
        try {
          const res = await fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...item.headers },
            body: JSON.stringify(item.body),
          });
          if (res.ok) await deletePending(db, item.id);
        } catch {
          // Will retry on next sync event
        }
      })
    );
  } catch (err) {
    console.warn('[KodiKart SW] Booking sync failed:', err);
  }
}

// Minimal IndexedDB helpers for the booking queue
function openBookingQueue() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('kodikart-queue', 1);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore('bookings', {
        keyPath: 'id',
        autoIncrement: true,
      });
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

function getAllPending(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('bookings', 'readonly');
    const req = tx.objectStore('bookings').getAll();
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

function deletePending(db, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('bookings', 'readwrite');
    const req = tx.objectStore('bookings').delete(id);
    req.onsuccess = () => resolve();
    req.onerror = (e) => reject(e.target.error);
  });
}
