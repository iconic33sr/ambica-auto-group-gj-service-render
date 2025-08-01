// For year
$(document).ready(function() {
  $('#year').select2({
    minimumResultsForSearch: Infinity, // Removes the searching box from select
    dropdownCssClass: 'custom-select-dropdown',
    width: '100%'
  });
});

// ////////////////////////////////////////////////////////////////////////////////////////////////
document.addEventListener("DOMContentLoaded", function () {

    const page_body = document.getElementById("body");

    page_body.addEventListener('keydown', (event) => {
        let idelement = document.activeElement.id;
        if (event.key === 'Tab') {

            if (idelement == "job_no"){
                event.preventDefault();  // To prevent Enter key for submitting the form 
            }
        }

        if (event.key === 'Enter') {
            event.preventDefault();  // To prevent Enter key for submitting the form 

            if (idelement == "job_no"){

                if (!navigator.onLine) {
                    showManualAlert("⚠️ No / Poor internet connection.");
                    return;
                }

                const year = document.getElementById('year').value;
                let job_no = document.getElementById('job_no').value;
                const regex_to_send = /^(?!0+$)\d{1,6}$/; 

                if (job_no !== "") {
                    if (regex_to_send.test(job_no)) {

                        document.getElementById("formSubmittingOverlay").style.display = "flex";
                        document.getElementById("submitting-text").innerHTML = "Fetching Data...";

                        const firstTwo = year.slice(2, 4);       // "25"
                        const lastTwo = year.slice(-2);          // "26"
                        const yearDigits = firstTwo + lastTwo; 

                        padded_job_no = job_no.padStart(6, '0');

                        job_no = yearDigits+'-'+padded_job_no

                        $.ajax({
                            type: "GET",
                            url: '/claim_manager/fetch_claim_status_data/',
                            data: {'job_no':job_no},

                            success: function(response){

                                document.getElementById("formSubmittingOverlay").style.display = "none";
                                
                                if (response["error_msg"]){
                                    showManualAlert(response["error_msg"]);

                                } else if (response["full_job_no"] && response["vehicle_no"]){
                                    document.getElementById('claim_no').focus();
                                    document.getElementById('job_no_error').style.display = "none";
                                    document.getElementById('job_card_no').value = response["full_job_no"];
                                    document.getElementById('year').readOnly = true;

                                    // Make it readonly by preventing interaction
                                    $('#year').on('select2:opening select2:unselecting', function(e) {
                                    e.preventDefault();
                                    });

                                    $('#year').next('.select2').addClass('uneditable');

                                    document.getElementById('job_no').value = padded_job_no;
                                    document.getElementById('vehicle_no').value = response["vehicle_no"];

                                    document.getElementById('job_no').classList.add('uneditable');
                                    document.getElementById('job_no').readOnly = true;

                                    document.getElementById('save_btn').style.display = "inline-block";

                                } else if (response["claim_status_data"]){
                                    document.getElementById('job_no_error').style.display = "none";

                                    document.getElementById('job_card_no').value = response["claim_status_data"]["full_job_no"];
                                    document.getElementById('year').readOnly = true;

                                    // Make it readonly by preventing interaction
                                    $('#year').on('select2:opening select2:unselecting', function(e) {
                                    e.preventDefault();
                                    });

                                    $('#year').next('.select2').addClass('uneditable');

                                    document.getElementById('job_no').value = padded_job_no;
                                    document.getElementById('job_no').classList.add('uneditable');
                                    document.getElementById('job_no').readOnly = true;

                                    document.getElementById('vehicle_no').value = response["claim_status_data"]["vehicle_no"];
                                    document.getElementById('claim_no').value = response["claim_status_data"]["claim_no"].padStart(5, '0');;

                                    document.getElementById('claim_amount').value = response["claim_status_data"]["claim_amount"];
                                    document.getElementById('claim_amount').dispatchEvent(new Event('change'));

                                    document.getElementById('claim_date').value = response["claim_status_data"]["claim_date"];
                                    document.getElementById('submission_date').value = response["claim_status_data"]["submission_date"];

                                    let val = response["claim_status_data"]["claim_status"];
                                    document.querySelectorAll('input[name="claim_status"]').forEach(function(el) {
                                        el.checked = (el.value === val);
                                    });

                                    if (val == "settled"){
                                        document.getElementById('claim_settled_date_cont').style.display = "block";                                        

                                    } else if (val == "rejected"){
                                        document.getElementById('crm_rejection_reason_cont').style.display = "block";                                        
                                    }

                                    document.getElementById('crm_rejection_reason').value = response["claim_status_data"]["crm_rejection_reason"];
                                    document.getElementById('claim_settled_date').value = response["claim_status_data"]["claim_settled_date"];
                                    document.getElementById('save_btn').style.display = "inline-block";

                                    if (response["claim_status_data"]["part_dispatch_image1"]){
                                        document.getElementById('dispatch_images_heading').style.display = "block";
                                        document.getElementById('first_img_row').style.display = "flex";
                                        document.getElementById('view_image1_btn_cont').style.display = "inline-block";
                                        document.getElementById('view_image1_btn').onclick = function() {
                                            openImgModal(response["claim_status_data"]["part_dispatch_image1"], response["claim_status_data"]["claim_no"]);
                                        };  
                                    }

                                    if (response["claim_status_data"]["part_dispatch_image2"]){
                                        document.getElementById('dispatch_images_heading').style.display = "block";
                                        document.getElementById('first_img_row').style.display = "flex";
                                        document.getElementById('view_image2_btn_cont').style.display = "inline-block";
                                        document.getElementById('view_image2_btn').onclick = function() {
                                            openImgModal(response["claim_status_data"]["part_dispatch_image2"], response["claim_status_data"]["claim_no"]);
                                        };  
                                    }

                                    if (response["claim_status_data"]["part_dispatch_image3"]){
                                        document.getElementById('dispatch_images_heading').style.display = "block";
                                        document.getElementById('first_img_row').style.display = "flex";
                                        document.getElementById('view_image3_btn_cont').style.display = "inline-block";
                                        document.getElementById('view_image3_btn').onclick = function() {
                                            openImgModal(response["claim_status_data"]["part_dispatch_image3"], response["claim_status_data"]["claim_no"]);
                                        };  
                                    }

                                    if (response["claim_status_data"]["part_dispatch_image4"]){
                                        document.getElementById('dispatch_images_heading').style.display = "block";
                                        document.getElementById('second_img_row').style.display = "flex";
                                        document.getElementById('view_image4_btn_cont').style.display = "inline-block";
                                        document.getElementById('view_image4_btn').onclick = function() {
                                            openImgModal(response["claim_status_data"]["part_dispatch_image4"], response["claim_status_data"]["claim_no"]);
                                        };  
                                    }

                                    if (response["claim_status_data"]["part_dispatch_image5"]){
                                        document.getElementById('dispatch_images_heading').style.display = "block";
                                        document.getElementById('second_img_row').style.display = "flex";
                                        document.getElementById('view_image5_btn_cont').style.display = "inline-block";
                                        document.getElementById('view_image5_btn').onclick = function() {
                                            openImgModal(response["claim_status_data"]["part_dispatch_image5"], response["claim_status_data"]["claim_no"]);
                                        };  
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
            }
        }
    });

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // To display claim_settled_date on settled radio button
    document.querySelectorAll('input[name="claim_status"]').forEach(function(radio) {
        radio.addEventListener('change', function() {
            if (this.checked && this.value === "settled") {
                document.getElementById('claim_settled_date_cont').style.display = "block";
                document.getElementById('claim_settled_date').required = true;
                document.getElementById('crm_rejection_reason_cont').style.display = "none";
                document.getElementById('crm_rejection_reason').required = false;
            } else if (this.checked && this.value === "rejected"){
                document.getElementById('crm_rejection_reason_cont').style.display = "block";
                document.getElementById('crm_rejection_reason').required = true;
                document.getElementById('crm_rejection_reason').focus();
                document.getElementById('claim_settled_date_cont').style.display = "none";
                document.getElementById('claim_settled_date').required = false;
            }else {
                document.getElementById('claim_settled_date_cont').style.display = "none";
                document.getElementById('claim_settled_date').required = false;
                document.getElementById('crm_rejection_reason_cont').style.display = "none";
                document.getElementById('crm_rejection_reason').required = false;
            }
        });
    });


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // For cancel button  //////////////////////////////
    document.getElementById("cancel_btn").addEventListener("click", async function (e) {
        e.preventDefault();
        document.getElementById('claim_status_form').reset();

        document.getElementById('year').readOnly = false;
        $('#year').off('select2:opening select2:unselecting');

        setTimeout(function() {
            $('#year').trigger('change.select2');
        }, 0);

        $('#year').next('.select2').removeClass('uneditable');

        document.getElementById('job_no').readOnly = false;
        document.getElementById('job_no').classList.remove('uneditable');
        document.getElementById('job_no_error').style.display = "none";

        document.getElementById('dispatch_images_heading').style.display = "none";

        document.getElementById('save_btn').style.display = "none";
        document.getElementById('claim_settled_date_cont').style.display = "none";
        document.getElementById('claim_settled_date').required = false;

        document.querySelectorAll('.view_img_btn_cont').forEach(function(div) {
            div.style.display = 'none';
        });

        document.getElementById('first_img_row').style.display = "block";
        document.getElementById('second_img_row').style.display = "block";

    });

    
    // Restricting regex for job_no  ///////////////////////////////
    const jobNoInput = document.getElementById('job_no');

    // Allow only digits and restrict to 6 digits max on keydown
    jobNoInput.addEventListener('keydown', function(e) {
        const key = e.key;

        // Allow navigation, editing keys
        if (
            key === "Backspace" || key === "Delete" ||
            key === "Tab" || key === "ArrowLeft" || key === "ArrowRight" ||
            key === "Home" || key === "End"
        ) {
            return;
        }

        // Block non-digit keys
        if (!/^[0-9]$/.test(key)) {
            e.preventDefault();
            return;
        }

        // Prevent more than 6 digits if no text is selected
        if (this.value.length >= 6 && this.selectionStart === this.selectionEnd) {
            e.preventDefault();
        }
    });

    // Sanitize on paste/autofill and trim to 6 digits
    jobNoInput.addEventListener('input', function(e) {
        // Keep only digits and limit to first 6
        let cleaned = this.value.replace(/\D/g, '').slice(0, 6);
        this.value = cleaned;
    });



    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Only digits allowed in claim_no  ///////////////////////////////
    const claimNoInput = document.getElementById('claim_no');

    // Block non-digit keystrokes
    claimNoInput.addEventListener('keypress', function(e) {
        if (!/[0-9]/.test(e.key)) {
            e.preventDefault();
        }
    });

    // Also filter pasted input or input by drag/drop
    claimNoInput.addEventListener('input', function() {
        this.value = this.value.replace(/[^0-9]/g, '');
    });


    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // For save button, to format form with the amount field  ///////////////////////////////
    document.getElementById("save_btn").addEventListener("click", async function (e) {
        e.preventDefault();

        if (!navigator.onLine) {
        showManualAlert("⚠️ No / Poor internet connection.");
        return false;
        }

        document.getElementById("formSubmittingOverlay").style.display = "flex";
        document.getElementById("submitting-text").innerHTML = "Checking Data...";

        const saveBtn = this;

        saveBtn.disabled = true;

        // Only submit the form if the value in job_no is valid
        const jobNoInput = document.getElementById('job_card_no');
        const errorMsg = document.getElementById('job_no_error');
        const regex = /^JC-ShrAmb-[A-Z]{2}-\d{4}-\d{6}$/;

        if (jobNoInput !== "") {
            if (!regex.test(jobNoInput.value)) {
                document.getElementById("formSubmittingOverlay").style.display = "none";
                errorMsg.style.display = "block";
                errorMsg.innerText = "Invalid Job No. Format !!";
                jobNoInput.focus();
                saveBtn.disabled = false; // <-- re-enable for correction
            } else {
                errorMsg.style.display = "none";

                const form = document.getElementById('claim_status_form');

                if (form.checkValidity()) {

                    const claim_no = document.getElementById('claim_no').value;
                    const ac_year = document.getElementById('year').value;

                    if (claim_no == "" && ac_year == ""){
                        document.getElementById("formSubmittingOverlay").style.display = "none";
                        showManualAlert("Claim No. and Year can't be empty");
                        return;

                    } else{

                        $.ajax({
                            type: "GET",
                            url: '/claim_manager/check_claim_no_exist/',
                            data: {'ac_year':ac_year,
                                    'claim_no':claim_no,
                                    'job_no':jobNoInput.value},

                            success: async function(response){
                                if (response["error_msg"]){
                                    document.getElementById("formSubmittingOverlay").style.display = "none";
                                    showManualAlert(response["error_msg"]);
                                    saveBtn.disabled = false;
                                    return;

                                } else if (response["claim_no_exists"] == "yes"){
                                    document.getElementById("formSubmittingOverlay").style.display = "none";
                                    showManualAlert("Claim No. already exists in the job no   "+response["existing_job_no"]+" !!");
                                    saveBtn.disabled = false;
                                    return;

                                } else if (response["claim_no_exists"] == "no"){

                                    document.getElementById("formSubmittingOverlay").style.display = "flex";
                                    document.getElementById("submitting-text").innerHTML = "Saving...";

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
                                            amountFormFormatting(form);
                                            form.requestSubmit();
                                        } else {
                                            amountFormFormatting(form);
                                            form.submit();
                                        }
                                    } else {
                                        // Server responded, but not OK (200)
                                        document.getElementById("formSubmittingOverlay").style.display = "none";
                                        showManualAlert("⚠️ Server connection error. Please try again later!");
                                        saveBtn.disabled = false;
                                    }


                                }

                            },
                            error: function(xhr, status, error) {
                                // Handle server error, network issue, or server is down here
                                document.getElementById("formSubmittingOverlay").style.display = "none";
                                showManualAlert("⚠️ Server not reachable or network error. Please try again.");
                                saveBtn.disabled = false;
                                return;
                            }
                        });

                    }

                    
                } else {
                    document.getElementById("formSubmittingOverlay").style.display = "none";
                    form.reportValidity();
                    saveBtn.disabled = false; // <-- re-enable for correction
                }
            }
        } else {
            document.getElementById("formSubmittingOverlay").style.display = "none";
            saveBtn.disabled = false;
        }
    });

});