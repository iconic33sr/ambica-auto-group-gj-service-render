document.addEventListener("DOMContentLoaded", function () {

    // Binding keys with functionalities ///////////////////////////////////////
    const page_body = document.getElementById("body");

    page_body.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            event.preventDefault();  // To prevent Enter key for submitting the form 
                document.getElementById('back_btn').click(); 
        }
    });

});