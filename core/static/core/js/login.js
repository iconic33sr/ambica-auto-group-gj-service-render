const login_form = document.getElementById("login_form");

login_form.addEventListener('keydown', (event) => {

    if (event.key === 'Enter') {
        
        const element = document.activeElement.id; 

        event.preventDefault();  // To prevent Enter key for submitting the form 

        if (element == "id_username"){   

            if (document.getElementById("id_username").value != ""){

                if (document.getElementById("id_password").value != ""){

                    document.getElementById("login_btn").click();

                } else {

                    document.getElementById("id_password").focus();

                }
            
            } else {

                document.getElementById("id_username").focus();

            }

        } else if (element == "id_password"){   

            if (document.getElementById("id_password").value != ""){

                if (document.getElementById("id_username").value != ""){

                    document.getElementById("login_btn").click();

                } else {

                    document.getElementById("id_username").focus();

                }

            }else {

                document.getElementById("id_password").focus();

            }

        } 

    }

});


// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
// To restrict zoom in for mobiles and tablets
if ('ontouchstart' in document.documentElement) {
    const meta = document.querySelector('meta[name=viewport]');
    if (meta) {
      meta.setAttribute(
        'content','width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
      );
    }
}


// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
document.addEventListener("DOMContentLoaded", function () {

    document.getElementById("login_btn").addEventListener("click", async function (e) {
        e.preventDefault();

        if (!navigator.onLine) {
        showManualAlert("⚠️ No / Poor internet connection.");
        return false;
        }

        // Prevent double submit
        this.disabled = true;

        const form = document.getElementById('login_form');

        if (form.checkValidity()) {

            function isMobileDevice() {
                return /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent);
            }


            if (isMobileDevice()){
                document.getElementById("formSubmittingOverlay").style.display = "flex";
                document.getElementById("submitting-text").innerHTML = "Checking Location...";

                if (!("geolocation" in navigator)) {
                        showManualAlert("Geolocation is not supported by your device or browser.");
                        this.disabled = false;
                        return;
                    }
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            // Success! 
                            document.getElementById("formSubmittingOverlay").style.display = "flex";
                            document.getElementById("submitting-text").innerHTML = "Signing In...";
                            form.submit();

                        },
                        (error) => {
                            document.getElementById("formSubmittingOverlay").style.display = "none";
                            let msg = "";
                            switch (error.code) {
                                case error.PERMISSION_DENIED:
                                case error.POSITION_UNAVAILABLE:
                                    msg = "Location is OFF or not accessible. Please turn ON location.";
                                    break;
                                case error.TIMEOUT:
                                    msg = "Timed out. Please try again.";
                                    break;
                                default:
                                    msg = "Unable to fetch location. Please ensure location is enabled.";
                            }
                            showManualAlert(msg);
                            this.disabled = false;
                            return;
                        },
                        { enableHighAccuracy: false, timeout: 15000, maximumAge: 0 }
                    );


            } else {

                document.getElementById("formSubmittingOverlay").style.display = "flex";
                document.getElementById("submitting-text").innerHTML = "Signing In...";

                form.submit();

            }
        
        } else {
            form.reportValidity();
            this.disabled = false; // <-- re-enable for correction
        }
    });
});

