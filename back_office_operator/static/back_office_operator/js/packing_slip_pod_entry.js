// Only letting the user to select pdf file for the pod_pdf attachment
document.getElementById("pod_pdf").addEventListener("change", function () {
    const file = this.files[0];
    if (file && file.type !== "application/pdf") {
        showManualAlert("Only PDF files are allowed.");
        this.value = ""; // reset file input
    }
});


//////////////////////////////////////////////////////////////////////////////////////////////
// Binding Enter functionality to Docket_no field
document.addEventListener("DOMContentLoaded", function () {

    const page_body = document.getElementById("body");

    page_body.addEventListener('keydown', (event) => {
        let idelement = document.activeElement.id;
        
        if (event.key === 'Enter') {
            event.preventDefault();  // To prevent Enter key for submitting the form 

            if (idelement == "docket_no"){

                const docket_no = document.getElementById("docket_no").value;

                if (docket_no !== ""){

                    if (!navigator.onLine) {
                        showManualAlert("⚠️ No / Poor internet connection.");
                        return;
                    }

                    document.getElementById("docket_no").classList.add("uneditable");

                    $.ajax({
                        type: "GET",
                        url: '/back_office_operator/check_docket_no_exist/',
                        data: {'docket_no':docket_no},

                        success: async function(response){
                            if (response["error_msg"]){
                                showManualAlert(response["error_msg"]);
                                document.getElementById("docket_no").classList.remove("uneditable");
                                return;

                            } else if (response["docket_no_exist"] == "no"){
                                showManualAlert("Docket No. does not exists !!");
                                document.getElementById("docket_no").classList.remove("uneditable");
                                return;

                            } else if (response["docket_no_exist"] == "yes"){

                                document.getElementById("packing_slip_no").value = response["packing_slip_no"];

                                if (response["already_entry_exist"] == "yes"){

                                    openConfirmModal({
                                        message: "POD Entry for this Docket no already exists. Do you want to override the entry?",
                                        yesConfirmBtn_label: "YES",
                                        noConfirmBtn_label: "NO",
                                        onConfirm: async function() {
                                            document.getElementById("pod_details_cont").style.display = "block";
                                            document.getElementById("received_date").focus();
                                        },
                                        onCancel: function () {
                                            document.getElementById("docket_no").classList.remove("uneditable");
                                            document.getElementById("reset_btn").click();
                                        }

                                    });

                                } else if (response["already_entry_exist"] == "no"){
                                    document.getElementById("pod_details_cont").style.display = "block";
                                    document.getElementById("received_date").focus();
                                }

                            }

                        },
                        error: function(xhr, status, error) {
                            // Handle server error, network issue, or server is down here
                            showManualAlert("⚠️ Server not reachable or network error. Please try again.");
                            saveBtn.disabled = false;
                            return;
                        }
                    });

                }

            }
        }
    });
});

//////////////////////////////////////////////////////////////////////////////////////////////
// For Reset Button

document.getElementById("reset_btn").addEventListener("click", function () {
    const form = document.getElementById("packing_slip_pod_form");
    form.reset();

    document.getElementById("packing_slip_no").value = "";
    document.getElementById("docket_no").value = "";
    document.getElementById("docket_no").classList.remove("uneditable");
    document.getElementById("docket_no").focus();
    document.getElementById("received_date").value = "";
    document.getElementById("pod_pdf").value = "";
    document.getElementById("pod_details_cont").style.display = "none";
});

//////////////////////////////////////////////////////////////////////////////////////////////

// For Checking if the claim_no exists or not
// For Submit Button -
document.getElementById("submit_btn").addEventListener("click", async function (e) {
    e.preventDefault(); // Stop normal form submission

    if (!navigator.onLine) {
        showManualAlert("⚠️ No / Poor internet connection.");
        return false;
    }

    const submitBtn = this;

    const form = document.getElementById("packing_slip_pod_form");

    if (form.checkValidity()) {
    
    } else {
        form.reportValidity();
        return;
    }

    // Prevent double submit
    submitBtn.disabled = true;

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

    } else {
        // Server responded, but not OK (200)
        showManualAlert("⚠️ Server connection error. Please try again later!");
        submitBtn.disabled = false;
        return;
    }

    if (typeof form.requestSubmit === "function") {
        document.getElementById("formSubmittingOverlay").style.display = "flex";
        document.getElementById("submitting-text").innerHTML = "Submitting...";
        form.requestSubmit();
    } else {
        form.submit();
    }
                    
});


function highlightMissingProwacs(missingList) {
    const missingSet = new Set(missingList.map(d => `${d.prowac_no}-${d.prowac_year}`));
    const rows = document.querySelectorAll("#prowac_group tr");

    rows.forEach(row => {
        const no = row.querySelector('input[name^="prowac_no"]').value.trim();
        const yr = row.querySelector('input[name^="prowac_year"]').value.trim();
        const key = `${no}-${yr}`;

        if (missingSet.has(key)) {
            row.style.backgroundColor = "#ff9595ff"; 
        } else {
            row.style.backgroundColor = ""; // reset others
        }
    });
}