////////////////////////////////////////////////////////////////////////////////////////////////////////
// Search Functionality
const input = document.getElementById('cir_search_input');
const clearBtn = document.getElementById('cir_search_clear');

function filterCards() {
    const cards = document.querySelectorAll('.cards_cont .manual_card');
    const searchTerm = input.value.trim().toLowerCase();
    let anyVisible = false;

    cards.forEach(card => {
        const jobNo = card.querySelectorAll('.report_heading')[0]?.textContent.trim().toLowerCase() || '';
        const vehicleNo = card.querySelectorAll('.report_heading')[1]?.textContent.trim().toLowerCase() || '';

        if (!searchTerm || jobNo.includes(searchTerm) || vehicleNo.includes(searchTerm)) {
            card.style.display = '';
            anyVisible = true;
        } else {
            card.style.display = 'none';
        }
    });

    // Optionally, show/hide "No Pending CIR" message
    const noCirMsg = document.getElementById('no_pending_cir_heading');
    if (noCirMsg) {
        noCirMsg.style.display = anyVisible ? 'none' : '';
    }
}

input.addEventListener('input', filterCards);

clearBtn.addEventListener('click', function() {
    input.value = '';
    filterCards();
    input.focus();
});


////////////////////////////////////////////////////////////////////////////////////////////////////////
// Again reconnecting the socket on windows.onfocus and windows.online

function connectSocket() {
    if (!navigator.onLine || (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING))) {
        return;
        }
    location.reload(); // Reload on cir_list page // Uncomment this

}

// On focus
window.addEventListener("focus", connectSocket);

// On online
window.addEventListener("online", connectSocket);

////////////////////////////////////////////////////////////////////////////////////////////////////////

socket.addEventListener("message", function(event) {
    const message = JSON.parse(event.data);

    // ADD card (workshop manager or other)
    if (message.action === "add" || message.data.report_type === "new" || message.data.report_type === "revision") {
        const data = message.data || message;

        // Remove existing card for this cir_uid to avoid duplicates
        let existingCard = document.querySelector(`[data-cir-uid="${data.cir_uid}"]`);
        if (existingCard) {
            existingCard.remove();
        }

        if(document.getElementById("no_pending_cir_heading")){
            document.getElementById("no_pending_cir_heading").style.display = "none";
        }

        let card = document.createElement('div');
        card.className = "manual_card";
        card.style.backgroundColor = "rgb(255, 150, 150)";
        card.setAttribute('data-cir-date', convertISOToHuman(data.cir_date_time));
        card.setAttribute('data-cir-uid', data.cir_uid);

        card.innerHTML = `
            <div class="report_heading_cont">
                <div class="report_heading normal_text" id="job_no_cont">${data.job_no}</div>
                <div class="report_heading" id="vehicle_no_cont">${data.vehicle_no}</div>
            </div>

            <div class="report_heading_cont">
                <div class="report_sub_heading"><div>${data.supervisor_name}<span class="name_label"> (Supervisor) </span></div></div>
                <div class="report_sub_heading"><div>${formatToDisplayDate(data.cir_date_time)}</div></div>
            </div>

            <div class="report_heading_cont">
                <div class="report_sub_heading"><div>${data.advisor_name}<span class="name_label"> (Advisor) </span></div></div>
                <div class="report_sub_heading"><div>${formatToDisplayDate(data.sar_date_time)}</div></div>
            </div>

            <div class="field_buttons">
                <form method="get" class="preview_cir_btn" action="/workshop_manager/preview_cir/${data.cir_uid}/">
                    <button class="primary_btn" style="margin:auto;">PREVIEW CIR</button>
                </form>

                ${data.report_type === "revision"
                    ? `<div class="revised_report" style="color:rgb(132, 0, 255); border: 1px solid rgb(132, 0, 255)">Revised Report</div>`
                    : ""
                }
            </div>
        `;

        const parent = document.querySelector('.cards_cont');
        const cards = parent.querySelectorAll('.manual_card');
        const newCardDate = convertISOToHuman(data.cir_date_time);

        let inserted = false;
        for (let i = 0; i < cards.length; i++) {
            const cardDate = cards[i].getAttribute('data-cir-date');
            if (parseCustomDate(newCardDate) < parseCustomDate(cardDate)) {
                parent.insertBefore(card, cards[i]);
                inserted = true;
                break;
            }
        }
        if (!inserted) {
            parent.appendChild(card);
        }
        filterCards();
    }

    // REMOVE card
    if (message.action === "remove") {
        const cir_uid = message.data.cir_uid;
        let card = document.querySelector(`[data-cir-uid="${cir_uid}"]`);
        if (card) {
            card.remove();
        }

        // If no cards left, show the "No Pending CIR" message
        if(document.querySelectorAll('.manual_card').length === 0){
            if(document.getElementById("no_pending_cir_heading")){
                document.getElementById("no_pending_cir_heading").style.display = "";
            }
        }
    }
});
