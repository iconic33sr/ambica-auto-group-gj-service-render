document.addEventListener("DOMContentLoaded", function () {

    // Displaying red notification dot if revision report exists ///////////////////////////////
    const no_of_revision_report = JSON.parse(document.getElementById('no_of_revision_reportJSON').textContent);

    if (parseInt(no_of_revision_report, 10) > 0){

        if (window.getComputedStyle(document.getElementById('wm_dot')).display === "none"){
            document.getElementById('wm_dot').style.display = "inline-block";

        }
    }

    ///////////////////////// To toogle submit btn  /////////////////////////
    const checkbox = document.getElementById("report_revised");
    const backButtons = document.querySelectorAll(".back_btn");
    const submitBtn = document.getElementById("submit_btn");

    checkbox.addEventListener("change", function () {
        if (checkbox.checked) {
            submitBtn.style.display = "inline-block";
            document.getElementById("nav_wm_btn").style.pointerEvents = "none";
            document.getElementById("nav_wm_btn").style.opacity = "0.6";
            document.getElementById("nav_wm_btn").style.cursor= "not-allowed";
            backButtons.forEach(function (btn) {
                btn.style.visibility = "hidden";
            });
        } else {
            submitBtn.style.display = "none";
            document.getElementById("nav_wm_btn").style.pointerEvents = "auto";
            document.getElementById("nav_wm_btn").style.opacity = "1";
            document.getElementById("nav_wm_btn").style.cursor= "pointer";
            backButtons.forEach(function (btn) {
                btn.style.visibility = "visible";
            });
        }
    });

    ///////////////////////// For submit btn  /////////////////////////
    document.getElementById("submit_btn").addEventListener("click", async function (e) {
        e.preventDefault();

        if (!navigator.onLine) {
        showManualAlert("⚠️ No / Poor internet connection.");
        return false;
        }

        const submitBtn = this;

        // Prevent double submit
        submitBtn.disabled = true;

        openConfirmModal({
        message: "Submit the Report?",
        yesConfirmBtn_label: "YES",
        noConfirmBtn_label: "NO",
            onConfirm: async function() {
                toggleBodyScroll();

                const form = document.getElementById("revise_form");

                if (form.checkValidity()) {
                    // Ping server
                    let responsePing;
                    try {
                        responsePing = await fetch('/ping/', { method: 'HEAD', cache: 'no-store' });
                    } catch {
                        showManualAlert("⚠️ Server not reachable or network error. Please try again!");
                        submitBtn.disabled = false;
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
                        submitBtn.disabled = false;
                    }
                } else {
                    form.reportValidity();
                    submitBtn.disabled = false; // <-- re-enable for correction
                }
            },
            onCancel: function () {
                submitBtn.disabled = false; // ✅ Re-enable if user clicks NO
            }
        });
    });
});
