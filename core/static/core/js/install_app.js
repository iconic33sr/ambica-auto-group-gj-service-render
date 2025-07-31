let deferredPrompt;
const installBtn = document.getElementById('pwaInstallButton');
const installedMsg = document.getElementById('appInstalledMsg');
const safariGuide = document.getElementById('safariInstallGuide');

// Helper functions
function showInstallBtn() {
    if (installBtn) installBtn.style.display = 'inline-block';
    if (installedMsg) installedMsg.style.display = 'none';
    if (safariGuide) safariGuide.style.display = 'none';
}

function showInstalledMsg() {
    if (installBtn) installBtn.style.display = 'none';
    if (installedMsg) installedMsg.style.display = 'block';
    if (safariGuide) safariGuide.style.display = 'none';
}

function showSafariGuide() {
    if (installBtn) installBtn.style.display = 'none';
    if (installedMsg) installedMsg.style.display = 'none';
    if (safariGuide) safariGuide.style.display = 'block';
}

// Device/platform checks
function isInStandaloneMode() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function isSafariOniOS() {
    return /iP(hone|od|ad)/.test(navigator.userAgent) &&
           /Safari/.test(navigator.userAgent) &&
           !/CriOS|FxiOS|EdgiOS/.test(navigator.userAgent);
}

function isSafariOnMac() {
    return navigator.userAgent.includes("Macintosh") &&
           navigator.userAgent.includes("Safari") &&
           !navigator.userAgent.includes("Chrome");
}

function isMobileDevice() {
    return /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent);
}

// Install prompt handler (for Chrome)
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallBtn();
});

// Install button click
if (installBtn) {
    installBtn.addEventListener('click', () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    if (isMobileDevice()) {
                        showInstalledMsg();
                    } else {
                        window.location.href = '/';
                    }
                }
                deferredPrompt = null;
                installBtn.style.display = 'none';
            });
        }
    });
}

// Show installed message if already in app
window.addEventListener('appinstalled', showInstalledMsg);

// Page load behavior
window.addEventListener('load', () => {
    if (isInStandaloneMode()) {
        showInstalledMsg();
    } else if (isSafariOniOS() || isSafariOnMac()) {
        showSafariGuide();
    }
});
