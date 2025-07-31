document.addEventListener("DOMContentLoaded", function () {

    // Displaying red notification dot if revision report exists ///////////////////////////////
    const no_of_revision_report = JSON.parse(document.getElementById('no_of_revision_reportJSON').textContent);

    if (parseInt(no_of_revision_report, 10) > 0){

        if (window.getComputedStyle(document.getElementById('wm_dot')).display === "none"){
            document.getElementById('wm_dot').style.display = "inline-block";

        }
    }

    // Binding keys with functionalities (Enter) ///////////////////////////////////////
    const page_body = document.getElementById("body");

    page_body.addEventListener('keydown', (event) => {
        let idelement = document.activeElement.id; 
        if (event.key === 'Enter') {
            event.preventDefault();  // To prevent Enter key for submitting the form 

            if (idelement == "vehicle_no"){
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


    //////////////////////// To display the confirmation box for redirecting to Returned CIR Page //////////////////////////////
    document.getElementById("nav_wm_btn").addEventListener("click", async function (e) {
        e.preventDefault();

        if (!navigator.onLine) {
        showManualAlert("⚠️ No / Poor internet connection.");
        return false;
        }

        openAdvisorConfirmModal({
            confirmWMBtn_label: "Save",
            cancelWMBtn_label: "Cancel",
            message: "Do you want to Save the Changes before Exit?",
            onConfirm: function() {
                toggleBodyScroll();
                document.getElementById('task').value = "wm_redirect";
                document.getElementById('save_btn').click();
            }
        });

    });


    //////////////////////// To display the last 6 digits of job no //////////////////////////////

    // Extract last part after last hyphen
    const parts = fullJobValue.split("-");
    const lastPart = parts[parts.length - 1];

    // Convert to number
    const jobNumber = parseInt(lastPart, 10);

    // Set in number input field with id 'job_no'
    const jobInput = document.getElementById("job_no");
    if (jobInput) {
        jobInput.value = jobNumber;
        jobInput.value = jobInput.value.padStart(6, '0');
    }


    // ///////////////////////////////////////////////////////////////////////////////////////////
    // Complaint Description character restricts to 50 ////////////////////////////////
    document.querySelectorAll(".complaint").forEach(function(input) {
        input.addEventListener("input", function () {
            if (this.value.length > 50) {
                this.value = this.value.slice(0, 50);
            }
        });
    });


    ///////////////////////// To display images from database  /////////////////////////
    let imageUrls = {};

    try {
        const el = document.getElementById('imageUrlsJSON');
        if (el && el.textContent.trim()) {
            imageUrls = JSON.parse(el.textContent);
        }
    } catch (err) {
        console.warn("Failed to parse imageUrlsJSON:", err);
        imageUrls = {};
    }

    Object.keys(imageUrls).forEach((key) => {
        let index = -1;
        switch (key) {
            case "vehicle_front_image": index = 0; break;
            case "vehicle_with_number_plate": index = 1; break;
            case "chasis": index = 2; break;
            case "odometer": index = 3; break;
            default:
                if (key.startsWith("photo_")) {
                    index = parseInt(key.split("_")[1]);
                }
        }

        if (index >= 0) {
            const input = document.getElementById(`photoInput-${index}`);
            const field = document.getElementById(`field-${index}`);
            const viewBtn = field.querySelector(".view_btn");
            const removeBtn = field.querySelector(".danger_btn");
            const clickBtn = field.querySelector(".primary_btn");

            // mark field as having photo from server via URL
            input.dataset.url = imageUrls[key];
            viewBtn.style.display = "inline-block";
            removeBtn.style.display = "inline-block";
            clickBtn.innerText = "Retake Photo";
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


    // Form submission validation and image compression ////////////////////////////////
    document.getElementById("save_btn").addEventListener("click", async function (e) {
        e.preventDefault();

        if (!navigator.onLine) {
        showManualAlert("⚠️ No / Poor internet connection.");
        return false;
        }

        const saveBtn = this;

        saveBtn.disabled = true;
                
        const form = document.getElementById("edit_cir_form");

        ///////////////////////// Make sure form doesn't submit if photos are missing
        // ✅ Check built-in required field validation
        if (!form.checkValidity()) {
            form.reportValidity();
            saveBtn.disabled = false; // <-- re-enable for correction
            return;               
        }

        let allPhotosTaken = true;

        // Loop through each required photo field (field-0 to field-3)
        for (let i = 0; i < 4; i++) {
            const input = document.getElementById(`photoInput-${i}`);
            const field = document.getElementById(`field-${i}`);
            const label = field.querySelector("label");

            // Remove old warning if any
            label.classList.remove("warning");
            const oldWarning = field.querySelector(".photo-warning");
            if (oldWarning) oldWarning.remove();

            const hasBase64 = input.value && input.value.startsWith("data:image");
            const hasUrl = input.dataset.url && input.dataset.url.trim() !== "";

            // Check if both base64 and url are missing
            if (!hasBase64 && !hasUrl) {
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
            saveBtn.disabled = false; // <-- re-enable for correction
            return;
        }

        ///////////////////////// Adding Leading Zero, Image Compression And Form Submission Overlay Animation
        if (allPhotosTaken){

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

                // Show overlay before processing
                document.getElementById("formSubmittingOverlay").style.display = "flex";
                document.getElementById("submitting-text").innerHTML = "Saving...";

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

                if (imageFields.length > 0) {
                    await Promise.all(
                        imageFields.map(async (input) => {
                            let base64str = input.value.split(',')[1];
                            let byteLen = Math.ceil((base64str.length * 3) / 4);
                            if (byteLen > 200 * 1024) {
                                input.value = await compressImage(input.value, 200 * 1024, "image/jpeg");
                            }
                        })
                    );
                }

                const imageUrls = {};
                for (let i = 0; i <= 10; i++) {
                    const input = document.getElementById(`photoInput-${i}`);
                    if (input && input.dataset.url) {
                        imageUrls[`photo_${i}`] = input.dataset.url;
                    }
                }

                document.getElementById("imageUrlsJSONPassed").value = JSON.stringify(imageUrls);

                form.submit();

            } else {
                // Server responded, but not OK (200)
                showManualAlert("⚠️ Server connection error. Please try again later!");
                saveBtn.disabled = false;
            }
        }

    });

});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// For not letting user to go forward and backward from the current page using backward-forward buttons
history.pushState(null, null, location.href);
window.addEventListener('popstate', function(event) {
  history.pushState(null, null, location.href);
})