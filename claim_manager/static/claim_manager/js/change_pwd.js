document.addEventListener("DOMContentLoaded", function () {

    // Binding keys with functionalities ///////////////////////////////////////
    const page_body = document.getElementById("body");

    page_body.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            event.preventDefault();  // To prevent Enter key for submitting the form 
                document.getElementById('back_btn').click(); 
        }
    });

    // /////////////////////////////////////////////////////////////////////////////////

    document.getElementById("save_btn").addEventListener("click", async function (e) {
        e.preventDefault();

        if (!navigator.onLine) {
        showManualAlert("⚠️ No / Poor internet connection.");
        return false;
        }

        const saveBtn = this;

        // Prevent double submit
        saveBtn.disabled = true;

        const form = document.getElementById('change_pwd_form');

        if (form.checkValidity()) {
            // Ping server
            let responsePing;
            try {
                responsePing = await fetch('/ping/', { method: 'HEAD', cache: 'no-store' });
            } catch {
                showManualAlert("⚠️ Server not reachable or network error. Please try again!");
                saveBtn.disabled = false;
                return;
            }

            if (responsePing.ok) {
                document.getElementById("formSubmittingOverlay").style.display = "flex";
                document.getElementById("submitting-text").innerHTML = "Saving...";
                if (typeof form.requestSubmit === "function") {
                    form.requestSubmit();
                } else {
                    form.submit();
                }
            } else {
                // Server responded, but not OK (200)
                showManualAlert("⚠️ Server connection error. Please try again later!");
                saveBtn.disabled = false;
            }
            
        } else {
            form.reportValidity();
            saveBtn.disabled = false; // <-- re-enable for correction
        }

    });
});