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
    // Chrome, Edge, Android, iOS, desktop PWA (all cases)
    return (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: minimal-ui)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        window.matchMedia('(display-mode: window-controls-overlay)').matches ||
        window.navigator.standalone === true || // iOS
        window.matchMedia('(display-mode: browser)').matches === false || // Some desktop browsers
        document.referrer.startsWith('android-app://') ||
        localStorage.getItem('pwa_installed') === 'yes'
    );
}

if (!isInStandaloneMode()) {
    localStorage.removeItem('pwa_installed');
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
        console.log("clicked");
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

// Listen for PWA installation event (works for Chrome/Edge)
window.addEventListener('appinstalled', () => {
    localStorage.setItem('pwa_installed', 'yes');
    showInstalledMsg();
});

// Show installed message if already in app
window.addEventListener('appinstalled', showInstalledMsg);

// Page load behavior
window.addEventListener('load', () => {
    if (isInStandaloneMode()) {
        showInstalledMsg();
    } else if (isSafariOniOS() || isSafariOnMac()) {
        showSafariGuide();
    } else {
        showInstallBtn();
    }
});
