// Search Functionality
const input = document.getElementById('cir_search_input');
const clearBtn = document.getElementById('cir_search_clear');

function filterCards() {
    const cards = document.querySelectorAll('.cards_cont .manual_card');
    const searchTerm = input.value.trim().toLowerCase();
    let anyVisible = false;

    cards.forEach(card => {
        const vehicleNo = card.querySelectorAll('.report_heading')[0]?.textContent.trim().toLowerCase() || '';
        const jobNo = card.querySelectorAll('.report_heading')[1]?.textContent.trim().toLowerCase() || '';

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


function handleWmReturnedReportSocketMessage(e) {
    const message = e.detail;

    // ADD (revision)
    if (message.action === "add" && message.data.report_type === "revision") {
        const data = message.data || message;

        // Remove existing card for this cir_uid to avoid duplicates
        let existingCard = document.querySelector(`[data-cir-uid="${data.cir_uid}"]`);
        if (existingCard) {
            existingCard.remove();
        }

        if (document.getElementById("no_pending_cir_heading")) {
            document.getElementById("no_pending_cir_heading").style.display = "none";
        }

        let card = document.createElement('div');
        card.className = "manual_card";
        if (data.advisor_preview === "pending") {
            card.style.backgroundColor = "rgb(255, 150, 150)";
        }
        card.setAttribute('data-cir-date', convertISOToHuman(data.cir_date_time));
        card.setAttribute('data-cir-uid', data.cir_uid);

        card.innerHTML = `
            <div class="report_heading_cont">
                <div class="report_heading">${data.vehicle_no}</div>
                <div class="report_heading normal_text">${data.job_no}</div>
            </div>
            <div class="report_sub_heading_cont"><div>${data.supervisor_name}</div></div>
            <div class="report_sub_heading_cont"><div>${formatToDisplayDate(data.cir_date_time)}</div></div>
            <div class="field_buttons" style="justify-content: center;">
                <form method="get" action="/advisor/revise_detail/${data.cir_uid}/">
                    <button class="primary_btn">VIEW REPORT</button>
                </form>
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
    }

    // REMOVE (revision)
    if (message.action === "remove" && message.data.report_type === "revision") {
        const cir_uid = message.data.cir_uid;
        let card = document.querySelector(`[data-cir-uid="${cir_uid}"]`);
        if (card) {
            card.remove();
        }

        if (document.querySelectorAll('.manual_card').length === 0) {
            if (document.getElementById("no_pending_cir_heading")) {
                document.getElementById("no_pending_cir_heading").style.display = "";
            }
        }
    }
}

window.removeEventListener("WebSocketMessage", handleWmReturnedReportSocketMessage);
window.addEventListener("WebSocketMessage", handleWmReturnedReportSocketMessage);