// To restrict zoom in for mobiles and tablets
if ('ontouchstart' in document.documentElement) {
    const meta = document.querySelector('meta[name=viewport]');
    if (meta) {
      meta.setAttribute(
        'content','width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
      );
    }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////
window.addEventListener("focus", function() {
    if (!navigator.onLine) {
      showManualAlert("⚠️ No / Poor internet connection.");
    }
});


/////////////////////////////////////////////////////////////////////////////////////////////////////////
if (
  (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) &&
  'orientation' in screen && screen.orientation.lock
) {
    // Try to lock to portrait
    screen.orientation.lock('portrait').catch(function(e) {
    });
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////
// Auto reloading the page after 8 hours of inactivity
(function() {
  const INACTIVITY_LIMIT_MS = 28800000; // 8 hours in milliseconds
  
  let lastActivity = Date.now();

  function updateActivity() {
    lastActivity = Date.now();
  }

  // Update last activity timestamp on any user interaction
  ['click', 'mousemove', 'keydown', 'scroll', 'touchstart'].forEach(event =>
    document.addEventListener(event, updateActivity, true)
  );

  // Reload the page if returning after 8 hours of inactivity
  function checkAndReloadIfExpired() {
    const now = Date.now();
    if (now - lastActivity >= INACTIVITY_LIMIT_MS) {
      location.reload(); // Triggers logout if session is expired
    }
  }

  // When user returns to the tab or PWA
  window.addEventListener('focus', checkAndReloadIfExpired);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkAndReloadIfExpired();
    }
  });
})();


/////////////////////////////////////////////////////////////////////////////////////////////////////////

function showToastMsg(message, duration) {
  const overlay = document.getElementById("toast_overlay");
  const toast = document.getElementById("toast_msg");

  toast.textContent = message;
  toast.style.display = "block";
  overlay.style.display = "block";

  setTimeout(() => {
    toast.style.display = "none";
    overlay.style.display = "none";
  }, duration);
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////

function showManualAlert(message, callback) {
  const overlay = document.getElementById("manualAlertOverlay");
  const msgBox = document.getElementById("manualAlertMsg");
  const okBtn = document.getElementById("manualAlertOkBtn");
  if (!overlay || !msgBox || !okBtn) return;

  msgBox.textContent = message || "Alert!";
  overlay.style.display = "flex";
  okBtn.focus();

  okBtn.onclick = function() {
    overlay.style.display = "none";
    // Restore scroll as soon as popup closes
    document.body.style.overflow = "";
    if (typeof callback === "function") callback();
  };

  // Disable scroll while alert is open
  document.body.style.overflow = "hidden";
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Making the text area field only for display to be dynamic ////////////////////////////////////////////
document.querySelectorAll(".multi_line_ta_display").forEach((textarea) => {
  textarea.style.height = "auto";
  textarea.style.height = textarea.scrollHeight + "px";

  const expand = () => {
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  };
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////

function toggleBodyScroll() {
  document.querySelector("body").classList.toggle("disableBodyScroll");
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////

// For Popup Confirmation Box
let confirmCallback = null;
let cancelCallback = null;

// Opens the modal and sets the message and confirm action
function openConfirmModal({
  message,
  yesConfirmBtn_label,
  noConfirmBtn_label,
  onConfirm,
  onCancel,
}) {
  toggleBodyScroll();
  document.getElementById("confirmMessage").textContent =
    message || "Are you sure?";
  document.getElementById("confirmOverlay").style.display = "flex";
  document.getElementById("yesConfirmBtn").innerHTML = yesConfirmBtn_label;
  document.getElementById("noConfirmBtn").innerHTML = noConfirmBtn_label;
  confirmCallback = onConfirm || null;
  cancelCallback = onCancel || null;
}

// Bind modal buttons
if (document.getElementById("yesConfirmBtn")) {
  document.getElementById("yesConfirmBtn").onclick = function () {
    document.getElementById("confirmOverlay").style.display = "none";
    if (typeof confirmCallback === "function") confirmCallback();
    confirmCallback = null;
    cancelCallback = null;
  };
}

if (document.getElementById("noConfirmBtn")) {
  document.getElementById("noConfirmBtn").onclick = function () {
    document.getElementById("confirmOverlay").style.display = "none";
    if (typeof cancelCallback === "function") cancelCallback(); // 
    confirmCallback = null;
    cancelCallback = null; // 
    toggleBodyScroll();
  };
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////

function formatToDisplayDate(dateString) {
    const date = new Date(dateString);

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12; // hour '0' should be '12'

    return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////

function convertISOToHuman(dtStr) {
  // console.log(dtStr)
  let cleanStr = dtStr.trim();
  cleanStr = cleanStr.replace(" ", "T");
  cleanStr = cleanStr.replace(/(\d{2}:\d{2}:\d{2})[.:]\d+$/, "$1");
  let dt = new Date(cleanStr);

  if (isNaN(dt.getTime())) {
    dt = new Date(cleanStr.split("T")[0]);
    if (isNaN(dt.getTime())) return dtStr;
  }

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const month = monthNames[dt.getMonth()];
  const day = dt.getDate();
  const year = dt.getFullYear();
  let hours = dt.getHours();
  const minutes = dt.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "P.M." : "A.M.";
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${month} ${day}, ${year}, ${hours}:${minutes} ${ampm}`;
}

function convertHumanToISO(humanStr) {
  // Remove commas and collapse spaces
  let cleaned = humanStr.replace(/,/g, "").replace(/\s+/g, " ").trim();
  let parts = cleaned.split(" ");

  // We expect at least 5 parts: [Month, Day, Year, HH:MM, AM/PM]
  if (parts.length < 5) {
    // Invalid input, return empty or the original string
    return "";
  }

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  let month = (monthNames.indexOf(parts[0]) + 1).toString().padStart(2, "0");
  let day = parts[1].padStart(2, "0");
  let year = parts[2];

  let timePart = parts[3];
  if (!timePart.includes(":")) return ""; // Time part is malformed

  let [hour, minute] = timePart.split(":").map(Number);
  let ampm = parts[4].toUpperCase();

  if (ampm.includes("P") && hour !== 12) hour += 12;
  if (ampm.includes("A") && hour === 12) hour = 0;
  hour = hour.toString().padStart(2, "0");

  return `${year}-${month}-${day} ${hour}:${minute
    .toString()
    .padStart(2, "0")}:00`;
}

function parseCustomDate(str) {
  return new Date(
    str
      .replace("a.m.", "AM")
      .replace("p.m.", "PM")
      .replace("A.M.", "AM")
      .replace("P.M.", "PM")
  );
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Function to view image in entire screen without download button and close it
function openImgModal_wd(imgUrl) {
    var modal = document.getElementById('imageModal_wd');
    var modalImg = document.getElementById('modalImg_wd');
    modal.style.display = "flex";
    modal.classList.add("show_wd");
    modalImg.src = imgUrl;
    toggleBodyScroll();
}

function closeImgModal_wd() {
    var modal = document.getElementById('imageModal_wd');
    var modalImg = document.getElementById('modalImg_wd');
    modal.style.display = "none";
    modal.classList.remove("show_wd");
    modalImg.src = "";
    toggleBodyScroll();
}

// ///////////////////////////////////////////////////////////////////////////
// Function to view image in entire screen with download button and close it
function openImgModal(imgUrl, file_name) {
    var modal = document.getElementById('imageModal');
    var modalImg = document.getElementById('modalImg');
    var downloadBtn = document.getElementById('download_img_btn');
    modal.style.display = "flex";
    modal.classList.add("show");
    modalImg.src = imgUrl;
    toggleBodyScroll();

    if (downloadBtn) {
        let safeClaimNo = (file_name || 'claim').toString().replace(/\s+/g, '_').replace(/[^\w\-\.]/g, '');
        let fileName = `${safeClaimNo}_part_dispatch_image.jpg`;
        // Remove previous event listeners if any
        downloadBtn.onclick = null;
        // Force download using Blob and correct filename
        downloadBtn.onclick = function (e) {
            e.preventDefault();
            fetch(imgUrl)
                .then(resp => resp.blob())
                .then(blob => {
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    a.remove();
                });
        };
        downloadBtn.style.display = 'flex';
    }
}


function closeImgModal() {
    var modal = document.getElementById('imageModal');
    var modalImg = document.getElementById('modalImg');
    var downloadBtn = document.getElementById('download_img_btn');
    modal.style.display = "none";
    modal.classList.remove("show");
    modalImg.src = "";
    toggleBodyScroll();

    // Hide download button if present
    if (downloadBtn) {
        downloadBtn.style.display = 'none';
    }
}


////////////////////////////////////////////////////////////////////////////////////////////////////////

document.addEventListener("DOMContentLoaded", function () {
  // Making the text area field dynamic ////////////////////////////////////////////
  document.querySelectorAll(".multi_line_ta").forEach((textarea) => {
    const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight);

    const autoResize = () => {
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + "px";
    };

    // Auto-resize while typing
    textarea.addEventListener("input", autoResize);

  });

  // ////////////////////////////////////////////////////////////////////////////////////////
  // The right code for putting comma and removing decimal values.
  document.querySelectorAll(".comma_format").forEach((input) => {
    function formatWithCommasAndDecimals(value) {
      if (value === "") return value;
      let num = value.toString().replace(/,/g, "");
      // Remove everything after dot, if present
      if (num.includes(".")) {
        num = num.split(".")[0];
      }
      if (isNaN(num)) return value;
      return Number(num).toLocaleString("en-IN");
    }

    // Compute caret offset (count of digits before caret, ignore commas)
    function getDigitCaretOffset(value, caretPos) {
      let count = 0;
      for (let i = 0; i < caretPos; ++i) {
        if (/\d/.test(value[i])) count++;
      }
      return count;
    }

    // Restore caret to correct logical position after re-format
    function setCaretFromDigitOffset(input, digitsLeft) {
      let val = input.value;
      let count = 0,
        i = 0;
      while (i < val.length) {
        if (/\d/.test(val[i])) count++;
        if (count === digitsLeft) break;
        i++;
      }
      // Set at found pos or at end if not found
      input.setSelectionRange(i + 1, i + 1);
    }

    input.addEventListener("input", function (e) {
      let oldValue = this.value;
      let caret = this.selectionStart;
      let digitsBefore = getDigitCaretOffset(oldValue, caret);

      // Remove commas for raw editing
      let raw = oldValue.replace(/,/g, "");

      // Allow only numbers, max one dot, max two decimals
      let match = raw.match(/^(\d*)(\.(\d{0,2})?)?/);
      let safe = "";
      if (match) {
        safe = match[1] || "";
        if (match[2] !== undefined) {
          safe += match[2].slice(0, 3);
        }
      }

      let [intPart = "", decimalPart = ""] = safe.split(".");
      let formattedInt = intPart ? Number(intPart).toLocaleString("en-IN") : "";
      let formatted = formattedInt;
      if (safe.includes(".")) {
        formatted += "." + decimalPart;
      }
      this.value = formatted;

      // Restore caret to the correct logical position
      setCaretFromDigitOffset(this, digitsBefore);
    });

    // Prevent invalid characters
    input.addEventListener("keypress", function (e) {
      // Only allow digits
      if (!"0123456789".includes(e.key)) {
        e.preventDefault();
      }
    });

    // On blur/change: always pad to two decimals and format
    function finalizeFormat() {
      if (input.value !== "") {
        input.value = formatWithCommasAndDecimals(input.value);
      }
    }
    input.addEventListener("blur", finalizeFormat);
    input.addEventListener("change", finalizeFormat);

    // On page load
    if (input.value !== "") {
      input.value = formatWithCommasAndDecimals(input.value);
    }
  });
});

/////////// For removing the comma and dot (decimals) before form submitting
function amountFormFormatting(form) {
  form.querySelectorAll(".comma_format").forEach((input) => {
    let num = input.value.replace(/,/g, "").trim();

    if (num === "") return;

    // Remove everything after dot (including the dot)
    if (num.includes(".")) {
      num = num.split(".")[0];
    }

    input.value = num; // Set value as pure integer string, no commas or decimals
  });
}
