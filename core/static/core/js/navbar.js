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

      const form = document.getElementById('logout_form');
      
      
      // 👇 Only unsubscribe for specific designations [For push_api]
      // const userDesignation = document.body.dataset.userDesignation;
      // const pushAllowedDesignations = ["advisor", "workshop_manager", "claim_manager"];
      
      // if (pushAllowedDesignations.includes(userDesignation)) {
      //   try {
      //     await unsubscribePush();  // safely attempt
      //   } catch (error) {
        //     console.warn("Unsubscribe failed or not needed:", error);
        //   }
        // }
        
      document.getElementById("formSubmittingOverlay").style.display = "flex";
      document.getElementById("submitting-text").innerHTML = "Logging Out...";
      
      form.submit();
    });


    if (document.getElementById("logout_btn_mobile")){
    document.getElementById("logout_btn_mobile").addEventListener("click", async function (e) {
        e.preventDefault();

        const form = document.getElementById('logout_form_mobile');
        
        // 👇 Only unsubscribe for specific designations [For push_api]
        // const userDesignation = document.body.dataset.userDesignation;
        // const pushAllowedDesignations = ["advisor", "workshop_manager", "claim_manager"];

        // if (pushAllowedDesignations.includes(userDesignation)) {
        //   try {
        //     unsubscribePush(userId);  // safely attempt
        //   } catch (error) {
        //     console.warn("Unsubscribe failed or not needed:", error);
        //   }
        // }

        document.getElementById("formSubmittingOverlay").style.display = "flex";
        document.getElementById("submitting-text").innerHTML = "Logging Out...";

        form.submit();

    });
    }
    
});