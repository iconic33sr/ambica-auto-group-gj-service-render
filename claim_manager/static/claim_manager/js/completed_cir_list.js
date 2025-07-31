
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
