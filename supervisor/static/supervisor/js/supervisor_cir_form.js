document.addEventListener("DOMContentLoaded", function () {

    // Binding keys with functionalities (Enter) ///////////////////////////////////////
    const page_body = document.getElementById("body");

    page_body.addEventListener('keydown', (event) => {
        let idelement = document.activeElement.id; 
        if (event.key === 'Enter') {
            event.preventDefault();  // To prevent Enter key for submitting the form 

            if (idelement == "reg_no"){
                document.getElementById('vehicle_front_img_click_btn').focus(); 
            }else if (idelement == "complaint_1"){
                document.getElementById('complaint_1_img_click_btn').focus(); 

            }else if (idelement == "complaint_2"){
                document.getElementById('complaint_2_img_click_btn').focus(); 

            }else if (idelement == "complaint_3"){
                document.getElementById('complaint_3_img_click_btn').focus(); 

            }
        }
    });


    // Adding Leading Zero & fixing the value upto 6 digits ///////////////////////////////////////////////////////////////////////////
    const jobNoInput = document.getElementById("job_no");

    jobNoInput.addEventListener("input", function() {
        let val = jobNoInput.value.replace(/^0+/, ''); // Remove leading zeros first

        if (val === "") {
            jobNoInput.value = "";
        } else {
            // Pad with leading zeros to make it 6 characters long
            jobNoInput.value = val.padStart(6, '0');
        }

        if (jobNoInput.value.length > 6) {
            jobNoInput.value = jobNoInput.value.slice(0, 6);
        }
    });


    // Vehicle No. character restricts to 15 ////////////////////////////////
    document.getElementById("vehicle_no").addEventListener("input", function () {
        if (this.value.length > 11) {
            this.value = this.value.slice(0, 11);
        }
    });


    // Complaint Description character restricts to 50 ////////////////////////////////
    document.querySelectorAll(".complaint").forEach(function(input) {
        input.addEventListener("input", function () {
            if (this.value.length > 50) {
                this.value = this.value.slice(0, 50);
            }
        });
    });



    // === Supervisor CIR Field Enable Control === //

    const firstFields = [
        document.getElementById('job_no'),
        document.getElementById('vehicle_no'),
        document.getElementById('kilometer'),
        document.getElementById('claim_category'),
    ];

    const form = document.getElementById('supervisor_cir_form');
    const allInputs = form.querySelectorAll('input, select');
    const submitBtn = document.getElementById("submit_btn");

    // ✅ Check if first four fields are filled
    function areFirstFieldsFilled() {
        const [job_no, vehicle_no, kilometer, claim_category] = firstFields;
        return (
            job_no.value.trim() &&
            vehicle_no.value.trim() &&
            kilometer.value.trim() &&
            [...claim_category.selectedOptions].some(opt => opt.value && !opt.disabled)
        );
    }

    // ✅ Disable or enable appropriate fields/buttons
    function setDisabledState(disable) {
        firstFields.forEach(f => f.disabled = false);  // First 4 always enabled

        // Vehicle photo buttons (field-0 to field-3)
        for (let i = 0; i <= 3; i++) {
            const btn = document.querySelector(`#field-${i} button[onclick^="openCamera"]`);
            if (btn) btn.disabled = disable;
        }

        // Complaint fields and their photo buttons
        for (let i = 1; i <= 7; i++) {
            const complaintInput = document.getElementById(`complaint_${i}`);
            const photoBtn = document.querySelector(`#field-${i + 3} button[onclick^="openCamera"]`);

            if (i === 1) {
                if (complaintInput) complaintInput.disabled = disable;
                if (photoBtn) photoBtn.disabled = disable;
            } else {
                if (complaintInput) {
                    complaintInput.disabled = true;
                    complaintInput.value = "";
                }
                if (photoBtn) photoBtn.disabled = true;
            }
        }

        // Other inputs
        allInputs.forEach(input => {
            if (!firstFields.includes(input) && !input.id.startsWith("complaint_")) {
                input.disabled = disable;
            }
        });

        if (submitBtn) submitBtn.disabled = disable;
    }

    // ✅ Update state when first 4 fields are changed
    function checkAndToggle() {
        const isReady = areFirstFieldsFilled();
        setDisabledState(!isReady);

        if (isReady) {
            toggleComplaintFieldsSequentially();
        }
    }

    // ✅ Enable complaint_X+1 only if complaint_X has input or image
    function toggleComplaintFieldsSequentially() {
        const total = 7;

        for (let i = 1; i <= total; i++) {
            const currentField = document.getElementById(`complaint_${i}`);
            const currentPhoto = document.getElementById(`photoInput-${i + 3}`);
            const hasText = currentField && currentField.value.trim() !== "";
            const hasPhoto = currentPhoto && currentPhoto.value && currentPhoto.value.startsWith("data:image");

            const nextField = document.getElementById(`complaint_${i + 1}`);
            const nextBtn = document.querySelector(`#field-${i + 4} button[onclick^="openCamera"]`);

            const shouldEnableNext = hasText || hasPhoto;

            if (nextField && nextBtn) {
                if (shouldEnableNext) {
                    nextField.disabled = false;
                    nextBtn.disabled = false;
                }
                // Do NOT disable if previously enabled
            }

        }
    }

    // ✅ Add event listeners
    firstFields.forEach(field => {
        field.addEventListener('input', checkAndToggle);
        field.addEventListener('change', checkAndToggle);
    });

    for (let i = 1; i <= 7; i++) {
        const complaintField = document.getElementById(`complaint_${i}`);
        const photoInput = document.getElementById(`photoInput-${i + 3}`);

        if (complaintField) {
            complaintField.addEventListener("input", toggleComplaintFieldsSequentially);
        }
        if (photoInput) {
            // Observe changes in value attribute for image input
            const observer = new MutationObserver(toggleComplaintFieldsSequentially);
            observer.observe(photoInput, { attributes: true, attributeFilter: ['value'] });

            // Also call on load in case value is prefilled
            toggleComplaintFieldsSequentially();
        }
    }

    // ✅ Run once on load
    checkAndToggle();
    toggleComplaintFieldsSequentially();


    // For Submit Button ////////////////////////////////
    document.getElementById("submit_btn").addEventListener("click", async function (e) {
        e.preventDefault();

        if (!navigator.onLine) {
        showManualAlert("⚠️ No / Poor internet connection.");
        return false;
        }

        const submitBtn = this;

        // Prevent double submit
        submitBtn.disabled = true;
                            
        const form = document.getElementById("supervisor_cir_form");

        ///////////////////////// Make sure form doesn't submit if photos are missing
        // ✅ Check built-in required field validation
        if (!form.checkValidity()) {
            form.reportValidity();
            submitBtn.disabled = false; // <-- re-enable for correction
            return;               

        }

        let allPhotosTaken = true;

        // Loop through each photo field (for field-0, field-1, etc.)
        for (let i = 0; i < 4; i++) {
            const input = document.getElementById(`photoInput-${i}`);
            const field = document.getElementById(`field-${i}`);
            const label = field.querySelector("label");

            // Remove old warning if any
            label.classList.remove("warning");
            const oldWarning = field.querySelector(".photo-warning");
            if (oldWarning) oldWarning.remove();

            // Check if photo is missing
            if (!input.value || !input.value.startsWith("data:image")) {
                allPhotosTaken = false;

                // Add red warning class to label
                label.classList.add("warning");

                // Create warning message
                const warning = document.createElement("span");
                warning.className = "photo-warning";
                warning.textContent = "Please capture this photo before submitting.";
                field.appendChild(warning);
            }
        }

        // If any photo is missing, stop form submission and showManualAlert the user
        if (!allPhotosTaken) {
            e.preventDefault(); // Prevent form from submitting
            showManualAlert("📸 Please take all required photos before submitting the form.");
            submitBtn.disabled = false; // <-- re-enable for correction
            return;
        }

        ///////////////////////// Adding Leading Zero, Image Compression And Form Submission Overlay Animation
        if (allPhotosTaken){

            const job_no = document.getElementById('job_no').value;

            if (job_no !== "") {
                let check_job_no_response = ""
                $.ajax({
                    type: "GET",
                    url: '/supervisor/check_job_card_no/',
                    data: {'job_no':job_no},

                    success: function(response){
                        if (response["error_msg"]){
                            showManualAlert(response["error_msg"]+'!!');
                            submitBtn.disabled = false;


                        } else if (response["job_no_exists"]){
                            check_job_no_response = response["job_no_exists"];

                            if (check_job_no_response == "no"){ 

                                openConfirmModal({
                                    message: "Submit the Report?",
                                    yesConfirmBtn_label: "YES",
                                    noConfirmBtn_label: "NO",
                                    onConfirm: async function() {

                                        toggleBodyScroll();

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
                                            // Show overlay before processing
                                            document.getElementById("formSubmittingOverlay").style.display = "flex";
                                            document.getElementById("submitting-text").innerHTML = "Submitting...";

                                            // Adding Leading Zero
                                            const jobNoInput = document.getElementById("job_no");

                                            let val = jobNoInput.value.replace(/^0+/, ''); // Remove leading zeros first
                                            if (val === "") {
                                                jobNoInput.value = "";
                                            } else {
                                                // Pad with leading zeros to make it 6 characters long
                                                jobNoInput.value = val.padStart(6, '0');
                                            }


                                            let imageFields = [];
                                            for (let i = 0; i <= 10; i++) {
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

                                            if (form.checkValidity()) {
                                                if (typeof form.requestSubmit === "function") {
                                                    form.requestSubmit();
                                                } else {
                                                    form.submit();
                                                }
                                            } else {
                                                document.getElementById("formSubmittingOverlay").style.display = "none";
                                                form.reportValidity();
                                                submitBtn.disabled = false; // <-- re-enable for correction
                                            }

                                        } else {
                                            // Server responded, but not OK (200)
                                            showManualAlert("⚠️ Server connection error. Please try again later!");
                                            submitBtn.disabled = false;
                                        }

                                    },
                                    onCancel: function () {
                                        submitBtn.disabled = false; // ✅ Re-enable if user clicks NO
                                    }
                                });

                            }else{
                                showManualAlert("Job No. already exists!");
                                submitBtn.disabled = false; // <-- re-enable for correction
                            }
                        }
                    },
                    error: function(xhr, status, error) {
                        // Handle server error, network issue, or server is down here
                        showManualAlert("⚠️ Server not reachable or network error. Please try again.");
                        submitBtn.disabled = false;

                    }
                });

            } else{
                showManualAlert("Kindly, enter Job No.");
                submitBtn.disabled = false; // <-- re-enable for correction
            }
        }
    });
});