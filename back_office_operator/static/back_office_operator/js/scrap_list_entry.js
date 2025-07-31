// Only letting the user to select pdf file for the scrap_file attachment
document.getElementById("scrap_file").addEventListener("change", function () {
  const file = this.files[0];
  if (file && file.type !== "application/pdf") {
    showManualAlert("Only PDF files are allowed.");
    this.value = ""; // reset file input
    document.getElementById("reset_btn").click();
  }
});

//////////////////////////////////////////////////////////////////////////////////////////////
const prowacGroup = document.getElementById("prowac_group");

let prowacCount = 0;

function updateSerialNumbers() {
  const rows = prowacGroup.querySelectorAll("tr");
  rows.forEach((row, index) => {
    row.querySelector(".serial_number").textContent = index + 1;
  });
}

function addProwacRow(prowacNo = "", prowacYear = "") {
  prowacCount++;

  const row = document.createElement("tr");

  const tdSrNo = document.createElement("td");
  tdSrNo.className = "serial_number";
  tdSrNo.textContent = prowacGroup.children.length + 1;

  const tdNo = document.createElement("td");
  const inputNo = document.createElement("input");
  inputNo.type = "number";
  inputNo.name = `prowac_no${prowacCount}`;
  inputNo.className = "form-control prowac_data";
  inputNo.required = true;
  inputNo.value = prowacNo;
  tdNo.appendChild(inputNo);

  const tdYear = document.createElement("td");
  const inputYear = document.createElement("input");
  inputYear.type = "number";
  inputYear.name = `prowac_year${prowacCount}`;
  inputYear.className = "form-control prowac_data";
  inputYear.required = true;
  inputYear.value = prowacYear;
  tdYear.appendChild(inputYear);

  const tdAction = document.createElement("td");
  const delBtn = document.createElement("button");
  delBtn.href = "#";
  delBtn.className = "delete";
  delBtn.innerHTML = "X";
  
  delBtn.onclick = function (e) {
    e.preventDefault();
    if (prowacGroup.children.length > 1) {
      row.remove();
      updateSerialNumbers();
    }
  };
  tdAction.appendChild(delBtn);

  row.appendChild(tdSrNo);
  row.appendChild(tdNo);
  row.appendChild(tdYear);
  row.appendChild(tdAction);

  prowacGroup.appendChild(row);
  updateSerialNumbers();
}

// Add first row on page load
addProwacRow();

//////////////////////////////////////////////////////////////////////////////////////////////
// Auto-populating fields
// First it checks if the first page includes SCRAP LIST then only carry on the further process
document.getElementById("scrap_file").addEventListener("change", function () {
  const file = this.files[0];
  if (!file || !file.type.includes("pdf")) return;

  if (!navigator.onLine) {
    showManualAlert("⚠️ No / Poor internet connection.");
    document.getElementById("reset_btn").click();
    return false;
  }

  const reader = new FileReader();

  reader.onload = async function () {
    const typedarray = new Uint8Array(reader.result);

    try {
      const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;

      // Read only first page to validate heading
      const firstPage = await pdf.getPage(1);
      const content = await firstPage.getTextContent();
      const firstPageText = content.items.map((item) => item.str).join(" ");

      if (!firstPageText.toLowerCase().includes("scrap list")) {
        showManualAlert("Please attach a valid Scrap List file.");
        document.getElementById("scrap_file").value = ""; // clear file input
        document.getElementById("reset_btn").click();
        return;
      }

      // If valid, extract all pages
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map((item) => item.str);
        fullText += strings.join(" ") + "\n";
      }

      extractFieldsFromPDF(fullText);
    } catch (err) {
      showManualAlert("Error reading PDF file.");
      console.error(err);
    }
  };

  reader.readAsArrayBuffer(file);
});


function extractFieldsFromPDF(fullText) {
  // Truncate the text after 2 repetitions of "Scrap List Document No." to handle duplicate reports
  const reportStartPattern = /Scrap List Document No\./gi;
  const matches = [...fullText.matchAll(reportStartPattern)];

  if (matches.length > 1) {
    const cutoffIndex = matches[1].index; // start of second report
    fullText = fullText.slice(0, cutoffIndex); // keep only first report text
  }

  const getValue = (label) => {
    const pattern = new RegExp(`${label}\\s*([A-Z0-9\\-\\/\\.]+)`, "i");
    const match = fullText.match(pattern);
    return match ? match[1] : "";
  };

  const getDate = (label) => {
    const pattern = new RegExp(`${label}\\s*(\\d{2}-\\d{2}-\\d{4})`);
    const match = fullText.match(pattern);
    if (match) {
      const [dd, mm, yyyy] = match[1].split("-");
      return `${yyyy}-${mm}-${dd}`;
    }
    return "";
  };

  // Fill input fields
  document.getElementById("doc_no").value = getValue(
    "Scrap List Document No\\."
  );
  document.getElementById("plant").value = getValue("Plant");
  document.getElementById("total_prowacs").value = getValue(
    "Total No. of Prowacs"
  );
  document.getElementById("total_parts").value = getValue(
    "Total Number of Parts"
  );
  document.getElementById("list_generation_date").value = getDate(
    "Scrap List Generation Date"
  );
  document.getElementById("req_sub_date").value = getDate(
    "Scrap Req. Submission Date"
  );

  document.getElementById("scrap_details_cont").style.display = "block";

  // Extract unique prowacs
  const prowacMatches = Array.from(fullText.matchAll(/\b(\d+)\s+(2\d{3})\b/g));
  const uniqueSet = new Set();
  const uniquePairs = [];

  for (let [, prowacNo, prowacYear] of prowacMatches) {
    const key = `${prowacNo}-${prowacYear}`;
    if (!uniqueSet.has(key)) {
      uniqueSet.add(key);
      uniquePairs.push({ prowac_no: prowacNo, prowac_year: prowacYear });
    }
  }

  prowacGroup.innerHTML = "";
  prowacCount = 0;

  uniquePairs.forEach((item) => {
    addProwacRow(item.prowac_no, item.prowac_year);
  });
}

//////////////////////////////////////////////////////////////////////////////////////////////
// For Reset Button

document.getElementById("reset_btn").addEventListener("click", function () {
  // Reset all input fields inside the form
  const form = document.getElementById("scrap_list_form");
  form.reset();

  // Reset manually set fields (if not inside form)
  document.getElementById("doc_no").value = "";
  document.getElementById("plant").value = "";
  document.getElementById("total_prowacs").value = "";
  document.getElementById("total_parts").value = "";
  document.getElementById("list_generation_date").value = "";
  document.getElementById("req_sub_date").value = "";
  document.getElementById("scrap_details_cont").style.display = "none";

  // Reset prowac table
  prowacGroup.innerHTML = "";
  prowacCount = 0;
  addProwacRow();

  // Reset file input
  document.getElementById("scrap_file").value = "";
});

//////////////////////////////////////////////////////////////////////////////////////////////
function getCSRFToken() {
  return document.querySelector("[name=csrfmiddlewaretoken]").value;
}

// For Checking if the claim_no exists or not
// For Submit Button -
document
  .getElementById("submit_btn")
  .addEventListener("click", async function (e) {
    e.preventDefault(); // Stop normal form submission

    if (!navigator.onLine) {
      showManualAlert("⚠️ No / Poor internet connection.");
      return false;
    }

    const submitBtn = this;

    const form = document.getElementById("scrap_list_form");

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

    const prowacRows = document.querySelectorAll("#prowac_group tr");
    if (!prowacRows || prowacRows.length === 0) {
      showManualAlert("Scrap Details can't be empty");
      submitBtn.disabled = false;
      document.getElementById("reset_btn").click();
      return;
    }

    const prowacs = [];

    prowacRows.forEach((row) => {
      const prowac_no = row
        .querySelector('input[name^="prowac_no"]')
        .value.trim();
      const prowac_year = row
        .querySelector('input[name^="prowac_year"]')
        .value.trim();
      if (prowac_no && prowac_year) {
        prowacs.push({ prowac_no, prowac_year });
      }
    });

    document.getElementById("formSubmittingOverlay").style.display = "flex";
    document.getElementById("submitting-text").innerHTML =
      "Checking Prowac No...";

    // Send to backend
    $.ajax({
      url: "/back_office_operator/check_prowac_exists/",
      method: "POST",
      headers: {
        "X-CSRFToken": getCSRFToken(),
      },
      contentType: "application/json",
      data: JSON.stringify({ prowacs: prowacs }),
      success: function (res) {
        if (res.status === "success") {
          const notFound = res.result.filter((item) => !item.exists);

          if (notFound.length > 0) {
            document.getElementById("formSubmittingOverlay").style.display =
              "none";
            showManualAlert(
              "Some prowac entries are not found in the database. Please correct them."
            );
            submitBtn.disabled = false;
            highlightMissingProwacs(notFound);
          } else {
            // ✅ All exist — submit
            if (form.checkValidity()) {
              document.getElementById("formSubmittingOverlay").style.display =
                "flex";
              document.getElementById("submitting-text").innerHTML =
                "Submitting...";
              document.getElementById("prowacs_json").value = JSON.stringify(
                res.exists_ids
              );
              document
                .querySelectorAll(".prowac_data")
                .forEach((input) => (input.disabled = true));
              if (typeof form.requestSubmit === "function") {
                form.requestSubmit();
              } else {
                form.submit();
              }
            } else {
              document.getElementById("formSubmittingOverlay").style.display =
                "none";
              form.reportValidity();
              submitBtn.disabled = false; // <-- re-enable for correction
            }
          }
        } else {
          document.getElementById("formSubmittingOverlay").style.display =
            "none";
          showManualAlert("Server error while checking prowac numbers.");
          submitBtn.disabled = false;
        }
      },
      error: function () {
        document.getElementById("formSubmittingOverlay").style.display = "none";
        showManualAlert("Error while validating prowac numbers.");
        submitBtn.disabled = false;
      },
    });
  });

function highlightMissingProwacs(missingList) {
  const missingSet = new Set(
    missingList.map((d) => `${d.prowac_no}-${d.prowac_year}`)
  );
  const rows = document.querySelectorAll("#prowac_group tr");

  rows.forEach((row) => {
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