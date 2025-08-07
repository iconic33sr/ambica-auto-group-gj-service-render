// To restrict zoom in for mobiles and tablets
if ('ontouchstart' in document.documentElement) {
    const meta = document.querySelector('meta[name=viewport]');
    if (meta) {
      meta.setAttribute(
        'content','width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
      );
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// For Manual Advisor Popup Confirmation Box
let confirmWMCallback = null;

// Opens the modal and sets the message and confirm action
function openAdvisorConfirmModal({ confirmWMBtn_label, cancelWMBtn_label, message, onConfirm }) {
  toggleBodyScroll();
  document.getElementById('confirmWMMessage').textContent = message || "Are you sure?";
  document.getElementById('confirmWMOverlay').style.display = 'flex';
  document.getElementById('confirmWMBtn').innerHTML = confirmWMBtn_label;
  document.getElementById('cancelWMBtn').innerHTML = cancelWMBtn_label;
  confirmWMCallback = onConfirm || null;
}

// Bind modal buttons
if (document.getElementById('confirmWMBtn')) {
  document.getElementById('confirmWMBtn').onclick = function () {
    document.getElementById('confirmWMOverlay').style.display = 'none';
    if (typeof confirmWMCallback === "function") confirmWMCallback();
    confirmWMCallback = null;
};
}

if (document.getElementById('cancelWMBtn')) {
  document.getElementById('cancelWMBtn').onclick = function () {
    document.getElementById('confirmWMOverlay').style.display = 'none';
    confirmWMCallback = null;
    toggleBodyScroll();


setTimeout(function() {
  window.location.href = wmReturnedReportUrl;
}, 50);

};
}

// ////////////////////////////////////////////////////////////////////////
// Again reconnecting the socket on windows.onfocus and windows.online

// For checking if the user gets focus on cir_list page so we can directly reload the page
function isCirListPage() {
    return window.location.pathname.includes("complaint_information_report_list");
}

function isWmReturnedReport() {
    return window.location.pathname.includes("wm_returned_report");
}

let reconnecting = false;

async function connectSocket() {
    if (!navigator.onLine || (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING))) {
        return;
        }

    if (isCirListPage() || isWmReturnedReport()) {
      location.reload(); // Reload only if on cir_list page // Uncomment this

    } else{
      if (reconnecting){
        return;  
      }

      reconnecting = true;
      socket = new WebSocket(wsUrl);

      socket.onmessage = function (event) {
        const data = JSON.parse(event.data);
        const customEvent = new CustomEvent("WebSocketMessage", { detail: data });
        window.dispatchEvent(customEvent);
      };

      socket.onopen = function() { reconnecting = false; };
      socket.onclose = function() { reconnecting = false; };

      // Fetching the number of revision report
      const response = await fetch(`/advisor/get_revision_report_nos/`);
      const result = await response.json();

      if (result.status === "success"){
        if (result.revision_report_nos > 0) {
          if (document.getElementById('wm_dot')) {
            if (window.getComputedStyle(document.getElementById('wm_dot')).display === "none"){
              document.getElementById('wm_dot').style.display = "inline-block";
            }
          } 
        }
      }

    }
}


function connectSocketOnLoad() {
    if (!navigator.onLine || (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING))) {
        return;
        }

    socket = new WebSocket(wsUrl);

    // Only this one socket.onmessage is used to send message everywhere, we are not using socket.onmessage everywhere directly because socket.onmessage will not work after reconnecting 
    // so we are using this concept
    socket.onmessage = function (event) {
      const data = JSON.parse(event.data);
      const customEvent = new CustomEvent("WebSocketMessage", { detail: data });
      window.dispatchEvent(customEvent);
    };

}



// On load
window.addEventListener("DOMContentLoaded", connectSocketOnLoad);

// On focus
window.addEventListener("focus", connectSocket);

// On online
window.addEventListener("online", connectSocket);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// For putting dot on wm, this is called namednamed handler function, it is being used here because we have this code in advisor_base.js file which 
//  is also being called in every page with their specific js file, so to remove the chances of duplication i.e calling window.addEventListener("WebSocketMessage", function (e) { ... });
//  multiple times in the same html page, we used this method. If we donot have any socket message code in advisor_base.js file then we can directly use window.addEventListener("WebSocketMessage", function (e) { ... });
// 
function handleBaseSocketMessage(e) {
  const data = e.detail;
  if (data.data.report_type === "revision"){
    if (document.getElementById('wm_dot')) {
      if (window.getComputedStyle(document.getElementById('wm_dot')).display === "none"){
        document.getElementById('wm_dot').style.display = "inline-block";
      }
    }
  }
  
  // if (data.data.report_type === "new"){
  //   showNativeNotification("📋 New CIR Received", `Job No: ${data.data.job_no} | Vehicle: ${data.data.vehicle_no}`);
  // }
}
window.removeEventListener("WebSocketMessage", handleBaseSocketMessage);
window.addEventListener("WebSocketMessage", handleBaseSocketMessage);