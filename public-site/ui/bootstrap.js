(function applyStoredTheme() {
  try {
    var raw = String(localStorage.getItem("ui_theme") || "").trim().toLowerCase();
    if (raw && raw !== "dark") {
      localStorage.setItem("ui_theme", "dark");
    }
    document.documentElement.setAttribute("data-theme", "dark");
  } catch {
    document.documentElement.setAttribute("data-theme", "dark");
  }
}());

(function installBootFailureFallback() {
  window.__songbookAppBooted = window.__songbookAppBooted === true;
  window.__songbookBootFatal = false;

  function ensureMaintenanceCard() {
    var splash = document.getElementById("appBootSplash");
    if (!splash) {
      splash = document.createElement("div");
      splash.id = "appBootSplash";
      splash.className = "app-boot-splash";
      splash.setAttribute("role", "alert");
      splash.setAttribute("aria-live", "assertive");
      document.body.appendChild(splash);
    }
    splash.classList.remove("is-hidden");
    splash.setAttribute("aria-label", "Технические работы");
    splash.innerHTML = [
      '<div class="app-boot-splash-card" style="width:min(92vw,520px);border:2px solid #c62828;background:#200d10;box-shadow:0 18px 42px rgba(0,0,0,.55);">',
      '<div class="app-boot-splash-title" style="margin-top:0;color:#ff6b6b;font-weight:800;letter-spacing:.04em;text-transform:uppercase;">Технические работы</div>',
      '<div class="app-boot-splash-subtitle" style="margin-top:10px;color:#ffd4d4;line-height:1.55;">К сожалению, сайт временно недоступен. Сейчас проводятся технические работы. Пожалуйста, попробуйте зайти позже.</div>',
      '</div>',
    ].join("");
    return splash;
  }

  function showMaintenanceScreen() {
    if (window.__songbookAppBooted === true || window.__songbookBootFatal === true) return;
    window.__songbookBootFatal = true;
    ensureMaintenanceCard();
  }

  window.addEventListener("error", function () {
    window.setTimeout(showMaintenanceScreen, 0);
  }, true);

  window.addEventListener("unhandledrejection", function () {
    window.setTimeout(showMaintenanceScreen, 0);
  });
}());

(function applyClientCacheBust() {
  var cacheBustVersion = "20260716-original-ui-v14";
  var markerKey = "songbook_client_cache_bust_version";
  var localKeys = [
    "songbook_api_get_cache_v2",
    "songbook_auth_cache_scope",
    "songbook_cached_user_v1",
  ];

  try {
    if (String(localStorage.getItem(markerKey) || "") === cacheBustVersion) return;
  } catch {}

  try {
    localKeys.forEach(function (key) {
      try { localStorage.removeItem(key); } catch {}
      try { sessionStorage.removeItem(key); } catch {}
    });
    try { localStorage.setItem(markerKey, cacheBustVersion); } catch {}
  } catch {}

  if (!("caches" in window)) return;
  Promise.resolve()
    .then(function () { return caches.keys(); })
    .then(function (keys) {
      return Promise.all((keys || [])
        .filter(function (key) { return String(key || "").indexOf("songbook-app-") === 0; })
        .map(function (key) { return caches.delete(key); }));
    })
    .catch(function () {});
}());

(function clearLegacyServiceWorkers() {
  var removedRegistration = false;
  var registrationCleanup = !("serviceWorker" in navigator)
    ? Promise.resolve()
    : Promise.resolve()
      .then(function () { return navigator.serviceWorker.getRegistrations(); })
      .then(function (registrations) {
        removedRegistration = (registrations || []).length > 0;
        return Promise.all((registrations || []).map(function (registration) {
          return registration.unregister();
        }));
      })
      .catch(function () {});
  var cacheCleanup = !("caches" in window)
    ? Promise.resolve()
    : Promise.resolve()
      .then(function () { return caches.keys(); })
      .then(function (keys) {
        return Promise.all((keys || [])
          .filter(function (key) { return String(key || "").indexOf("songbook-app-") === 0; })
          .map(function (key) { return caches.delete(key); }));
      })
      .catch(function () {});

  Promise.all([registrationCleanup, cacheCleanup]).then(function () {
    if (!removedRegistration) return;
    var reloadKey = "songbook_legacy_sw_cleanup_v83";
    try {
      if (sessionStorage.getItem(reloadKey) === "1") return;
      sessionStorage.setItem(reloadKey, "1");
    } catch {}
    window.location.reload();
  }).catch(function () {});
}());
