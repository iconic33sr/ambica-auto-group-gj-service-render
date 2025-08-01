// /////////////////////////////////////////////////////
document.addEventListener("DOMContentLoaded", function () {

    const claimNoInput = document.getElementById('claim_no');

    // Allow only digits to be entered
    claimNoInput.addEventListener('keydown', function(e) {
        const key = e.key;

        // Allow navigation, editing, etc.
        if (
            key === "Backspace" || key === "Delete" ||
            key === "Tab" || key === "ArrowLeft" || key === "ArrowRight" ||
            key === "Home" || key === "End"
        ) {
            return;
        }

        // Only allow digit keys
        if (!/^[0-9]$/.test(key)) {
            e.preventDefault();
        }
    });

    // Sanitize on input (for paste, autofill, etc.)
    claimNoInput.addEventListener('input', function(e) {
        // Remove all non-digits
        let cleaned = this.value.replace(/\D/g, '');
        this.value = cleaned;
    });

    // Validation function (use before submit)
    function isValidClaimNo(value) {
        // Regex: Not all zeros, at least one digit, digits only
        return /^(?!0+$)\d+$/.test(value);
    }


  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // Fetching vehicle details on check button
  document.getElementById("checkBtn").addEventListener("click", async function (e) {

    if (!navigator.onLine) {
        showManualAlert("⚠️ No / Poor internet connection.");
        return false;
    }

    const claim_no = document.getElementById('claim_no').value.toString();
    const ac_year = document.getElementById('year').value;
    const regex_to_send = /^(?!0+$)\d+$/;

    if (claim_no !== "") {
        if (regex_to_send.test(claim_no)) {

            document.getElementById("formSubmittingOverlay").style.display = "flex";
            document.getElementById("submitting-text").innerHTML = "Fetching Data...";

            $.ajax({
                type: "GET",
                url: '/acm/fetch_claim_status_data/',
                data: {'claim_no':claim_no, 'ac_year':ac_year},

                success: function(response){

                    document.getElementById("formSubmittingOverlay").style.display = "none";

                    if (response["error_msg"]){
                        showManualAlert("Claim No not found !!");

                    } else if (response["data"]){
                        document.getElementById('checkBtn').disabled = true;

                        document.getElementById('year').classList.add('uneditable');
                        document.getElementById('year').style.pointerEvents = 'none';

                        document.getElementById('claim_no_error').style.display = "none";

                        document.getElementById('claim_no').classList.add('uneditable');
                        document.getElementById('claim_no').readOnly = true;

                        document.getElementById('chassis_no').value = response["data"]["chassis_no"];
                        document.getElementById('job_no').value = response["data"]["full_job_no"];
                        document.getElementById('vehicle_no').value = response["data"]["vehicle_no"];

                        if (response["data"]["image_capture"] == "pending") {
                            document.getElementById("part_dispatch_images_cont").style.display = "block";
                            document.getElementById("submit_btn").style.display = "block";

                        }else {
                            document.getElementById("img_already_captured").style.display = "block";
                        }
                    }
                },
                error: function(xhr, status, error) {
                    // Handle server error, network issue, or server is down here
                    document.getElementById("formSubmittingOverlay").style.display = "none";
                    showManualAlert("⚠️ Server not reachable or network error. Please try again.");
                }
            });
        }
    }                            
  
  });


  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // For cancel button  //////////////////////////////
  document.getElementById("cancel_btn").addEventListener("click", async function (e) {
    e.preventDefault();

    document.getElementById('year').classList.remove('uneditable');
    document.getElementById('year').style.pointerEvents = 'auto';
    
    document.getElementById('parts_dispatch_image_form').reset();
    document.getElementById('checkBtn').disabled = false;
    document.getElementById('claim_no').readOnly = false;
    document.getElementById('claim_no').classList.remove('uneditable');
    document.getElementById('claim_no_error').style.display = "none";
    document.getElementById('claim_no').focus();
    document.getElementById("img_already_captured").style.display = "none";

    document.querySelectorAll('input[type="hidden"].photoInput').forEach(el => el.value = "");
    document.querySelectorAll('button.click_photo_btn[type="button"]').forEach(btn => btn.innerHTML = "Click Photo");
    document.querySelectorAll('button.view_photo_btn[type="button"]').forEach(btn => btn.style.display = "none");
    document.querySelectorAll('button.remove_photo_btn[type="button"]').forEach(btn => btn.style.display = "none");

    document.getElementById('part_dispatch_images_cont').style.display = "none";
    document.getElementById("submit_btn").style.display = "none";
  });


  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // For submit button  //////////////////////////////
  document.getElementById("submit_btn").addEventListener("click", async function (e) {
    e.preventDefault();

    if (!navigator.onLine) {
    showManualAlert("⚠️ No / Poor internet connection.");
    return false;
    }

    const submitBtn = this;

    // Prevent double submit
    submitBtn.disabled = true;

    // Only submit the form if the value in job_no is valid
    const jobNoInput = document.getElementById('job_no');
    const yearInput = document.getElementById('year');
    const errorMsg = document.getElementById('claim_no_error');
    const regex = /^JC-ShrAmb-[A-Z]{2}-\d{4}-\d{6}$/;

    if (jobNoInput !== "" && yearInput !== "") {
        if (!regex.test(jobNoInput.value)) {
            errorMsg.style.display = "block";
            errorMsg.innerText = "Invalid Job No.!!";
        } else {
            errorMsg.style.display = "none";
            
            const form = document.getElementById('parts_dispatch_image_form');

            if (form.checkValidity()) {

              openConfirmModal({
              message: "Submit the Images?",
              yesConfirmBtn_label: "YES",
              noConfirmBtn_label: "NO",
                onConfirm: async function() {

                    toggleBodyScroll();

                    // Show overlay before processing
                    document.getElementById("formSubmittingOverlay").style.display = "flex";
                    document.getElementById("submitting-text").innerHTML = "Checking Data...";

                    ////////////// Image Compression And Form Submission Overlay Animation

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

                        // Show overlay before processing
                        document.getElementById("formSubmittingOverlay").style.display = "flex";
                        document.getElementById("submitting-text").innerHTML = "Submitting...";

                        let imageFields = [];
                        for (let i = 0; i <= 4; i++) {
                            let inp = document.getElementById(`photoInput-${i}`);
                            if (inp && inp.value && inp.value.startsWith("data:image")) {
                                imageFields.push(inp);
                            }
                        }

                        await Promise.all(
                            imageFields.map(async (input) => {
                                let base64str = input.value.split(',')[1];
                                let byteLen = Math.ceil((base64str.length * 3) / 4);
                                if (byteLen > 200 * 1024) {
                                    input.value = await compressImage(input.value, 200 * 1024, "image/jpeg");
                                }
                            })
                        );

                        if (typeof form.requestSubmit === "function") {
                            form.requestSubmit();
                        } else {
                            form.submit();
                        }
                    } else {
                        // Server responded, but not OK (200)
                        document.getElementById("formSubmittingOverlay").style.display = "none";
                        showManualAlert("⚠️ Server connection error. Please try again later!");
                        submitBtn.disabled = false;
                    }
                },
                onCancel: function () {
                    document.getElementById("formSubmittingOverlay").style.display = "none";
                    submitBtn.disabled = false; // ✅ Re-enable if user clicks NO
                }
              });

            } else {
                document.getElementById("formSubmittingOverlay").style.display = "none";
                form.reportValidity();
                submitBtn.disabled = false; // <-- re-enable for correction
            }
        }
    }
  });

});