// ==========================================
// CvStudio - UI Helpers Module
// Toast notifications, confetti, progress UI
// ==========================================

/**
 * Shows a toast notification
 * @param {string} message - Message to display
 * @param {string} type - 'success' or 'info'
 */
function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed bottom-5 right-5 flex flex-col gap-3 z-[100]';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const icon = type === 'success' ? '<i class="fa-solid fa-circle-check"></i>' : '<i class="fa-solid fa-circle-info"></i>';
    const colorClass = type === 'success' ? 'bg-green-500' : 'bg-blue-500';

    // Modern Toast Style
    toast.className = `${colorClass} text-white px-5 py-4 rounded-2xl shadow-xl flex items-center gap-3 transform transition-all duration-300 translate-y-10 opacity-0 backdrop-blur-md bg-opacity-90`;
    toast.innerHTML = `${icon} <span class="font-medium">${message}</span>`;

    container.appendChild(toast);

    // Animation Frame for smooth entry
    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-10', 'opacity-0');
    });

    // Remove after 3s
    setTimeout(() => {
        toast.classList.add('translate-y-10', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Shows confetti animation for success states
 */
function showConfetti() {
    const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
    const container = document.body;

    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'fixed pointer-events-none z-[200]';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.top = '-10px';
        confetti.style.width = Math.random() * 10 + 5 + 'px';
        confetti.style.height = confetti.style.width;
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
        confetti.style.transform = `rotate(${Math.random() * 360}deg)`;

        container.appendChild(confetti);

        // Animate falling
        const animation = confetti.animate([
            { transform: `translateY(0) rotate(0deg)`, opacity: 1 },
            { transform: `translateY(100vh) rotate(${Math.random() * 720}deg)`, opacity: 0 }
        ], {
            duration: Math.random() * 2000 + 2000,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        });

        animation.onfinish = () => confetti.remove();
    }
}

/**
 * Updates the progress UI during resume parsing
 * @param {number} step - Current step (1-4)
 * @param {string} message - Message to display
 */
function updateProgressUI(step, message) {
    // Update each step indicator
    for (let i = 1; i <= 4; i++) {
        const stepEl = document.getElementById(`progress-step-${i}`);
        if (!stepEl) continue;

        const indicator = stepEl.querySelector('.step-indicator');
        const label = stepEl.querySelector('span:last-child');

        if (i < step) {
            // Completed step
            stepEl.classList.remove('opacity-40');
            indicator.innerHTML = '<i class="fa-solid fa-check text-xs text-green-500"></i>';
            indicator.classList.remove('border-muted', 'border-brand-500', 'bg-brand-50', 'dark:bg-brand-900/30');
            indicator.classList.add('border-green-500', 'bg-green-50', 'dark:bg-green-900/30');
            label.classList.remove('text-muted-foreground');
            label.classList.add('text-green-600', 'dark:text-green-400');
        } else if (i === step) {
            // Current step
            stepEl.classList.remove('opacity-40');
            indicator.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-xs text-brand-500"></i>';
            indicator.classList.remove('border-muted');
            indicator.classList.add('border-brand-500', 'bg-brand-50', 'dark:bg-brand-900/30');
            label.classList.remove('text-muted-foreground');
            label.classList.add('text-foreground', 'font-medium');
        }
        // Steps after current remain unchanged (opacity-40)
    }

    // Update title and subtitle
    const progressTitle = document.getElementById('progress-title');
    const progressSubtitle = document.getElementById('progress-subtitle');
    if (progressTitle) progressTitle.textContent = message;
    if (progressSubtitle) {
        const subtitles = {
            1: 'This usually takes 5-10 seconds',
            2: 'Detecting layout and links...',
            3: 'AI is analyzing your experience...',
            4: 'Almost done!'
        };
        progressSubtitle.textContent = subtitles[step] || '';
    }
}

/**
 * Resets the progress UI to initial state
 */
function resetProgressUI() {
    for (let i = 1; i <= 4; i++) {
        const stepEl = document.getElementById(`progress-step-${i}`);
        if (!stepEl) continue;

        const indicator = stepEl.querySelector('.step-indicator');
        const label = stepEl.querySelector('span:last-child');

        // Reset to initial state
        indicator.classList.remove('border-green-500', 'bg-green-50', 'dark:bg-green-900/30', 'border-brand-500', 'bg-brand-50', 'dark:bg-brand-900/30');
        indicator.classList.add('border-muted');
        label.classList.remove('text-green-600', 'dark:text-green-400', 'text-foreground', 'font-medium');
        label.classList.add('text-muted-foreground');

        if (i === 1) {
            stepEl.classList.remove('opacity-40');
            indicator.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-xs text-brand-500"></i>';
            indicator.classList.add('border-brand-500', 'bg-brand-50', 'dark:bg-brand-900/30');
        } else {
            stepEl.classList.add('opacity-40');
            indicator.innerHTML = `<span class="text-xs text-muted-foreground font-medium">${i}</span>`;
        }
    }
}
