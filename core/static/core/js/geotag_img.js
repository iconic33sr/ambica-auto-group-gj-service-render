let currentFieldIndex = null;
let currentStream = null;
let currentFacingMode = "environment";
let flashlightOn = false;
let torchSupported = false;
let torchTrack = null;
let tempPhotoData = null;

let currentData = {
  lat: null,
  lng: null,
  address: "",
  city: "",
  state: "",
  pincode: "",
  country: "",
  timestamp: "",
};

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
canvas.width = 1280;
canvas.height = 960;
const ctx = canvas.getContext("2d");
const modal = document.getElementById("cameraModal");
const confirmBtn = document.getElementById("confirmPhoto");
const discardBtn = document.getElementById("discardPhoto");
const geoOverlay = document.getElementById("geoOverlay");
const topControls = document.getElementById("cameraTopControls");
const photoPopup = document.getElementById("photoPopup");
const popupImg = document.getElementById("popupImg");
const closePopupBtn = document.getElementById("closePopup");
const cameraPreviewContainer = document.getElementById(
  "cameraPreviewContainer"
);
const vehicleNoInput = document.getElementById("vehicle_no");

let locationPollingInterval = null;
let lastLat = null;
let lastLng = null;
let locationFetched = false;
let lastUpdateTime = null;
let lastGeoApiTime = 0;

let availableVideoDevices = [];
let preferredRearDeviceId = null;

let lastFetchedLocation = null; // { lat: Number, lng: Number }
let lastFetchedAddress = null;  // Address data
let isInitMapRunning = false;   // To prevent double-calls

let locationBlockActive = false;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// CLICK PHOTO BUTTON - CAMERA PREVIEW PAGE

function getFormattedTimestamp() {
  const now = new Date();
  const pad = (num) => String(num).padStart(2, "0");

  const day = pad(now.getDate());
  const month = pad(now.getMonth() + 1);
  const year = now.getFullYear();
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());

  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
}

// Helper to wrap address text for overlay (not canvas)
function wrapTextForOverlay(text, maxWidth, padding) {
  if (!text) return [""];
  const testDiv = document.createElement("div");
  testDiv.style.position = "absolute";
  testDiv.style.visibility = "hidden";
  testDiv.style.font = "14px Arial";
  testDiv.style.width = maxWidth - padding * 2 + "px";
  testDiv.style.whiteSpace = "nowrap";
  document.body.appendChild(testDiv);

  const words = text.split(" ");
  let lines = [];
  let line = "";

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    testDiv.innerText = testLine;
    if (testDiv.offsetWidth > maxWidth - padding * 2 && n > 0) {
      lines.push(line.trim());
      line = words[n] + " ";
    } else {
      line = testLine;
    }
  }
  if (line.trim() !== "") lines.push(line.trim());
  document.body.removeChild(testDiv);
  return lines;
}

function updateLiveOverlay() {
  const { lat, lng, address, city, state, country } = currentData;
  if (!lat || !lng) {
        geoOverlay.innerHTML = `
            <div style="font-size: 1.2rem; color: #ffe600; font-weight: bold; text-shadow: 1px 1px 6px #000a; padding:1.5em;">
                📡 Fetching location…
            </div>
        `;
        return; // Don’t render the rest until location is ready!
  }
  const regNo = vehicleNoInput ? vehicleNoInput.value : "";
  const timestamp = getFormattedTimestamp();

  // Split address into lines that fit the overlay width
  const overlayWidth = geoOverlay.offsetWidth || window.innerWidth;
  const addressLines = wrapTextForOverlay(address, overlayWidth, 16); // 16px padding
  // geoOverlay.style.cssText = `position:absolute,`
  geoOverlay.innerHTML = `
    <div style="font-weight: bold; font-size: 17px; text-transform: capitalize;">${city}, ${state}, ${country}</div>
    ${addressLines
      .map((line) => `<div style="text-transform: capitalize;">${line}</div>`)
      .join("")}
    <div>Lat: <span id="geoLatLng">${lat?.toFixed(6)}, Lng: ${lng?.toFixed(
    6
  )}</span></div>
    <div><span id="time">${timestamp}</span> GMT +05:30</div>
    
  `;
}

function updateLatLngInOverlay(lat, lng) {
  const latLngSpan = document.getElementById("geoLatLng");
  if (latLngSpan) {
    latLngSpan.textContent = `${lat?.toFixed(6)}, Lng: ${lng?.toFixed(6)}`;
  }
}

// ////////////////////////////////////////////////////////////////////////////////////
// Using this function macro camera is being used for default so we use the above code to use the primary camera
async function openCamera(index) {
  await initMap(); // Ensure latest location
  currentFieldIndex = index;
  modal.style.display = "flex";
  confirmBtn.innerText = "Take Photo";
  discardBtn.innerText = "Cancel";
  tempPhotoData = null;
  geoOverlay.style.display = "block";
  topControls.style.display = "flex";
  document.getElementById("flashlightBtn").style.visibility = "visible";
  document.getElementById("switchCameraBtn").style.visibility = "visible";
  video.style.display = "block";
  toggleBodyScroll();

  // Remove any existing preview image
  const existingPreview = cameraPreviewContainer.querySelector("img");
  if (existingPreview) existingPreview.remove();

  // ---- KEY FIX: RESET TORCH/FLASH STATE BEFORE NEW STREAM ----
  flashlightOn = false;
  torchSupported = false;
  torchTrack = null;

  try {
    const width = 1280, height = 960;
    currentStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: currentFacingMode, width, height }
    });
    video.srcObject = currentStream;
    updateLiveOverlay();

    // ---- SETUP TORCH SUPPORT FOR NEW STREAM ----
    if (currentStream && currentStream.getVideoTracks().length) {
      const track = currentStream.getVideoTracks()[0];
      const capabilities = track.getCapabilities ? track.getCapabilities() : {};
      torchSupported = !!capabilities.torch;
      torchTrack = torchSupported ? track : null;
      const flashlightBtn = document.getElementById("flashlightBtn");
      if (torchSupported) {
        flashlightBtn.style.display = "inline-block";
        flashlightBtn.innerText = "🔦";
      } else {
        flashlightBtn.style.display = "none";
      }
    }
  } catch (err) {
    showManualAlert("Camera error: " + err);
  }

  if (window.geoInterval) clearInterval(window.geoInterval);
  function updateTime() {
    let time = document.querySelector("#time");
    if (time) time.innerHTML = getFormattedTimestamp();
    currentData.timestamp = getFormattedTimestamp();
  }
  setInterval(updateTime, 1000);
}


async function switchCamera() {
  // Switch mode
  currentFacingMode = currentFacingMode === "environment" ? "user" : "environment";
  stopCamera();

  // ---- KEY FIX: RESET TORCH/FLASH STATE BEFORE NEW STREAM ----
  flashlightOn = false;
  torchSupported = false;
  torchTrack = null;

  try {
    currentStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: currentFacingMode, width: 1280, height: 960 }
    });
    video.srcObject = currentStream;

    // ---- SETUP TORCH SUPPORT FOR NEW STREAM ----
    if (currentStream && currentStream.getVideoTracks().length) {
      const track = currentStream.getVideoTracks()[0];
      const capabilities = track.getCapabilities ? track.getCapabilities() : {};
      torchSupported = !!capabilities.torch;
      torchTrack = torchSupported ? track : null;
      const flashlightBtn = document.getElementById("flashlightBtn");
      if (torchSupported) {
        flashlightBtn.style.display = "inline-block";
        flashlightBtn.innerText = "🔦";
      } else {
        flashlightBtn.style.display = "none";
      }
    }
  } catch (err) {
    showManualAlert("Camera switch error: " + err);
  }
}

document.getElementById("flashlightBtn").onclick = async function () {
  if (!currentStream || !currentStream.getVideoTracks().length) {
    showManualAlert("Camera stream not active.");
    return;
  }
  const track = currentStream.getVideoTracks()[0];
  const capabilities = track.getCapabilities ? track.getCapabilities() : {};
  if (!capabilities.torch) {
    showManualAlert("Flashlight not supported on your device/browser.");
    return;
  }
  flashlightOn = !flashlightOn;
  try {
    await track.applyConstraints({ advanced: [{ torch: flashlightOn }] });
    torchTrack = track; // update the global
    torchSupported = true;
    this.innerText = flashlightOn ? "💡" : "🔦";
  } catch (err) {
    showManualAlert("Could not toggle flashlight: " + err.message);
    flashlightOn = !flashlightOn;
  }
};


confirmBtn.onclick = () => {
  if (!tempPhotoData) {
    // Try ImageCapture first
    const track = currentStream.getVideoTracks()[0];
    if (window.ImageCapture) {
      try {
        const imageCapture = new ImageCapture(track);
        imageCapture
          .grabFrame()
          .then((bitmap) => {
            canvas.width = bitmap.width;
            canvas.height = bitmap.height;
            ctx.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height);
            drawOverlay();
            tempPhotoData = canvas.toDataURL("image/png");
            showPreviewImage(tempPhotoData);
          })
          .catch(() => {
            fallbackCapture();
          });
      } catch (e) {
        fallbackCapture();
      }
    } else {
      fallbackCapture();
    }

    function fallbackCapture() {
      // Use stream settings if available
      let settings = { width: 1280, height: 960 };
      try {
        const s = track.getSettings();
        settings.width = s.width || 1280;
        settings.height = s.height || 960;
      } catch (e) {}
      canvas.width = settings.width;
      canvas.height = settings.height;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      drawOverlay();
      tempPhotoData = canvas.toDataURL("image/png");
      showPreviewImage(tempPhotoData);
    }

    function showPreviewImage(dataURL) {
      confirmBtn.innerText = "Confirm";
      discardBtn.innerText = "Retake";
      geoOverlay.style.display = "none";
      video.style.display = "none";
      document.getElementById("flashlightBtn").style.visibility = "hidden";
      document.getElementById("switchCameraBtn").style.visibility = "hidden";
      // Remove previous preview if present
      const old = cameraPreviewContainer.querySelector("#cameraPreviewImage");
      if (old) old.remove();
      const previewImage = document.createElement("img");
      previewImage.src = dataURL;
      previewImage.id = "cameraPreviewImage";
      previewImage.style.maxWidth = "100%";
      previewImage.style.maxHeight = "100%";
      // Ensure sharp display (add these style lines)
      previewImage.style.imageRendering = "crisp-edges";
      previewImage.style.objectFit = "contain";
      previewImage.style.aspectRatio = "4/3";
      cameraPreviewContainer.appendChild(previewImage);
    }
  } else {
    document.getElementById(`photoInput-${currentFieldIndex}`).value = tempPhotoData;

    document.getElementById(`photoInput-${currentFieldIndex}`).removeAttribute("data-url");  /////

    toggleBodyScroll();

    const field = document.getElementById(`field-${currentFieldIndex}`);
    const label = field.querySelector("label");
    document.getElementById("flashlightBtn").style.visibility = "visible";
    document.getElementById("switchCameraBtn").style.visibility = "visible";
    label.classList.remove("warning");
    const oldWarning = field.querySelector(".photo-warning");
    if (oldWarning) oldWarning.remove();

    field.querySelector('button[onclick^="viewPhoto"]').style.display =
      "inline-block";
    field.querySelector('button[onclick^="removePhoto"]').style.display =
      "inline-block";
    field.querySelector('button[onclick^="openCamera"]').innerText =
      "Retake Photo";

    tempPhotoData = null;
    stopCamera();
    modal.style.display = "none";

    // For Advisor Service Report
    if (typeof showNextCard === "function") {
      showNextCard(currentFieldIndex);
    }
  }
};


discardBtn.onclick = () => {
  if (!tempPhotoData) {
    // Case 1: Discard from camera modal BEFORE taking photo
    tempPhotoData = null;
    confirmBtn.innerText = "Take Photo";
    discardBtn.innerText = "Cancel";

    if (currentStream) {
      currentStream.getTracks().forEach((track) => track.stop());
      currentStream = null;
    }

    toggleBodyScroll();

    modal.style.display = "none";
    video.srcObject = null;
    video.style.display = "block";
    geoOverlay.style.display = "block";
    topControls.style.display = "flex";
    document.getElementById("flashlightBtn").style.visibility = "visible";
    document.getElementById("switchCameraBtn").style.visibility = "visible";

    const existingPreview = cameraPreviewContainer.querySelector("img");
    if (existingPreview && existingPreview.id === "cameraPreviewImage") {
      existingPreview.remove();
    }
  } else {
    // Case 2: Discard from image preview AFTER photo was taken
    tempPhotoData = null;
    confirmBtn.innerText = "Take Photo";
    discardBtn.innerText = "Cancel";
    geoOverlay.style.display = "block";
    topControls.style.display = "flex";
    document.getElementById("flashlightBtn").style.visibility = "visible";
    document.getElementById("switchCameraBtn").style.visibility = "visible";
    video.style.display = "block";

    const existingPreview = cameraPreviewContainer.querySelector("img");
    if (existingPreview && existingPreview.id === "cameraPreviewImage") {
      existingPreview.remove();
    }

    // Ensure video stream is running
    if (!currentStream) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: currentFacingMode } })
        .then((stream) => {
          currentStream = stream;
          video.srcObject = stream;
          updateLiveOverlay();
        })
        .catch((err) => {
          showManualAlert("Error accessing camera: " + err.message);
        });
    }
  }
};

// ////////////////////////////////////////////////////////////////////////////////////

// For landscape

function updateCameraModalOrientation() {
  if (modal.style.display === "flex") {
    const isLandscape = window.matchMedia("(orientation: landscape)").matches;
    if (isLandscape) {
      modal.classList.add("landscape");
    } else {
      modal.classList.remove("landscape");
    }

  }
}

window.addEventListener("orientationchange", () => {
  updateCameraModalOrientation();
  updateLiveOverlay();
});

window.addEventListener("resize", () => {
  updateCameraModalOrientation();
  updateLiveOverlay();
});

// Call when camera is opened
const originalOpenCamera = openCamera;
openCamera = async function (index) {
  await originalOpenCamera.call(this, index);
  updateCameraModalOrientation();
};


// ////////////////////////////////////////////////////////////////////////////////////

// FOR CAPTURED IMAGE PREVIEW

function stopCamera() {
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
    currentStream = null;
  }
  // Always try to turn off torch on stop
  if (torchTrack && torchSupported) {
    try { torchTrack.applyConstraints({ advanced: [{ torch: false }] }); } catch (e) {}
  }
  torchTrack = null;
  flashlightOn = false;
  torchSupported = false;
  video.srcObject = null;
  video.style.display = "block";
  // Remove preview
  const existingPreview = cameraPreviewContainer.querySelector("img");
  if (existingPreview && existingPreview.id === "cameraPreviewImage") existingPreview.remove();
  if (window.geoInterval) {
    clearInterval(window.geoInterval);
    window.geoInterval = null;
  }
}

function drawOverlay() {
  const { lat, lng, address, city, state, country, timestamp } = currentData;
  const regNo = vehicleNoInput ? vehicleNoInput.value : "";

  // 1. Tighter font/padding values for a compact overlay
  const fontLargePx = Math.round(canvas.height * 0.035); // 2.5% of height (was 5%)
  const fontSmallPx = Math.round(canvas.height * 0.026); // 1.8% of height (was 3.7%)
  const fontLarge = `bold ${fontLargePx}px Arial`;
  const fontSmall = `${fontSmallPx}px Arial`;
  const paddingX = Math.round(canvas.width * 0.03); // was 0.03
  const paddingY = Math.round(canvas.height * 0.024); // was 0.025
  const lineSpacing = Math.round(canvas.height * 0.012); // was 0.009

  // PRE-calculate lines for correct overlay height
  const ctxFont = ctx.font;
  ctx.font = fontLarge;
  const cityLine = [city, state, country].filter(Boolean).join(", ");
  let lines = [cityLine];
  ctx.font = fontSmall;
  const addressLines = wrapTextCanvas(
    ctx,
    address,
    canvas.width - 2 * paddingX
  );
  
  lines = lines.concat(addressLines);
  lines.push(`Lat: ${lat?.toFixed(6)}, Lng: ${lng?.toFixed(6)}`);
  lines.push(`${timestamp} GMT +05:30`);

  // Total overlay height calculation
  const totalHeight =
    paddingY * 2 +
    fontLargePx +
    addressLines.length * (fontSmallPx + lineSpacing) +
    1.5 * (fontSmallPx + lineSpacing);

  // Draw overlay background
  ctx.font = ctxFont;
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.72)";
  ctx.fillRect(0, canvas.height - totalHeight, canvas.width, totalHeight);

  // Draw each line
  let y = canvas.height - totalHeight + paddingY;
  ctx.fillStyle = "#fff";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.font = fontLarge;
  ctx.fillText(cityLine, paddingX, y);
  y += fontLargePx + lineSpacing;
  ctx.font = fontSmall;
  for (const line of addressLines) {
    ctx.fillText(line, paddingX, y);
    y += fontSmallPx + lineSpacing;
  }
  ctx.fillText(`Lat: ${lat?.toFixed(6)}, Lng: ${lng?.toFixed(6)}`, paddingX, y);
  y += fontSmallPx + lineSpacing;
  ctx.fillText(`${timestamp} GMT +05:30`, paddingX, y);
  y += fontSmallPx + lineSpacing;
  ctx.restore();
}

function wrapTextCanvas(ctx, text, maxWidth) {
  if (!text) return [""];
  const words = text.split(" ");
  let lines = [];
  let line = "";
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      lines.push(line.trim());
      line = words[n] + " ";
    } else {
      line = testLine;
    }
  }
  if (line.trim() !== "") lines.push(line.trim());
  return lines;
}


// Helper function to wrap text in canvas
function wrapText(context, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  let lineCount = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const testWidth = context.measureText(testLine).width;
    if (testWidth > maxWidth && n > 0) {
      context.fillText(line.trim(), x, y);
      line = words[n] + " ";
      y += lineHeight;
      lineCount++;
    } else {
      line = testLine;
    }
  }
  if (line.trim() !== "") {
    context.fillText(line.trim(), x, y);
    lineCount++;
  }
  return lineCount;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// VIEW PHOTO BUTTON

function viewPhoto(index) {
  const input = document.getElementById(`photoInput-${index}`);
  const base64 = input.value;
  const url = input.dataset.url;

  if (base64 && base64.startsWith("data:image")) {
      popupImg.src = base64;
  } else if (url) {
      popupImg.src = url;
  } else {
      showManualAlert("No photo available to view.");
      return;
  }

  photoPopup.style.display = "flex";
  toggleBodyScroll();
}

closePopupBtn.onclick = () => {
  photoPopup.style.display = "none";
  toggleBodyScroll();
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// REMOVE PHOTO BUTTON

function removePhoto(index) {
  openConfirmModal({
    message: "Remove the Image?",
    yesConfirmBtn_label: "YES",
    noConfirmBtn_label: "NO",
    onConfirm: function () {

      const input = document.getElementById(`photoInput-${index}`);
      input.value = "";

      // ✅ Only delete dataset.url if it exists
      if (input.dataset && input.dataset.url) {
        delete input.dataset.url;
      }

      const field = document.getElementById(`field-${index}`);
      field.querySelector('button[onclick^="viewPhoto"]').style.display = "none";
      field.querySelector('button[onclick^="removePhoto"]').style.display = "none";
      field.querySelector('button[onclick^="openCamera"]').innerText = "Click Photo";
      toggleBodyScroll();
    },
  });
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// IMAGE COMPRESSION

// Helper: Compress DataURL to max 300kb with best clarity and resolution
function compressImage(dataUrl, maxSize = 200 * 1024, mimeType = "image/jpeg") {
  return new Promise((resolve, reject) => {
    let img = new Image();
    img.onload = function () {
      // Draw original to canvas
      let canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      let ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      // Quality binary search
      let quality = 0.95,
        step = 0.05,
        minQ = 0.6;
      let resultUrl = "";
      function tryCompress() {
        resultUrl = canvas.toDataURL(mimeType, quality);
        // If still > maxSize and can reduce more
        if (resultUrl.length > maxSize * 1.35 && quality > minQ) {
          quality -= step;
          tryCompress();
        } else {
          resolve(resultUrl);
        }
      }
      tryCompress();
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// TO FETCH LOCATION

function getComponent(components, type) {
  const comp = components.find((c) => c.types.includes(type));
  return comp ? comp.long_name : "";
}

// Haversine formula in meters
function getDistanceInMeters(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

async function reverseGeocode(lat, lng) {
  try {
    const response = await fetch("/reverse-geocode/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat, lng }),
    });

    if (!response.ok) {
      console.error("Backend error:", response.status);
      return null;
    }

    const data = await response.json();
    if (data.results?.length > 0) {
      return data.results[0]; // <- this is correct
    }
    return null;
  } catch (err) {
    console.error("Network error:", err);
    return null;
  }
}



function isOnline() {
    return navigator.onLine;
}

async function initMap() {
    // 1. Prevent double entry
    if (isInitMapRunning) return;
    isInitMapRunning = true;

    try {
        // 2. Check internet
        if (!isOnline()) {
            showManualAlert("No internet connection. Please check your connection and try again.");
            geoOverlay.innerHTML = `
                        <div style="font-size: 1.2rem; color: #ff0000ff; font-weight: bold; text-shadow: 1px 1px 6px #000a; padding:1.5em;">
                          No Internet Connection…
                        </div>
            `;
            return;
        }

        // 3. Check geolocation support
        if (!("geolocation" in navigator)) {
            showManualAlert("Location services not supported by your browser/device.");
            geoOverlay.innerHTML = `
                        <div style="font-size: 1.2rem; color: #ff0000ff; font-weight: bold; text-shadow: 1px 1px 6px #000a; padding:1.5em;">
                          Location Service Not Supported…
                        </div>
            `;
            return;
        }

        // 4. Get current position
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                // 5. If previous location present, compare
                if (lastFetchedLocation && lastFetchedLocation.lat && lastFetchedLocation.lng) {
                    const distance = getDistanceInMeters(
                        lastFetchedLocation.lat,
                        lastFetchedLocation.lng,
                        lat,
                        lng
                    );

                    if (distance < 400) {
                        // Less than 400m, do not update
                        isInitMapRunning = false;
                        return;
                    }
                }

                // 6. Call reverse geocoding API
                geoOverlay.innerHTML = `
                        <div style="font-size: 1.2rem; color: #ffe600; font-weight: bold; text-shadow: 1px 1px 6px #000a; padding:1.5em;">
                          📡 Fetching location…
                        </div>
                `;
                const addressResult = await reverseGeocode(lat, lng);
                if (addressResult) {
                    // Store new position and address
                    lastFetchedLocation = { lat, lng };
                    lastFetchedAddress = addressResult;

                    // Populate your global location data
                    currentData.lat = lat;
                    currentData.lng = lng;

                    const components = addressResult.address_components;
                    currentData.address = addressResult.formatted_address;
                    currentData.city = getComponent(components, "locality") || getComponent(components, "administrative_area_level_2") || "";
                    currentData.state = getComponent(components, "administrative_area_level_1") || "";
                    currentData.pincode = getComponent(components, "postal_code") || "";
                    currentData.country = getComponent(components, "country") || "";
                    updateLiveOverlay();

                } else {
                    showManualAlert("Address could not be fetched. Please check your connection.");
                    geoOverlay.innerHTML = `
                        <div style="font-size: 1.2rem; color: #ff0000ff; font-weight: bold; text-shadow: 1px 1px 6px #000a; padding:1.5em;">
                          Address Not Found…
                        </div>
                    `;
                }

                isInitMapRunning = false;
            },
            (error) => {
                // Location fetch failed (GPS off or not allowed)
                let msg = "";
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        msg = "Location access denied. Please allow location access.";
                        geoOverlay.innerHTML = `
                                <div style="font-size: 1.2rem; color: #ffe600; font-weight: bold; text-shadow: 1px 1px 6px #000a; padding:1.5em;">
                                  No Location Access…
                                </div>
                        `;    
                        break;
                    case error.POSITION_UNAVAILABLE:
                        msg = "Location unavailable. Make sure your device location is turned ON.";
                        geoOverlay.innerHTML = `
                                <div style="font-size: 1.2rem; color: #ffe600; font-weight: bold; text-shadow: 1px 1px 6px #000a; padding:1.5em;">
                                  No Location Access…
                                </div>
                        `;    
                        break;
                    case error.TIMEOUT:
                        initMap();
                        break;
                    default:
                        msg = "Unknown error while fetching location.";
                        geoOverlay.innerHTML = `
                                <div style="font-size: 1.2rem; color: #ffe600; font-weight: bold; text-shadow: 1px 1px 6px #000a; padding:1.5em;">
                                  Error Fetching Location…
                                </div>
                        `;  
                        break;
                }
                showManualAlert(msg);
                isInitMapRunning = false;
            },
            { enableHighAccuracy: true, timeout: 45000, maximumAge: 0 }
        );
    } catch (err) {
        showManualAlert("Unexpected error occurred while fetching location.");
        isInitMapRunning = false;
    }
}

initMap();

window.addEventListener('focus', () => initMap());
window.addEventListener('online', () => initMap());

window.addEventListener('offline', () => {
    showManualAlert("You are offline. Please check your internet connection.");
    geoOverlay.innerHTML = `
            <div style="font-size: 1.2rem; color: #ff0000ff; font-weight: bold; text-shadow: 1px 1px 6px #000a; padding:1.5em;">
              No Internet Connection…
            </div>
    `;    
});
