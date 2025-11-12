const reloadKey = "last-reload";

/**
 * Function to force reloading of the page and service workers which will also log the time of the last
 * forced reload.
 */
async function forceReloadOfPageAndServiceWorkers() {
  // when we force a reload, we should also force unregister the service worker.
  let existingServiceWorkerRegistrations = await navigator.serviceWorker.getRegistrations();
  for (let registration of existingServiceWorkerRegistrations) {
    if (window.appInsights) {
      window.appInsights.trackEvent({ name: "UnregisterServiceWorker" });
    }
    await registration.unregister();
  }

  // and clear the service worker cache storage!
  let workboxCacheKeys = await caches.keys();

  for (let cacheName of workboxCacheKeys) {
    if (cacheName.startsWith('workbox')); {
      console.log("Deleting workbox cache", cacheName);
      if (window.appInsights) {
        window.appInsights.trackEvent({ name: "DeleteWorkboxCache" });
      }
      await caches.delete(cacheName);
    }
  }

  localStorage.setItem(reloadKey, new Date().toISOString());
  if (window.location.pathname.startsWith("/refresh.html")) {
    window.location.replace("/");
  } else {
    window.location.reload();
  }
}

/**
 * Check whether we need to force a reload. Currently hard-coded to 1 day.
 * 
 * TODO: RE - I have some ideas how to do this even better, but this is crunch-time
 * 
 * @returns true when the last forced reload was more than 24 hour ago or we do not 
 * know when the last forced reload was, false otherwise
 */
function needsReload() {
  if (window.location.pathname.startsWith("/refresh.html")) {
    return true;
  } else {
    let lastReload = localStorage.getItem(reloadKey);
    if (lastReload) {
      let now = new Date();
      let lastReloadDate = new Date(Date.parse(lastReload));
      const oneDayInMillis = 24 * 60 * 60 * 1000;
      return (oneDayInMillis < (now - lastReloadDate));
    } else {
      return true;
    }
  }
}

if (needsReload()) {
  forceReloadOfPageAndServiceWorkers();
} else {
  if (window.location.pathname.startsWith("/refresh.html")) {
    window.location.replace("/");
  }
};
