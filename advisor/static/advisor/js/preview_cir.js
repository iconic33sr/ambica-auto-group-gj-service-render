document.addEventListener("DOMContentLoaded", function () {

    // Displaying red notification dot if revision report exists ///////////////////////////////
    const no_of_revision_report = JSON.parse(document.getElementById('no_of_revision_reportJSON').textContent);

    if (parseInt(no_of_revision_report, 10) > 0){

        if (window.getComputedStyle(document.getElementById('wm_dot')).display === "none"){
            document.getElementById('wm_dot').style.display = "inline-block";

        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////
    // For Edit_Cir Button 
    document.getElementById("edit_cir_btn").addEventListener("click", async function (e) {

        document.getElementById("formSubmittingOverlay").style.display = "flex";
        document.getElementById("submitting-text").innerHTML = "Loading Page...";

    });

    ////////////////////////////////////////////////////////////////////////////////////////////////
    // For Service_Report Button 
    document.getElementById("service_report_btn").addEventListener("click", async function (e) {

        document.getElementById("formSubmittingOverlay").style.display = "flex";
        document.getElementById("submitting-text").innerHTML = "Loading Page...";

    });


});