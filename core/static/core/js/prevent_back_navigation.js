(function () {
  try {
    // 1️⃣ Prevent form resubmission on reload or back
    const navEntry = performance.getEntriesByType?.("navigation")?.[0];
    if (navEntry?.type === "reload" || navEntry?.type === "back_forward") {
      history.replaceState({ restored: true }, '', location.href);
    }
    if (!history.state || !history.state.restored) {
      history.replaceState({ restored: true }, '', location.href);
    }

    // 2️⃣ Strip GET query params if present
    if (window.location.search) {
      try {
        const cleanUrl = location.origin + location.pathname;
        history.replaceState(history.state, '', cleanUrl);
      } catch {}
    }

    // 3️⃣ Block back navigation (desktop, mobile, PWA)
    function trapBack() {
      history.pushState({ noBackExitsApp: true }, '', location.href);
      window.addEventListener("popstate", function (event) {
        // Only re-push our trap state
        if (event.state?.noBackExitsApp) {
          history.pushState({ noBackExitsApp: true }, '', location.href);
        }
      });
    }

    // 4️⃣ Handle Safari bfcache and reload on restore
    window.addEventListener("pageshow", function (event) {
      if (event.persisted || navEntry?.type === "back_forward") {
        window.location.reload();
      }
    });

    // 5️⃣ Prevent scroll jumping
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    // 6️⃣ Optional: prevent keyboard back shortcuts
    window.addEventListener("keydown", function (e) {
      if ((e.key === "Backspace" || e.key === "ArrowLeft") && e.altKey) {
        e.preventDefault();
      }
    });

    trapBack();
  } catch (err) {
    console.error("Navigation prevention error:", err);
  }
})();
