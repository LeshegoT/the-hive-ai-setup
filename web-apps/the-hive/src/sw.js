import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';

import { CacheableResponsePlugin  } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';

import { StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';

precacheAndRoute(self.__WB_MANIFEST, {});

const handler = createHandlerBoundToURL('/index.html');
const navigationRoute = new NavigationRoute(handler, {
  allowlist: [new RegExp('/*')],
  denylist: [
    /\/refresh.*/,
    /\/admin\/.*/,
    /\/error\/.*/,
    /^https:\/\/login.microsoftonline.com\/.*/
  ],
});
registerRoute(navigationRoute);

self.addEventListener('install', async (event) => await self.skipWaiting());
self.addEventListener('activate', (event) => self.clients.claim());

// Cache the Google Fonts stylesheets with a stale-while-revalidate strategy.
registerRoute(
  /^https:\/\/fonts\.googleapis\.com/,
  new StaleWhileRevalidate({
    cacheName: 'fonts-css',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [200]
      })
    ]
  })
  
);

// Cache the underlying font files with a cache-first strategy for 1 year.
registerRoute(
  /^https:\/\/fonts\.gstatic\.com/,
  new CacheFirst({
    cacheName: 'fonts-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [200]
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 365,
        maxEntries: 30
      })
    ]
  })
);

// Cache images for 24 hours
const image_strategy = new CacheFirst({
  cacheName: 'images',
  plugins: [
    new CacheableResponsePlugin({
      statuses: [0, 200]
    }),
    new ExpirationPlugin({
      maxAgeSeconds: 1 * 24 * 60 * 60 // 24 hours
    })
  ]
});

registerRoute(/\.(?:png|gif|jpg|jpeg|webp|svg)$/, image_strategy);

// This is way too aggressive a regex.
registerRoute(/^https:\/\/graph\.microsoft\.com/, image_strategy);

// Cache the site data
const data_strategy = new StaleWhileRevalidate({
  cacheName: 'data'
});

registerRoute(/api\/tracks/, data_strategy, 'GET');
registerRoute(/api\/sections/, data_strategy, 'GET');
registerRoute(/api\/courses/, data_strategy, 'GET');
registerRoute(/api\/referenceData/, data_strategy, 'GET');
registerRoute(/api\/parts/, data_strategy, 'GET');
