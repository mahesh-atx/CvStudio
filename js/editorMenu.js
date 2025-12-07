
// ==========================================
// 11. EDITOR MOBILE MENU TOGGLE
// ==========================================
document.addEventListener('click', (e) => {
    const menu = document.getElementById('editor-mobile-menu');
    const btn = e.target.closest('button');

    // If menu is open and click is outside menu and outside the toggle button
    if (menu && !menu.classList.contains('hidden')) {
        if (!menu.contains(e.target) && (!btn || !btn.querySelector('.fa-ellipsis-vertical'))) {
            menu.classList.add('hidden');
        }
    }
});
