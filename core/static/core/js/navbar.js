if (document.querySelector(".hamburger")){
  const mobileNav = document.querySelector(".hamburger");
  const navbar = document.querySelector(".menubar");

  const toggleNav = () => {
    navbar.classList.toggle("menu_active");
    if(navbar.classList.contains("menu_active")){
      document.getElementsByTagName("body")[0].style = "overflow:hidden"
    }else{
      document.getElementsByTagName("body")[0].style = "overflow:auto"
    };
    mobileNav.classList.toggle("hamburger-active");
  };
  mobileNav.addEventListener("click", () => toggleNav());
}

///////////////////////////////////////////////////////////////////////////////////////////////

document.addEventListener("DOMContentLoaded", function () {

    document.getElementById("logout_btn").addEventListener("click", async function (e) {
        e.preventDefault();

        form = document.getElementById('logout_form')

        document.getElementById("formSubmittingOverlay").style.display = "flex";
        document.getElementById("submitting-text").innerHTML = "Logging Out...";

        form.submit();

    });

    if (document.getElementById("logout_btn_mobile")){
    document.getElementById("logout_btn_mobile").addEventListener("click", async function (e) {
        e.preventDefault();

        form = document.getElementById('logout_form_mobile')

        document.getElementById("formSubmittingOverlay").style.display = "flex";
        document.getElementById("submitting-text").innerHTML = "Logging Out...";

        form.submit();

    });
    }
    
});