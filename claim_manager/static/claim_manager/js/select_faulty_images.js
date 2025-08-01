document.addEventListener("DOMContentLoaded", function () {

    document.getElementById("generate_btn").addEventListener("click", async function (e) {
        e.preventDefault();

        if (!navigator.onLine) {
        showManualAlert("⚠️ No / Poor Internet Connection.");
        return false;
        }

        const generateBtn = this;

        document.getElementById("formSubmittingOverlay").style.display = "flex";
        document.getElementById("submitting-text").innerHTML = "Generating Presentation...";

        // Prevent double submit
        generateBtn.disabled = true;

        // Ping server
        let responsePing;
        try {
            responsePing = await fetch('/ping/', { method: 'HEAD', cache: 'no-store' });
        } catch {
            document.getElementById("formSubmittingOverlay").style.display = "none";
            showManualAlert("⚠️ Server not reachable or network error. Please try again!");
            generateBtn.disabled = false;
            return;
        }

        if (responsePing.ok) {
            document.getElementById("task").value = "generate";

            // Remove old dynamically-added hidden fields
            document.querySelectorAll('input[name="selected_options[]"]').forEach(e => e.remove());
            // Add a hidden input for each checked box
            document.querySelectorAll('.form-check-input:checked').forEach(cb => {
                let hidden = document.createElement('input');
                hidden.type = 'hidden';
                hidden.name = 'selected_options[]';
                hidden.value = cb.value;
                document.getElementById("generate_ppt_form").appendChild(hidden);
            });

            document.getElementById("generate_ppt_form").submit();
        } else {
            // Server responded, but not OK (200)
            document.getElementById("formSubmittingOverlay").style.display = "none";
            showManualAlert("⚠️ Server connection error. Please try again later!");
            generateBtn.disabled = false;
        }
    });
});