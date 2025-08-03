function toggleNav() {
    // You can tweak this value if you want the breakpoint different
    const isMobile = window.innerWidth <= 768;

    document.getElementById('left').style.display = isMobile ? 'none' : 'flex';
    document.getElementById('right').style.display = isMobile ? 'none' : 'flex';
    document.getElementById('menubar').style.display = isMobile ? 'flex' : 'none';
    document.getElementById('hamburger').style.display = isMobile ? 'block' : 'none';
}

// Call on load
window.addEventListener('DOMContentLoaded', toggleNav);
// Call on resize
window.addEventListener('resize', toggleNav);