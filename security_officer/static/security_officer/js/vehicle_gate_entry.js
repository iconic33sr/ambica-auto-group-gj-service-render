document.addEventListener("DOMContentLoaded", function () {
  
  // Restricting regex for job_no here while typing only six digits are allowed then when inserting value using ajax the regex check is disabled than enabled again ///////////////////////////////
  let allowJsInsert = false;

  const jobNoInput = document.getElementById("job_no");

  // Keydown: restrict user typing to 6 digits only
  jobNoInput.addEventListener("keydown", function (e) {
    if (allowJsInsert) return; // Skip restriction during JS insert

    const key = e.key;

    if (
      key === "Backspace" ||
      key === "Delete" ||
      key === "Tab" ||
      key === "ArrowLeft" ||
      key === "ArrowRight" ||
      key === "Home" ||
      key === "End"
    )
      return;

    if (!/^[0-9]$/.test(key)) {
      e.preventDefault();
      return;
    }

    if (this.value.length >= 6 && this.selectionStart === this.selectionEnd) {
      e.preventDefault();
    }
  });

  // Input sanitization: digits only, max 6
  jobNoInput.addEventListener("input", function (e) {
    if (allowJsInsert) return; // Skip cleanup during JS insert

    let cleaned = this.value.replace(/\D/g, "").slice(0, 6);
    this.value = cleaned;
  });

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // Only digits allowed in gate_no  ///////////////////////////////
  const gatePassNoInput = document.getElementById("gate_pass_no");

  // Block non-digit keystrokes
  gatePassNoInput.addEventListener("keypress", function (e) {
    if (!/[0-9]/.test(e.key)) {
      e.preventDefault();
    }
  });

  // Also filter pasted input or input by drag/drop
  gatePassNoInput.addEventListener("input", function () {
    this.value = this.value.replace(/[^0-9]/g, "");
  });

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // Fetching vehicle details on check button
  document.getElementById("checkBtn").addEventListener("click", async function (e) {
      if (!navigator.onLine) {
        showManualAlert("⚠️ No / Poor internet connection.");
        return;
      }

      const year = document.getElementById("year").value;
      let job_no = document.getElementById("job_no").value;
      const regex_to_send = /^(?!0+$)\d{1,6}$/;

      if (job_no !== "") {
        if (regex_to_send.test(job_no)) {
          const firstTwo = year.slice(2, 4); // "25"
          const lastTwo = year.slice(-2); // "26"
          const yearDigits = firstTwo + lastTwo;

          padded_job_no = job_no.padStart(6, "0");

          job_no = yearDigits + "-" + padded_job_no;

          $.ajax({
            type: "GET",
            url: "/security_officer/fetch_job_data/",
            data: { job_no: job_no },

            success: function (response) {
              if (response["error_msg"]) {
                showManualAlert("Job No not found !!");
              }

              if (response["data"]) {
                document.getElementById("job_no_error").style.display = "none";

                allowJsInsert = true;
                document.getElementById("job_no").type = "text";
                document.getElementById("job_no").value =
                  response["data"]["full_job_no"];
                allowJsInsert = false;
                document.getElementById("job_no").classList.add("uneditable");
                document.getElementById("job_no").readOnly = true;

                document.getElementById("vehicle_no").value =
                  response["data"]["vehicle_no"];

                if (response["data"]["entry"] == "not generated") {
                  document.getElementById("details_cont").style.display =
                    "block";
                  document.getElementById("submit_btn").style.display = "block";
                } else {
                  document.getElementById(
                    "entry_already_submitted"
                  ).style.display = "block";
                }
              }
            },
            error: function (xhr, status, error) {
              // Handle server error, network issue, or server is down here
              showManualAlert(
                "⚠️ Server not reachable or network error. Please try again."
              );
            },
          });
        }
      }
    });

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // For cancel button  //////////////////////////////
  document
    .getElementById("cancel_btn")
    .addEventListener("click", async function (e) {
      e.preventDefault();
      document.getElementById("vehicle_gate_entry_form").reset();
      document.getElementById("job_no").type = "number";
      document.getElementById("job_no").readOnly = false;
      document.getElementById("job_no").classList.remove("uneditable");
      document.getElementById("job_no_error").style.display = "none";
      document.getElementById("job_no").focus();
      document.getElementById("entry_already_submitted").style.display = "none";

      document
        .querySelectorAll('input[type="hidden"].photoInput')
        .forEach((el) => (el.value = ""));
      document
        .querySelectorAll('button.click_photo_btn[type="button"]')
        .forEach((btn) => (btn.innerHTML = "Click Photo"));
      document
        .querySelectorAll('button.view_photo_btn[type="button"]')
        .forEach((btn) => (btn.style.display = "none"));
      document
        .querySelectorAll('button.remove_photo_btn[type="button"]')
        .forEach((btn) => (btn.style.display = "none"));

      document.getElementById("details_cont").style.display = "none";
      document.getElementById("submit_btn").style.display = "none";
    });

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // For submit button  //////////////////////////////
  document
    .getElementById("submit_btn")
    .addEventListener("click", async function (e) {
      e.preventDefault();

      if (!navigator.onLine) {
        showManualAlert("⚠️ No / Poor internet connection.");
        return false;
      }

      const submitBtn = this;

      // Prevent double submit
      submitBtn.disabled = true;

      // Only submit the form if the value in job_no is valid
      const jobNoInput = document.getElementById("job_no");
      const errorMsg = document.getElementById("job_no_error");
      const regex = /^JC-ShrAmb-[A-Z]{2}-\d{4}-\d{6}$/;

      if (jobNoInput !== "") {
        if (!regex.test(jobNoInput.value)) {
          errorMsg.style.display = "block";
          errorMsg.innerText = "Invalid Job No. Format !!";
          jobNoInput.focus();
        } else {
          errorMsg.style.display = "none";

          const form = document.getElementById("vehicle_gate_entry_form");

          if (form.checkValidity()) {
            openConfirmModal({
              message: "Submit the Entry?",
              yesConfirmBtn_label: "YES",
              noConfirmBtn_label: "NO",
              onConfirm: async function () {
                toggleBodyScroll();

                ////////////// Image Compression And Form Submission Overlay Animation

                // Ping server
                let responsePing;
                try {
                  responsePing = await fetch("/ping/", {
                    method: "HEAD",
                    cache: "no-store",
                  });
                } catch {
                  showManualAlert(
                    "⚠️ Server not reachable or network error. Please try again!"
                  );
                  submitBtn.disabled = false;
                  return;
                }

                if (responsePing.ok) {
                  // Show overlay before processing
                  document.getElementById(
                    "formSubmittingOverlay"
                  ).style.display = "flex";
                  document.getElementById("submitting-text").innerHTML =
                    "Submitting...";

                  let imageFields = [];
                  for (let i = 0; i <= 1; i++) {
                    let inp = document.getElementById(`photoInput-${i}`);
                    if (
                      inp &&
                      inp.value &&
                      inp.value.startsWith("data:image")
                    ) {
                      imageFields.push(inp);
                    }
                  }

                  await Promise.all(
                    imageFields.map(async (input) => {
                      let base64str = input.value.split(",")[1];
                      let byteLen = Math.ceil((base64str.length * 3) / 4);
                      if (byteLen > 200 * 1024) {
                        input.value = await compressImage(
                          input.value,
                          200 * 1024,
                          "image/jpeg"
                        );
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
                  showManualAlert(
                    "⚠️ Server connection error. Please try again later!"
                  );
                  submitBtn.disabled = false;
                }
              },
              onCancel: function () {
                submitBtn.disabled = false; // ✅ Re-enable if user clicks NO
              },
            });
          } else {
            form.reportValidity();
            submitBtn.disabled = false; // <-- re-enable for correction
          }
        }
      }
    });
});
