document.addEventListener("DOMContentLoaded", function () {

    // Binding keys with functionalities ///////////////////////////////////////
    const page_body = document.getElementById("body");

    page_body.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            event.preventDefault();  // To prevent Enter key for submitting the form 
                document.getElementById('back_btn').click(); 
        }
    });


    // ///////////////////////////////////////////////////////////////////////////////////////
    // For Unreject Button
    document.getElementById("unreject_btn").addEventListener("click", async function (e) {
    e.preventDefault();

    if (!navigator.onLine) {
    showManualAlert("⚠️ No / Poor internet connection.");
    return false;
    }

    const form = document.getElementById("unreject_cir_form"); 

    const unrejectBtn = this;

    // Prevent double submit
    unrejectBtn.disabled = true;
    
    if (form.checkValidity()) {

        // Ping server
        let responsePing;
        try {
            responsePing = await fetch('/ping/', { method: 'HEAD', cache: 'no-store' });
        } catch {
            showManualAlert("⚠️ Server not reachable or network error. Please try again!");
            unrejectBtn.disabled = false;
            return;
        }

        if (responsePing.ok) {
            document.getElementById("formSubmittingOverlay").style.display = "flex";
            document.getElementById("submitting-text").innerHTML = "Unrejecting...";
            if (typeof form.requestSubmit === "function") {
                form.requestSubmit();
            } else {
                form.submit();
            }
        } else {
            // Server responded, but not OK (200)
            showManualAlert("⚠️ Server connection error. Please try again later!");
            unrejectBtn.disabled = false;
        }
        
    } else {
        form.reportValidity();
        unrejectBtn.disabled = false; // <-- re-enable for correction
    }
    });

});