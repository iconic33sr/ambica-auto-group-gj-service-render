let currentFieldIndex = null;
let currentStream = null;
let currentFacingMode = "environment";
let flashlightOn = false;
let torchSupported = false;
let torchTrack = null;
let tempPhotoData = null;

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
canvas.width = 1280;
canvas.height = 960;
const ctx = canvas.getContext("2d");
const modal = document.getElementById("cameraModal");
const confirmBtn = document.getElementById("confirmPhoto");
const discardBtn = document.getElementById("discardPhoto");
const topControls = document.getElementById("cameraTopControls");
const photoPopup = document.getElementById("photoPopup");
const popupImg = document.getElementById("popupImg");
const closePopupBtn = document.getElementById("closePopup");
const cameraPreviewContainer = document.getElementById("cameraPreviewContainer");

let availableVideoDevices = [];
let preferredRearDeviceId = null;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

                                                        // CLICK PHOTO BUTTON - CAMERA PREVIEW PAGE

// Using this function macro camera is being used for default so we use the above code to use the primary camera
async function openCamera(index) {
  currentFieldIndex = index;
  modal.style.display = "flex";
  confirmBtn.innerText = "Take Photo";
  discardBtn.innerText = "Cancel";
  tempPhotoData = null;
  topControls.style.display = "flex";
  document.getElementById("flashlightBtn").style.visibility = "visible";
  document.getElementById("switchCameraBtn").style.visibility = "visible";
  video.style.display = "block";
  toggleBodyScroll();

  // Remove any existing preview image
  const existingPreview = cameraPreviewContainer.querySelector("img");
  if (existingPreview) {
    existingPreview.remove();
  }

  try {
    const width = 1280;
    const height = 960;

    currentStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: currentFacingMode, width, height },
    });

    video.srcObject = currentStream;

    const track = currentStream.getVideoTracks()[0];
    const capabilities = track.getCapabilities ? track.getCapabilities() : {};
    torchSupported = !!capabilities.torch;
    torchTrack = torchSupported ? track : null;

    const flashlightBtn = document.getElementById("flashlightBtn");
    if (torchSupported) {
        flashlightBtn.style.display = "inline-block";
        flashlightBtn.innerText = flashlightOn ? "💡" : "🔦";
    } else {
        flashlightBtn.style.display = "none";
    }

  } catch (err) {
    alert("Camera error: " + err);
  }

}

async function switchCamera() {
  currentFacingMode =
    currentFacingMode === "environment" ? "user" : "environment";
  stopCamera();
  try {
    currentStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: currentFacingMode },
    });
    video.srcObject = currentStream;
  } catch (err) {
    alert("Camera switch error: " + err);
  }
}


document.getElementById("flashlightBtn").onclick = async function() {
    if (!torchSupported || !torchTrack) {
        alert("Flashlight not supported on your device/browser.");
        return;
    }
    flashlightOn = !flashlightOn;
    try {
        await torchTrack.applyConstraints({ advanced: [{ torch: flashlightOn }] });
        this.innerText = flashlightOn ? "💡" : "🔦";
    } catch (err) {
        alert("Could not toggle flashlight: " + err.message);
    }
};


confirmBtn.onclick = () => {
  if (!tempPhotoData) {
    // Try ImageCapture first
    const track = currentStream.getVideoTracks()[0];
    if (window.ImageCapture) {
      try {
        const imageCapture = new ImageCapture(track);
        imageCapture.grabFrame().then((bitmap) => {
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          ctx.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height);
          tempPhotoData = canvas.toDataURL("image/png");
          showPreviewImage(tempPhotoData);
        }).catch(() => {
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
      } catch(e) {}
      canvas.width = settings.width;
      canvas.height = settings.height;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      tempPhotoData = canvas.toDataURL("image/png");
      showPreviewImage(tempPhotoData);
    }

    function showPreviewImage(dataURL) {
      confirmBtn.innerText = "Confirm";
      discardBtn.innerText = "Retake";
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
    toggleBodyScroll();

    const field = document.getElementById(`field-${currentFieldIndex}`);
    const label = field.querySelector("label");
    document.getElementById("flashlightBtn").style.visibility = "visible";
    document.getElementById("switchCameraBtn").style.visibility = "visible";
    label.classList.remove("warning");
    const oldWarning = field.querySelector(".photo-warning");
    if (oldWarning) oldWarning.remove();

    field.querySelector('button[onclick^="viewPhoto"]').style.display = "inline-block";
    field.querySelector('button[onclick^="removePhoto"]').style.display = "inline-block";
    field.querySelector('button[onclick^="openCamera"]').innerText = "Retake Photo";

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
        })
        .catch((err) => {
          alert("Error accessing camera: " + err.message);
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
});

window.addEventListener("resize", () => {
  updateCameraModalOrientation();
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
    currentStream.getTracks().forEach((track) => track.stop());
    currentStream = null;
  }
  if (torchTrack && torchSupported) {
    try {
        torchTrack.applyConstraints({ advanced: [{ torch: false }] });
    } catch (e) {}
  }
  torchTrack = null;
  flashlightOn = false;
  torchSupported = false;

  video.srcObject = null;
  video.style.display = "block"; // Ensure video is shown when reopening
  // Remove any displayed image
  const existingPreview = cameraPreviewContainer.querySelector("img");
  if (existingPreview && existingPreview.id === "cameraPreviewImage") {
    existingPreview.remove();
  }
  if (window.geoInterval) {
    clearInterval(window.geoInterval);
    window.geoInterval = null;
  }
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

                                                        // VIEW PHOTO BUTTON

function viewPhoto(index) {
  const dataURL = document.getElementById(`photoInput-${index}`).value;
  if (!dataURL || !dataURL.startsWith("data:image")) {
    alert("No photo available to view.");
    return;
  }
  popupImg.src = dataURL;
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
    onConfirm: function() {
      document.getElementById(`photoInput-${index}`).value = "";
      const field = document.getElementById(`field-${index}`);
      field.querySelector('button[onclick^="viewPhoto"]').style.display = "none";
      field.querySelector('button[onclick^="removePhoto"]').style.display = "none";
      field.querySelector('button[onclick^="openCamera"]').innerText = "Click Photo";
      toggleBodyScroll();
    }
  });
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

                                                        // IMAGE COMPRESSION

// Helper: Compress DataURL to max 100kb with best clarity and resolution
function compressImage(dataUrl, maxSize = 200 * 1024, mimeType = 'image/jpeg') {
    return new Promise((resolve, reject) => {
        let img = new Image();
        img.onload = function () {
            // Draw original to canvas
            let canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            let ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            // Quality binary search
            let quality = 0.95, step = 0.05, minQ = 0.6;
            let resultUrl = '';
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
