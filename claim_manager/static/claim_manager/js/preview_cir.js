document.addEventListener("DOMContentLoaded", function () {

    // Binding keys with functionalities ///////////////////////////////////////
    const page_body = document.getElementById("body");

    page_body.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            event.preventDefault();  // To prevent Enter key for submitting the form 
                document.getElementById('back_btn').click(); 
        }
    });


    //////////////////////////////////////////////////////////////////////////////////////////

    ///////////////////////// To toogle between submit btn and revise btn  /////////////////////////

    const checkbox = document.getElementById("cm_reject");
    const backButtons = document.querySelectorAll(".back_btn");
    const generateBtn = document.getElementById("generate_btn");
    const cmRemarkCont = document.getElementById("claim_manager_remark_cont");
    const cmRejectionReasonCont = document.getElementById("rejection_reason_cont");

    checkbox.addEventListener("change", function () {
        if (checkbox.checked) {
            cmRejectionReasonCont.style.display = "block";
            cmRemarkCont.style.display = "none";
            document.getElementById('claim_manager_rejection_reason').focus();
            document.getElementById('claim_manager_rejection_reason').required = true;
            document.getElementById('claim_manager_rejection_reason').scrollIntoView({ behavior: 'smooth' });
            generateBtn.style.display = "none";
            backButtons.forEach(function (btn) {
                btn.style.visibility = "hidden";
            });

        } else {
            document.getElementById('claim_manager_rejection_reason').required = false;
            cmRejectionReasonCont.style.display = "none";
            cmRemarkCont.style.display = "block";
            generateBtn.style.display = "inline-block";
            backButtons.forEach(function (btn) {
                btn.style.visibility = "visible";
            });
            document.getElementById('generate_btn').scrollIntoView({ behavior: 'smooth' });
        }
    });

    //////////////////////////////////////////////////////////////////////////////////////////

    const form = document.getElementById("save_generate_form"); 

    document.getElementById("save_btn").addEventListener("click", async function (e) {
    e.preventDefault();

    if (!navigator.onLine) {
    showManualAlert("⚠️ No / Poor internet connection.");
    return false;
    }

    const saveBtn = this;

    // Prevent double submit
    saveBtn.disabled = true;

    document.getElementById('chassis_no').required = false;
    document.getElementById('model').required = false;
    document.getElementById('sale_date').required = false;

    if (form.checkValidity()) {

        if (document.getElementById("cm_reject").checked) {
            document.getElementById("task").value = "reject";
        } else {
            document.getElementById("task").value = "save";
        }

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

            if (document.getElementById("cm_reject").checked) {
                document.getElementById("formSubmittingOverlay").style.display = "flex";
                document.getElementById("submitting-text").innerHTML = "Rejecting CIR...";
            } else {
                document.getElementById("formSubmittingOverlay").style.display = "flex";
                document.getElementById("submitting-text").innerHTML = "Saving...";
            }
            
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

    ////////////////////////////////////////////////////////////////////////////////////////// 
    document.getElementById("generate_btn").addEventListener("click", async function (e) {
    e.preventDefault();

    if (!navigator.onLine) {
    showManualAlert("⚠️ No / Poor internet connection.");
    return false;
    }

    const generateBtn = this;

    // Prevent double submit
    generateBtn.disabled = true;

    document.getElementById("task").value = "generate";

    document.getElementById('chassis_no').required = true;
    document.getElementById('model').required = true;
    document.getElementById('sale_date').required = true;
    
    if (form.checkValidity()) {

        // Ping server
        let responsePing;
        try {
            responsePing = await fetch('/ping/', { method: 'HEAD', cache: 'no-store' });
        } catch {
            showManualAlert("⚠️ Server not reachable or network error. Please try again!");
            generateBtn.disabled = false;
            return;
        }

        if (responsePing.ok) {
            document.getElementById("formSubmittingOverlay").style.display = "flex";
            document.getElementById("submitting-text").innerHTML = "Saving & Redirecting...";
            if (typeof form.requestSubmit === "function") {
                form.requestSubmit();
            } else {
                form.submit();
            }
        } else {
            // Server responded, but not OK (200)
            showManualAlert("⚠️ Server connection error. Please try again later!");
            generateBtn.disabled = false;
        }
        
    } else {
        form.reportValidity();
        generateBtn.disabled = false; // <-- re-enable for correction
    }
    });
});