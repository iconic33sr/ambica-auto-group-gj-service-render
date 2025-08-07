document.addEventListener("DOMContentLoaded", function () {

    // Binding keys with functionalities ///////////////////////////////////////
    const page_body = document.getElementById("body");

    page_body.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            event.preventDefault();  // To prevent Enter key for submitting the form 
                document.getElementById('back_btn').click(); 
        }
    });

    ///////////////////////// To toogle between submit btn and revise btn  /////////////////////////

    const checkbox = document.getElementById("wm_verify");
    const backButtons = document.querySelectorAll(".back_btn");
    const reviseBtn = document.getElementById("revise_btn");
    const wmRemarkForm = document.getElementById("wm_remark_form");
    const submitBtn = document.getElementById("submit_btn");

    checkbox.addEventListener("change", function () {
        if (checkbox.checked) {
            submitBtn.style.display = "inline-block";
            wmRemarkForm.style.display = "block";
            document.getElementById('workshop_manager_remark').focus();
            document.getElementById('submit_btn').scrollIntoView({ behavior: 'smooth' });
            reviseBtn.style.display = "none";
            backButtons.forEach(function (btn) {
                btn.style.visibility = "hidden";
            });

            // Making the workshop_manager_remark field dynamic ////////////////////////////////////////////
            const textarea = document.getElementById('workshop_manager_remark');
            if (textarea) {
                const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight);

                const expand = () => {
                    textarea.style.height = 'auto';
                    textarea.style.height = textarea.scrollHeight + 'px';
                };

                const collapse = () => {
                    textarea.style.height = lineHeight + 'px';
                };

                const autoResize = () => {
                    textarea.style.height = 'auto';
                    textarea.style.height = textarea.scrollHeight + 'px';
                };

                // Auto-resize while typing
                textarea.addEventListener('input', autoResize);

                expand();
            }

        } else {
            submitBtn.style.display = "none";
            wmRemarkForm.style.display = "none";
            reviseBtn.style.display = "inline-block";
            backButtons.forEach(function (btn) {
                btn.style.visibility = "visible";
            });
        }
    });


    ///////////////////////// For Popup form /////////////////////////
    document.getElementById("revise_btn").addEventListener("click", async function (e) {
        e.preventDefault();

        openPopup();

        // Making the revise_btn field dynamic ////////////////////////////////////////////
        const textarea = document.getElementById('revision_remark');
        if (textarea) {
            const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight);

            const expand = () => {
                textarea.style.height = 'auto';
                textarea.style.height = textarea.scrollHeight + 'px';
            };

            const collapse = () => {
                textarea.style.height = lineHeight + 'px';
            };

            const autoResize = () => {
                textarea.style.height = 'auto';
                textarea.style.height = textarea.scrollHeight + 'px';
            };

            // Auto-resize while typing
            textarea.addEventListener('input', autoResize);

            expand();
        }
    });
    

    ///////////////////////// For Revise Send Button /////////////////////////
    document.getElementById("revision_send_btn").addEventListener("click", async function (e) {
        e.preventDefault();

        if (!navigator.onLine) {
        showManualAlert("⚠️ No / Poor Internet Connection.");
        return false;
        }

        document.getElementById("formSubmittingOverlay").style.display = "flex";
        document.getElementById("submitting-text").innerHTML = "Sending...";

        const revisionSendBtn = this;

        // Prevent double submit
        revisionSendBtn.disabled = true;

        const form = document.getElementById("revise_popup_form");

        if (form.checkValidity()) {
            // Ping server
            let responsePing;
            try {
                responsePing = await fetch('/ping/', { method: 'HEAD', cache: 'no-store' });
            } catch {
                document.getElementById("formSubmittingOverlay").style.display = "none";
                showManualAlert("⚠️ Server not reachable or network error. Please try again!");
                revisionSendBtn.disabled = false;
                return;
            }

            if (responsePing.ok) {

                $.ajax({
                    type: "GET",
                    url: '/workshop_manager/check_claim_manager/',
                    data: {'check':'check'},

                    success: function(response){

                        if (response["error_msg"]){
                            document.getElementById("formSubmittingOverlay").style.display = "none";
                            showManualAlert(response["error_msg"]);
                            revisionSendBtn.disabled = false;

                        } else if (response["exists"]){

                            if (typeof form.requestSubmit === "function") {
                                form.requestSubmit();
                            } else {
                                form.submit();
                            }
                        }
                    },
                    error: function(xhr, status, error) {
                        // Handle server error, network issue, or server is down here
                        document.getElementById("formSubmittingOverlay").style.display = "none";
                        showManualAlert("⚠️ Server not reachable or network error. Please try again.");
                        revisionSendBtn.disabled = false;
                    }
                });


            } else {
                // Server responded, but not OK (200)
                document.getElementById("formSubmittingOverlay").style.display = "none";
                showManualAlert("⚠️ Server connection error. Please try again later!");
                revisionSendBtn.disabled = false;
            }
            
        } else {
            document.getElementById("formSubmittingOverlay").style.display = "none";
            form.reportValidity();
            revisionSendBtn.disabled = false; // <-- re-enable for correction
        }
    });



    ///////////////////////// For Submit Button /////////////////////////
    document.getElementById("submit_btn").addEventListener("click", async function (e) {
        e.preventDefault();

        if (!navigator.onLine) {
        showManualAlert("⚠️ No / Poor Internet Connection.");
        return false;
        }

        // Show overlay before processing
        document.getElementById("formSubmittingOverlay").style.display = "flex";
        document.getElementById("submitting-text").innerHTML = "Checking Data...";

        const submitBtn = this;

        // Prevent double submit
        submitBtn.disabled = true;

        const form = document.getElementById("wm_remark_form");

        if (!form.checkValidity()) {
            document.getElementById("formSubmittingOverlay").style.display = "none";
            form.reportValidity();
            submitBtn.disabled = false; // <-- re-enable for correction
            return;               
        }

        $.ajax({
            type: "GET",
            url: '/workshop_manager/check_claim_manager/',
            data: {'check':'check'},

            success: function(response){

                if (response["error_msg"]){
                    document.getElementById("formSubmittingOverlay").style.display = "none";
                    showManualAlert(response["error_msg"]);
                    submitBtn.disabled = false;

                } else if (response["exists"]){

                    document.getElementById("formSubmittingOverlay").style.display = "none";

                    openConfirmModal({
                        message: "Submit the Report?",
                        yesConfirmBtn_label: "YES",
                        noConfirmBtn_label: "NO",
                        onConfirm: async function() {
                            toggleBodyScroll();

                            // Show overlay before processing
                            document.getElementById("formSubmittingOverlay").style.display = "flex";
                            document.getElementById("submitting-text").innerHTML = "Submitting...";

                            // Ping server
                            let responsePing;
                            try {
                                responsePing = await fetch('/ping/', { method: 'HEAD', cache: 'no-store' });
                            } catch {
                                document.getElementById("formSubmittingOverlay").style.display = "none";
                                showManualAlert("⚠️ Server not reachable or network error. Please try again!");
                                submitBtn.disabled = false;
                                return;
                            }
                    
                            if (responsePing.ok) {
                                document.getElementById("revision_remark").value = "";
                                form.submit();
                            } else {
                                // Server responded, but not OK (200)
                                document.getElementById("formSubmittingOverlay").style.display = "none";
                                showManualAlert("⚠️ Server connection error. Please try again later!");
                                submitBtn.disabled = false;
                            }
                        },
                        onCancel: function () {
                            submitBtn.disabled = false; // ✅ Re-enable if user clicks NO
                        }
                    });
                }
            },
            error: function(xhr, status, error) {
                // Handle server error, network issue, or server is down here
                document.getElementById("formSubmittingOverlay").style.display = "none";
                showManualAlert("⚠️ Server not reachable or network error. Please try again.");
                submitBtn.disabled = false;
            }
        });
    });
});

///////////////////////// To display hidden popup form  /////////////////////////

// Function for Popup Form

function openPopup() {
    toggleBodyScroll();
    let popupOverlay = document.getElementById('popupOverlay');
    let popupForm = document.getElementById('revise_popup_form');

    // ✅ Re-enable form validation when opening
    popupForm.removeAttribute('novalidate');

    // ✅ Make sure it's visible and apply transitions
    popupOverlay.style.display = 'flex';
    setTimeout(() => {
        popupOverlay.classList.add('show');
        popupForm.classList.add('show'); // Ensure form also animates
    }, 10);
    document.getElementById('revision_remark').focus();
}

function closePopup() {
    toggleBodyScroll();
    let popupOverlay = document.getElementById('popupOverlay');
    let popupForm = document.getElementById('revise_popup_form');

    // ✅ Temporarily disable form validation before closing
    popupForm.setAttribute('novalidate', 'true');

    // ✅ Start fade-out effect
    popupOverlay.classList.remove('show');
    popupForm.classList.remove('show'); // Also animate form

    popupOverlay.style.display = 'none';
}