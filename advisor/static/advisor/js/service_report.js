document.addEventListener("DOMContentLoaded", function () {

    // Displaying red notification dot if revision report exists ///////////////////////////////
    const no_of_revision_report = JSON.parse(document.getElementById('no_of_revision_reportJSON').textContent);

    if (parseInt(no_of_revision_report, 10) > 0){

        if (window.getComputedStyle(document.getElementById('wm_dot')).display === "none"){
            document.getElementById('wm_dot').style.display = "inline-block";

        }
    }


    // ///////////////////////////////////////////////////////////////////////////////////////////
    // Fault Description character restricts to 50 ////////////////////////////////
    document.querySelectorAll(".faulty_description").forEach(function(input) {
        input.addEventListener("input", function () {
            if (this.value.length > 50) {
                this.value = this.value.slice(0, 50);
            }
        });
    });


    //////////////////////// To display the confirmation box for redirecting to Returned CIR Page //////////////////////////////
    const revision_remark = JSON.parse(document.getElementById('revision_remarkJSON').textContent);

    document.getElementById("nav_wm_btn").addEventListener("click", async function (e) {
        e.preventDefault();

        if (!navigator.onLine) {
        showManualAlert("⚠️ No / Poor internet connection.");
        return false;
        }

        if (revision_remark === "no_remark"){
            openAdvisorConfirmModal({
                confirmWMBtn_label: "Draft",
                cancelWMBtn_label: "Cancel",
                message: "Do you want to Draft the Changes before Exit?",
                onConfirm: function() {
                    toggleBodyScroll();
                    document.getElementById('task').value = "wm_redirect";
                    document.getElementById('draft_btn').click();
                }
            });
        
        }else {
            openAdvisorConfirmModal({
                confirmWMBtn_label: "Save",
                cancelWMBtn_label: "Cancel",
                message: "Do you want to Save the Changes before Exit?",
                onConfirm: function() {
                    toggleBodyScroll();
                    document.getElementById('task').value = "wm_redirect";
                    document.getElementById('draft_btn').click();
                }
            });
        }


    });


    ///////////////////////// To display next to next card when faulty_description gets input /////////////////////////

    const faultyDescriptions = document.querySelectorAll('.faulty_description');

    faultyDescriptions.forEach(function (field) {
        field.addEventListener('input', function (event) {            
            const parentDiv = event.target.closest('div'); // Closest parent <div>
            if (parentDiv && parentDiv.id) {
                const id = parentDiv.id; // e.g., "field-0"
                const parts = id.split('-');
                const faulty_description_index = parseInt(parts[1], 10);
                showNextCard(faulty_description_index);
            }
        });
    });




    ///////////////////////// For Draft button /////////////////////////
    if (revision_remark === "no_remark"){
        document.getElementById("draft_btn").addEventListener("click", async function (e) {
            e.preventDefault();

            if (!navigator.onLine) {
            showManualAlert("⚠️ No / Poor internet connection.");
            return false;
            }

            const draftBtn = this;

            // Prevent double submit
            draftBtn.disabled = true;

            const form = document.getElementById("service_advisor_report_form");

            if (!form.checkValidity()) {
                form.reportValidity();
                draftBtn.disabled = false; // <-- re-enable for correction
                return;               
            }

            ////////////// Image Compression And Form Submission Overlay Animation

            // Ping server
            let responsePing;
            try {
                responsePing = await fetch('/ping/', { method: 'HEAD', cache: 'no-store' });
            } catch {
                showManualAlert("⚠️ Server not reachable or network error. Please try again!");
                draftBtn.disabled = false;
                return;
            }

            if (responsePing.ok) {
                // Show overlay before processing
                document.getElementById("formSubmittingOverlay").style.display = "flex";
                document.getElementById("submitting-text").innerHTML = "Drafting...";

                let imageFields = [];
                for (let i = 0; i <= 14; i++) {
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

                document.getElementById('action_field').value = "draft";

                const imageUrls = {};
                for (let i = 0; i <= 14; i++) {
                    const input = document.getElementById(`photoInput-${i}`);
                    if (input && input.dataset.url) {
                        imageUrls[`photo_${i}`] = input.dataset.url;
                    }
                }

                document.getElementById("imageUrlsJSONPassed").value = JSON.stringify(imageUrls);

                form.submit(); // Overlay will stay until page navigation or AJAX response

            } else {
                // Server responded, but not OK (200)
                showManualAlert("⚠️ Server connection error. Please try again later!");
                draftBtn.disabled = false;
            }
        });
    }


    ///////////////////////// For Save button /////////////////////////
    if (revision_remark !== "no_remark"){
        document.getElementById("save_btn").addEventListener("click", async function (e) {
            e.preventDefault();

            if (!navigator.onLine) {
            showManualAlert("⚠️ No / Poor internet connection.");
            return false;
            }

            const saveBtn = this;

            // Prevent double submit
            saveBtn.disabled = true;

            const form = document.getElementById("service_advisor_report_form");

            if (!form.checkValidity()) {
                form.reportValidity();
                saveBtn.disabled = false; // <-- re-enable for correction
                return;               
            }

            ////////////// Image Compression And Form Submission Overlay Animation

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

                let imageFields = [];
                for (let i = 0; i <= 14; i++) {
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

                document.getElementById('action_field').value = "save";

                const imageUrls = {};
                for (let i = 0; i <= 14; i++) {
                    const input = document.getElementById(`photoInput-${i}`);
                    if (input && input.dataset.url) {
                        imageUrls[`photo_${i}`] = input.dataset.url;
                    }
                }

                document.getElementById("imageUrlsJSONPassed").value = JSON.stringify(imageUrls);

                form.submit(); // Overlay will stay until page navigation or AJAX response
            
            } else {
                showManualAlert("⚠️ Server connection error. Please try again later!");
                saveBtn.disabled = false;
            }
        });
    }


    ///////////////////////////For Submit button confirmation box /////////////////////////

    if (revision_remark === "no_remark"){
        document.getElementById("submit_btn").addEventListener("click", async function (e) {
            e.preventDefault();

            if (!navigator.onLine) {
            showManualAlert("⚠️ No / Poor internet connection.");
            return false;
            }

            const submitBtn = this;

            // Prevent double submit
            submitBtn.disabled = true;

            const form = document.getElementById("service_advisor_report_form");

            if (!form.checkValidity()) {
                form.reportValidity();
                submitBtn.disabled = false; // <-- re-enable for correction
                return;               
            }

            $.ajax({
                type: "GET",
                url: '/advisor/check_works_manager/',
                data: {'check':'check'},

                success: function(response){

                    if (response["error_msg"]){
                        showManualAlert(response["error_msg"]);
                        submitBtn.disabled = false;

                    } else if (response["exists"]){

                        openConfirmModal({
                        message: "Submit the report?",
                        yesConfirmBtn_label: "YES",
                        noConfirmBtn_label: "NO",
                            onConfirm: async function() {

                                toggleBodyScroll();

                                ////////////// Image Compression And Form Submission Overlay Animation

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

                                    let imageFields = [];
                                    for (let i = 0; i <= 14; i++) {
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

                                    document.getElementById('action_field').value = "submit";
                                    document.getElementById('task').value = "submit";

                                    const imageUrls = {};
                                    for (let i = 0; i <= 14; i++) {
                                        const input = document.getElementById(`photoInput-${i}`);
                                        if (input && input.dataset.url) {
                                            imageUrls[`photo_${i}`] = input.dataset.url;
                                        }
                                    }

                                    document.getElementById("imageUrlsJSONPassed").value = JSON.stringify(imageUrls);

                                    form.submit(); // Overlay will stay until page navigation or AJAX response
                                    
                                } else {
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
                    showManualAlert("⚠️ Server not reachable or network error. Please try again.");
                    submitBtn.disabled = false;
                }
            });
        });
    }


    ///////////////////////// To display faulty images from draft database  /////////////////////////

    const imageUrlsEl = document.getElementById("imageUrlsJSON");
    let imageUrls = {};
    if (imageUrlsEl && imageUrlsEl.textContent.trim()) {
        imageUrls = JSON.parse(imageUrlsEl.textContent);
    }

    let lastKeyIndex = -1;

    for (let i = 0; i <= 14; i++) {
        const input = document.getElementById(`photoInput-${i}`);
        const field = document.getElementById(`field-${i}`);
        const key = `photo_${i}`;
        const cardCont = document.getElementById(`card_cont_${i}`);

        let found = false;

        // Prefer base64 from value if present
        if (input && input.value && input.value.startsWith("data:image")) {
            found = true;
        }

        // Else use image URL from dataset
        else if (imageUrls[key]) {
            input.dataset.url = imageUrls[key];
            found = true;
        }

        if (found) {
            // Show image controls
            if (field) {
                const viewBtn = field.querySelector(".view_btn");
                const removeBtn = field.querySelector(".danger_btn");
                const clickBtn = field.querySelector(".primary_btn");
                if (viewBtn) viewBtn.style.display = 'inline-block';
                if (removeBtn) removeBtn.style.display = 'inline-block';
                if (clickBtn) clickBtn.innerText = "Retake Photo";
            }

            if (cardCont) {
                cardCont.style.display = "block";
                lastKeyIndex = i;
            }
        }
    }

    // Also show next card if needed
    if (lastKeyIndex < 14 && lastKeyIndex >= 0) {
        const nextCard = document.getElementById(`card_cont_${lastKeyIndex + 1}`);
        if (nextCard) nextCard.style.display = "block";
    }



    ///////////////////////// To display faulty description card from draft database  /////////////////////////

    const lastFaultyDescriptionIndex = JSON.parse(document.getElementById('lastFaultyDescriptionIndexJSON').textContent);

    if (lastFaultyDescriptionIndex){
        for (let i = 0; i <= lastFaultyDescriptionIndex; i++) {
            document.getElementById("card_cont_" + i).style.display = "block";
        }
        multi_line_ta_fun();
    }

    ///////////////////////// To toogle between submit btn and draft btn  /////////////////////////

    if (revision_remark === "no_remark"){
        const checkbox = document.getElementById("report_completed");
        const backButtons = document.querySelectorAll(".back_btn");
        const draftBtn = document.getElementById("draft_btn");
        const submitBtn = document.getElementById("submit_btn");

        checkbox.addEventListener("change", function () {
            if (checkbox.checked) {
                submitBtn.style.display = "inline-block";
                draftBtn.style.display = "none";
                document.getElementById("nav_wm_btn").style.pointerEvents = "none";
                document.getElementById("nav_wm_btn").style.opacity = "0.6";
                document.getElementById("nav_wm_btn").style.cursor= "not-allowed";
                document.getElementById("forward_to_wm").style.display= "block";
                document.getElementById('forward_to_wm').scrollIntoView({ behavior: 'smooth' });
                backButtons.forEach(function (btn) {
                    btn.style.visibility = "hidden";
                });
            } else {
                submitBtn.style.display = "none";
                draftBtn.style.display = "inline-block";
                document.getElementById("nav_wm_btn").style.pointerEvents = "auto";
                document.getElementById("nav_wm_btn").style.opacity = "1";
                document.getElementById("nav_wm_btn").style.cursor= "pointer";
                document.getElementById("forward_to_wm").style.display= "none";
                draftBtn.scrollIntoView({ behavior: 'smooth' });
                backButtons.forEach(function (btn) {
                    btn.style.visibility = "visible";
                });
            }
        });
    }

});


///////////////////////// For showing next to next faulty image cards /////////////////////////
function showNextCard(currentIndex) {
    const nextIndex = currentIndex + 1;
    const nextCard = document.getElementById("card_cont_" + nextIndex);
    if (nextCard) {
        nextCard.style.display = "block";
    }
}


///////////////////////// For displaying the drafted faulty_descriptions in multiple lines /////////////////////////
function multi_line_ta_fun() {
    document.querySelectorAll('.multi_line_ta').forEach(textarea => {
        const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight);

        const expand = () => {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
        };

        const autoResize = () => {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
        };

        // Auto-resize while typing
        textarea.addEventListener('input', autoResize);

        expand();
    });

}

