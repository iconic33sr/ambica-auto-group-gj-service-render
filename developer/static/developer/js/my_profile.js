document.addEventListener("DOMContentLoaded", function () {

    document.getElementById("save_btn").addEventListener("click", async function (e) {
        e.preventDefault();

        if (!navigator.onLine) {
        showManualAlert("⚠️ No / Poor internet connection.");
        return false;
        }

        document.getElementById("formSubmittingOverlay").style.display = "flex";
        document.getElementById("submitting-text").innerHTML = "Saving...";

        const saveBtn = this;

        // Prevent double submit
        saveBtn.disabled = true;

        const form = document.getElementById('my_profile_form');

        if (form.checkValidity()) {
            // Ping server
            let responsePing;
            try {
                responsePing = await fetch('/ping/', { method: 'HEAD', cache: 'no-store' });
            } catch {
                document.getElementById("formSubmittingOverlay").style.display = "none";
                showManualAlert("⚠️ Server not reachable or network error. Please try again!");
                saveBtn.disabled = false;
                return;
            }

            if (responsePing.ok) {
                
                if (typeof form.requestSubmit === "function") {
                    form.requestSubmit();
                } else {
                    form.submit();
                }
            } else {
                // Server responded, but not OK (200)
                document.getElementById("formSubmittingOverlay").style.display = "none";
                showManualAlert("⚠️ Server connection error. Please try again later!");
                saveBtn.disabled = false;
            }
            
        } else {
            document.getElementById("formSubmittingOverlay").style.display = "none";
            form.reportValidity();
            saveBtn.disabled = false; // <-- re-enable for correction
        }

    });
});