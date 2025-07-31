document
  .getElementById("scrap_verification_file")
  .addEventListener("change", async function () {
    document.getElementById("slv_no").value = "";

    if (!navigator.onLine) {
      showManualAlert("⚠️ No / Poor internet connection.");
      document.getElementById("reset_btn").click();
      return false;
    }

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
      return;
    }

    if (responsePing.ok) {
    } else {
      // Server responded, but not OK (200)
      showManualAlert("⚠️ Server connection error. Please try again later!");
      return;
    }

    // Only letting the user to select ppt file for the scrap_verification_file attachment
    const file = this.files[0];
    const allowedTypes = [
      "application/vnd.ms-powerpoint", // .ppt
      "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
    ];

    if (file && !allowedTypes.includes(file.type)) {
      showManualAlert("Only PPT or PPTX files are allowed.");
      this.value = ""; // reset file input
      document.getElementById("reset_btn").click();
      return;
    }

    // Fetch pending scrap doc numbers from backend and checking file name
    let fileName = "";
    if (file) {
      fileName = file.name;
    }

    // const response = await fetch("/back_office_operator/get_pending_scrap_doc_nos/");
    const response = await fetch(
      `/back_office_operator/get_pending_scrap_doc_nos/?file_name=${fileName}`
    );
    const result = await response.json();

    resetScrapDocTable();

    if (result.status === "success") {
      if (result.doc_nos.length > 0) {
        document.getElementById("scrap_details_cont").style.display = "block";
        document.getElementById("scrap_list_heading").innerHTML =
          "PENDING SCRAP LISTS";
        result.doc_nos.forEach((doc_no) => addScrapDocRow(doc_no));
        document.getElementById("slv_no").classList.add("uneditable");
        document.getElementById("slv_no").disabled = true;
        updateSelectedDocCount();
      } else {
        document.getElementById("scrap_details_cont").style.display = "none";
        showManualAlert("No Scrap List Verification Pending");
        document.getElementById("scrap_verification_file").value = "";
      }
    } else {
      showManualAlert(result.error_msg);
      document.getElementById("scrap_details_cont").style.display = "none";
      document.getElementById("scrap_verification_file").value = "";
    }
  });

//////////////////////////////////////////////////////////////////////////////////////////////
// Binding Enter functionality to SLV_no field
document.addEventListener("DOMContentLoaded", function () {
  const page_body = document.getElementById("body");

  page_body.addEventListener("keydown", (event) => {
    let idelement = document.activeElement.id;

    if (event.key === "Enter") {
      event.preventDefault(); // To prevent Enter key for submitting the form

      if (idelement == "slv_no") {
        const slv_no = document.getElementById("slv_no").value;

        if (slv_no !== "") {
          if (!navigator.onLine) {
            showManualAlert("⚠️ No / Poor internet connection.");
            resetScrapDocTable();
            document.getElementById("scrap_details_cont").style.display =
              "none";
            return;
          }

          document.getElementById("scrap_verification_file").value = "";
          document.getElementById("slv_no").classList.add("uneditable");
          document
            .getElementById("scrap_verification_file")
            .classList.add("uneditable");
          document.getElementById("slv_no").disabled = true;
          document.getElementById("scrap_verification_file").disabled = true;

          $.ajax({
            type: "GET",
            url: "/back_office_operator/check_slv_no_exist/",
            data: { slv_no: slv_no },

            success: async function (response) {
              if (response["error_msg"]) {
                showManualAlert(response["error_msg"]);
                document
                  .getElementById("slv_no")
                  .classList.remove("uneditable");
                document
                  .getElementById("scrap_verification_file")
                  .classList.remove("uneditable");
                document.getElementById("slv_no").disabled = false;
                document.getElementById(
                  "scrap_verification_file"
                ).disabled = false;
                resetScrapDocTable();
                document.getElementById("scrap_details_cont").style.display =
                  "none";
                return;
              } else if (response["slv_no_exist"] == "no") {
                showManualAlert("SLV No. does not exists !!");
                document
                  .getElementById("slv_no")
                  .classList.remove("uneditable");
                document
                  .getElementById("scrap_verification_file")
                  .classList.remove("uneditable");
                document.getElementById("slv_no").disabled = false;
                document.getElementById(
                  "scrap_verification_file"
                ).disabled = false;
                resetScrapDocTable();
                document.getElementById("scrap_details_cont").style.display =
                  "none";
                return;
              } else if (response["slv_no_exist"] == "yes") {
                resetScrapDocTable();

                if (
                  response["pending_docs_list"].length > 0 ||
                  response["attached_docs_list"].length > 0
                ) {
                  document.getElementById("scrap_details_cont").style.display =
                    "block";
                  document.getElementById("scrap_list_heading").innerHTML =
                    "ATTACHED & PENDING SCRAP LISTS";
                  response["attached_docs_list"].forEach((doc_no) =>
                    addScrapDocRow(doc_no, true)
                  ); // Checked
                  response["pending_docs_list"].forEach((doc_no) =>
                    addScrapDocRow(doc_no, false)
                  ); // Unchecked
                  updateSelectedDocCount();
                } else {
                  document
                    .getElementById("slv_no")
                    .classList.remove("uneditable");
                  document
                    .getElementById("scrap_verification_file")
                    .classList.remove("uneditable");
                  document.getElementById("slv_no").disabled = false;
                  document.getElementById(
                    "scrap_verification_file"
                  ).disabled = false;
                  document.getElementById("scrap_details_cont").style.display =
                    "none";
                  showManualAlert("No Attached & Pending Scrap List Found !!");
                  document.getElementById("scrap_verification_file").value = "";
                  document.getElementById("slv_no").value = "";
                }
              }
            },
            error: function (xhr, status, error) {
              // Handle server error, network issue, or server is down here
              showManualAlert(
                "⚠️ Server not reachable or network error. Please try again."
              );
              saveBtn.disabled = false;
              resetScrapDocTable();
              document.getElementById("scrap_details_cont").style.display =
                "none";
              return;
            },
          });
        }
      }
    }
  });
});

//////////////////////////////////////////////////////////////////////////////////////////////
const scrapDocGroup = document.getElementById("scrap_doc_group");

let scrapDocCount = 0;

function resetScrapDocTable() {
  scrapDocGroup.innerHTML = "";
  scrapDocCount = 0;
  document.getElementById("selected_count").textContent =
    "Selected Scrap List: 0";
}

function addScrapDocRow(docNo = "", isChecked = false) {
  scrapDocCount++;

  const row = document.createElement("tr");

  const tdSrNo = document.createElement("td");
  tdSrNo.className = "serial_number";
  tdSrNo.textContent = scrapDocCount;

  const tdNo = document.createElement("td");
  const inputNo = document.createElement("input");
  inputNo.type = "text";
  inputNo.name = `doc_no${scrapDocCount}`;
  inputNo.className = "form-control doc_data";
  inputNo.readOnly = true;
  inputNo.value = docNo;
  tdNo.appendChild(inputNo);

  const tdAction = document.createElement("td");
  const tdDiv = document.createElement("div");
  tdDiv.style.cssText = `display:flex; justify-content:center; align-items:center`;
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.name = `include_doc${scrapDocCount}`;
  checkbox.className = "include_checkbox";

  if (isChecked) {
    checkbox.checked = true;
  }

  checkbox.addEventListener("change", updateSelectedDocCount);
  tdAction.appendChild(tdDiv);
  tdDiv.appendChild(checkbox);

  row.appendChild(tdSrNo);
  row.appendChild(tdNo);
  row.appendChild(tdAction);

  scrapDocGroup.appendChild(row);
}

function updateSelectedDocCount() {
  const checkboxes = scrapDocGroup.querySelectorAll(".include_checkbox");
  const count = Array.from(checkboxes).filter((cb) => cb.checked).length;
  document.getElementById(
    "selected_count"
  ).textContent = `Selected Scrap List: ${count}`;
}

//////////////////////////////////////////////////////////////////////////////////////////////
// For Reset Button

document.getElementById("reset_btn").addEventListener("click", function () {
  // Reset form fields
  const form = document.getElementById("scrap_list_verification_form");
  form.reset();

  // Clear file input
  document
    .getElementById("scrap_verification_file")
    .classList.remove("uneditable");
  document.getElementById("scrap_verification_file").disabled = false;
  document.getElementById("scrap_verification_file").value = "";

  document.getElementById("slv_no").classList.remove("uneditable");
  document.getElementById("slv_no").disabled = false;
  document.getElementById("slv_no").value = "";

  // Clear scrap doc table and counter
  scrapDocGroup.innerHTML = "";
  scrapDocCount = 0;
  document.getElementById("selected_count").textContent =
    "Selected Scrap List: 0";

  document.getElementById("scrap_details_cont").style.display = "none";
});

//////////////////////////////////////////////////////////////////////////////////////////////
// For Submit Button -
document
  .getElementById("submit_btn")
  .addEventListener("click", async function (e) {
    e.preventDefault(); // Stop normal form submission

    const fileInput = document.getElementById("scrap_verification_file");
    const file = fileInput.files[0];

    if (!file && !document.getElementById("slv_no").value) {
      showManualAlert("Please attach a Scrap Verification PPT file.");
      return;
    }

    const checkboxes = scrapDocGroup.querySelectorAll(".include_checkbox");
    const selectedDocs = [];

    checkboxes.forEach((cb) => {
      if (cb.checked) {
        const row = cb.closest("tr");
        const input = row.querySelector('input[name^="doc_no"]');
        if (input && input.value.trim()) {
          selectedDocs.push(input.value.trim());
        }
      }
    });

    if (selectedDocs.length === 0) {
      showManualAlert("Please select at least one Scrap List.");
      return;
    }

    if (!navigator.onLine) {
      showManualAlert("⚠️ No / Poor internet connection.");
      return false;
    }

    const submitBtn = this;

    const form = document.getElementById("scrap_list_verification_form");

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
    } else {
      // Server responded, but not OK (200)
      showManualAlert("⚠️ Server connection error. Please try again later!");
      submitBtn.disabled = false;
      return;
    }

    if (form.checkValidity()) {
      document.getElementById("formSubmittingOverlay").style.display = "flex";
      document.getElementById("submitting-text").innerHTML = "Submitting...";

      document.getElementById("slv_no").disabled = false;

      // Set selected doc_nos as JSON string into hidden input
      document.getElementById("doc_nos_json").value =
        JSON.stringify(selectedDocs);

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
  });