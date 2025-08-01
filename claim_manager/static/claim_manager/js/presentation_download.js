document.addEventListener("DOMContentLoaded", function () {

    document.getElementById("doneBtn").addEventListener("click", async function (e) {
        e.preventDefault();

        if (!navigator.onLine) {
        showManualAlert("⚠️ No / Poor Internet Connection.");
        return false;
        }

        const doneBtn = this;

        document.getElementById("formSubmittingOverlay").style.display = "flex";
        document.getElementById("submitting-text").innerHTML = "Loading...";

        // Prevent double submit
        doneBtn.disabled = true;

        // Ping server
        let responsePing;
        try {
            responsePing = await fetch('/ping/', { method: 'HEAD', cache: 'no-store' });
        } catch {
            document.getElementById("formSubmittingOverlay").style.display = "none";
            showManualAlert("⚠️ Server not reachable or network error. Please try again!");
            doneBtn.disabled = false;
            return;
        }

        if (responsePing.ok) {
            const redirectUrl = JSON.parse(document.getElementById("redirectURL").textContent);
            window.location.href = redirectUrl;
        } else {
            // Server responded, but not OK (200)
            document.getElementById("formSubmittingOverlay").style.display = "none";
            showManualAlert("⚠️ Server connection error. Please try again later!");
            doneBtn.disabled = false;
        }
    });
});