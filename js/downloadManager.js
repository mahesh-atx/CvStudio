// ==========================================
// CvStudio - Download Manager Module
// Handles portfolio export and download functionality
// ==========================================

// Inline CSS for offline portfolios - covers the most used Tailwind utilities
const OFFLINE_CSS = `
/* Reset & Base */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; font-family: 'Outfit', system-ui, sans-serif; }
body { line-height: 1.6; -webkit-font-smoothing: antialiased; }
img { max-width: 100%; height: auto; display: block; }
a { text-decoration: none; color: inherit; }

/* Layout */
.min-h-full { min-height: 100%; }
.max-w-4xl { max-width: 56rem; }
.mx-auto { margin-left: auto; margin-right: auto; }
.flex { display: flex; }
.flex-col { flex-direction: column; }
.flex-wrap { flex-wrap: wrap; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.gap-1 { gap: 0.25rem; } .gap-1\\.5 { gap: 0.375rem; } .gap-2 { gap: 0.5rem; } .gap-3 { gap: 0.75rem; } .gap-4 { gap: 1rem; } .gap-6 { gap: 1.5rem; } .gap-8 { gap: 2rem; } .gap-12 { gap: 3rem; }
.grid { display: grid; }
.grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
.space-y-3 > * + * { margin-top: 0.75rem; } .space-y-4 > * + * { margin-top: 1rem; } .space-y-6 > * + * { margin-top: 1.5rem; } .space-y-8 > * + * { margin-top: 2rem; }

/* Spacing */
.p-3 { padding: 0.75rem; } .p-4 { padding: 1rem; } .p-5 { padding: 1.25rem; } .p-6 { padding: 1.5rem; } .p-8 { padding: 2rem; }
.px-2 { padding-left: 0.5rem; padding-right: 0.5rem; } .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; } .px-4 { padding-left: 1rem; padding-right: 1rem; } .px-5 { padding-left: 1.25rem; padding-right: 1.25rem; } .px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
.py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; } .py-1\\.5 { padding-top: 0.375rem; padding-bottom: 0.375rem; } .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; } .py-2\\.5 { padding-top: 0.625rem; padding-bottom: 0.625rem; } .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; } .py-8 { padding-top: 2rem; padding-bottom: 2rem; } .py-12 { padding-top: 3rem; padding-bottom: 3rem; }
.pt-6 { padding-top: 1.5rem; } .pt-8 { padding-top: 2rem; } .pb-2 { padding-bottom: 0.5rem; } .pb-3 { padding-bottom: 0.75rem; } .pb-4 { padding-bottom: 1rem; } .pb-6 { padding-bottom: 1.5rem; } .pb-8 { padding-bottom: 2rem; } .pb-10 { padding-bottom: 2.5rem; } .pb-16 { padding-bottom: 4rem; }
.mb-1 { margin-bottom: 0.25rem; } .mb-2 { margin-bottom: 0.5rem; } .mb-3 { margin-bottom: 0.75rem; } .mb-4 { margin-bottom: 1rem; } .mb-6 { margin-bottom: 1.5rem; } .mb-8 { margin-bottom: 2rem; } .mb-10 { margin-bottom: 2.5rem; } .mb-12 { margin-bottom: 3rem; }
.mt-1 { margin-top: 0.25rem; } .mt-2 { margin-top: 0.5rem; } .mt-3 { margin-top: 0.75rem; } .mt-4 { margin-top: 1rem; } .mt-6 { margin-top: 1.5rem; } .mt-10 { margin-top: 2.5rem; } .mt-12 { margin-top: 3rem; } .mt-16 { margin-top: 4rem; }
.mr-1 { margin-right: 0.25rem; } .mr-2 { margin-right: 0.5rem; }

/* Sizing */
.w-9 { width: 2.25rem; } .w-12 { width: 3rem; } .w-16 { width: 4rem; } .w-20 { width: 5rem; } .w-24 { width: 6rem; } .w-28 { width: 7rem; } .w-full { width: 100%; }
.h-1 { height: 0.25rem; } .h-9 { height: 2.25rem; } .h-16 { height: 4rem; } .h-20 { height: 5rem; } .h-24 { height: 6rem; } .h-28 { height: 7rem; } .h-px { height: 1px; }
.flex-1 { flex: 1 1 0%; } .flex-shrink-0 { flex-shrink: 0; }

/* Typography */
.text-xs { font-size: 0.75rem; line-height: 1rem; } .text-sm { font-size: 0.875rem; line-height: 1.25rem; } .text-base { font-size: 1rem; line-height: 1.5rem; } .text-lg { font-size: 1.125rem; line-height: 1.75rem; } .text-xl { font-size: 1.25rem; line-height: 1.75rem; } .text-2xl { font-size: 1.5rem; line-height: 2rem; } .text-3xl { font-size: 1.875rem; line-height: 2.25rem; } .text-4xl { font-size: 2.25rem; line-height: 2.5rem; } .text-5xl { font-size: 3rem; line-height: 1; } .text-6xl { font-size: 3.75rem; line-height: 1; } .text-7xl { font-size: 4.5rem; line-height: 1; } .text-8xl { font-size: 6rem; line-height: 1; }
.font-light { font-weight: 300; } .font-medium { font-weight: 500; } .font-semibold { font-weight: 600; } .font-bold { font-weight: 700; } .font-black { font-weight: 900; }
.font-sans { font-family: 'Outfit', system-ui, sans-serif; } .font-mono { font-family: ui-monospace, monospace; }
.text-center { text-align: center; }
.leading-relaxed { line-height: 1.625; } .leading-loose { line-height: 2; }
.tracking-tight { letter-spacing: -0.025em; } .tracking-tighter { letter-spacing: -0.05em; }
.break-words { word-wrap: break-word; overflow-wrap: break-word; }
.whitespace-nowrap { white-space: nowrap; } .whitespace-pre-line { white-space: pre-line; }
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* Colors */
.text-white { color: #fff; } .text-gray-500 { color: #6b7280; } .text-gray-600 { color: #4b5563; } .text-gray-700 { color: #374151; } .text-gray-900 { color: #111827; }
.text-slate-300 { color: #cbd5e1; } .text-slate-400 { color: #94a3b8; } .text-slate-500 { color: #64748b; }
.text-violet-400 { color: #a78bfa; } .text-violet-600 { color: #7c3aed; }
.text-blue-600 { color: #2563eb; } .text-blue-800 { color: #1e40af; }
.text-emerald-400 { color: #34d399; } .text-emerald-600 { color: #059669; }
.text-rose-400 { color: #fb7185; } .text-rose-600 { color: #e11d48; }
.bg-white { background-color: #fff; } .bg-gray-50 { background-color: #f9fafb; } .bg-gray-100 { background-color: #f3f4f6; } .bg-gray-200 { background-color: #e5e7eb; } .bg-gray-800 { background-color: #1f2937; } .bg-gray-900 { background-color: #111827; }
.bg-slate-700 { background-color: #334155; } .bg-slate-800 { background-color: #1e293b; } .bg-slate-900 { background-color: #0f172a; }
.bg-violet-500 { background-color: #8b5cf6; } .bg-blue-500 { background-color: #3b82f6; } .bg-emerald-500 { background-color: #10b981; } .bg-rose-500 { background-color: #f43f5e; }
.bg-gradient-to-br { background-image: linear-gradient(to bottom right, var(--tw-gradient-stops)); }
.from-gray-100 { --tw-gradient-from: #f3f4f6; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, transparent); }
.to-gray-200 { --tw-gradient-to: #e5e7eb; }
.from-white { --tw-gradient-from: #fff; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, transparent); }
.to-slate-400 { --tw-gradient-to: #94a3b8; }
.bg-clip-text { -webkit-background-clip: text; background-clip: text; }
.text-transparent { color: transparent; }

/* Borders */
.border { border-width: 1px; } .border-b { border-bottom-width: 1px; } .border-t { border-top-width: 1px; }
.border-0 { border-width: 0; } .border-2 { border-width: 2px; } .border-4 { border-width: 4px; }
.border-gray-100 { border-color: #f3f4f6; } .border-gray-200 { border-color: #e5e7eb; } .border-gray-300 { border-color: #d1d5db; }
.border-slate-600 { border-color: #475569; } .border-slate-700 { border-color: #334155; }
.rounded { border-radius: 0.25rem; } .rounded-md { border-radius: 0.375rem; } .rounded-lg { border-radius: 0.5rem; } .rounded-xl { border-radius: 0.75rem; } .rounded-2xl { border-radius: 1rem; } .rounded-full { border-radius: 9999px; }

/* Effects */
.shadow-sm { box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); } .shadow { box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1); } .shadow-lg { box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1); } .shadow-xl { box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1); } .shadow-2xl { box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25); }
.backdrop-blur-xl { backdrop-filter: blur(24px); }
.overflow-hidden { overflow: hidden; } .overflow-x-hidden { overflow-x: hidden; } .overflow-y-auto { overflow-y: auto; }
.object-cover { object-fit: cover; }

/* Position */
.relative { position: relative; } .absolute { position: absolute; } .fixed { position: fixed; } .sticky { position: sticky; }
.top-0 { top: 0; } .left-0 { left: 0; } .right-0 { right: 0; } .bottom-0 { bottom: 0; }
.inset-0 { inset: 0; }
.z-10 { z-index: 10; } .z-20 { z-index: 20; } .z-50 { z-index: 50; }

/* Transitions */
.transition { transition-property: color, background-color, border-color, fill, stroke, opacity, box-shadow, transform, filter; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
.transition-all { transition-property: all; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }

/* Visibility & Display */
.hidden { display: none; } .inline { display: inline; } .block { display: block; } .inline-block { display: inline-block; } .inline-flex { display: inline-flex; }
.last\\:border-0:last-child { border-width: 0; } .last\\:mb-0:last-child { margin-bottom: 0; } .last\\:pb-0:last-child { padding-bottom: 0; }

/* Hover */
.hover\\:bg-gray-50:hover { background-color: #f9fafb; } .hover\\:bg-gray-100:hover { background-color: #f3f4f6; }
.hover\\:bg-slate-700:hover { background-color: #334155; }
.hover\\:text-blue-800:hover { color: #1e40af; } .hover\\:underline:hover { text-decoration: underline; }

/* Icons (inline SVG replacements for FontAwesome) */
.fa-envelope::before { content: "✉"; } .fa-phone::before { content: "📞"; } 
.fa-linkedin::before { content: "in"; font-weight: bold; } .fa-github::before { content: "⌂"; }
.fa-external-link-alt::before { content: "↗"; } .fa-link::before { content: "🔗"; }
.fa-bars::before { content: "☰"; } .fa-xmark::before { content: "✕"; }
.fa-arrow-right::before { content: "→"; }
i[class*="fa-"] { font-style: normal; }

/* Responsive (sm: 640px+) */
@media (min-width: 640px) {
    .sm\\:w-32 { width: 8rem; } .sm\\:h-32 { height: 8rem; }
    .sm\\:text-3xl { font-size: 1.875rem; line-height: 2.25rem; } .sm\\:text-4xl { font-size: 2.25rem; line-height: 2.5rem; }
    .sm\\:text-lg { font-size: 1.125rem; line-height: 1.75rem; } .sm\\:text-base { font-size: 1rem; line-height: 1.5rem; } .sm\\:text-sm { font-size: 0.875rem; line-height: 1.25rem; }
    .sm\\:px-4 { padding-left: 1rem; padding-right: 1rem; } .sm\\:px-5 { padding-left: 1.25rem; padding-right: 1.25rem; } .sm\\:px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
    .sm\\:py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; } .sm\\:py-2\\.5 { padding-top: 0.625rem; padding-bottom: 0.625rem; } .sm\\:py-12 { padding-top: 3rem; padding-bottom: 3rem; }
    .sm\\:pt-8 { padding-top: 2rem; } .sm\\:pb-16 { padding-bottom: 4rem; }
    .sm\\:mb-4 { margin-bottom: 1rem; } .sm\\:mb-10 { margin-bottom: 2.5rem; } .sm\\:mb-12 { margin-bottom: 3rem; }
    .sm\\:gap-2 { gap: 0.5rem; } .sm\\:gap-3 { gap: 0.75rem; } .sm\\:gap-4 { gap: 1rem; } .sm\\:gap-8 { gap: 2rem; }
    .sm\\:space-y-4 > * + * { margin-top: 1rem; } .sm\\:space-y-8 > * + * { margin-top: 2rem; }
    .sm\\:inline { display: inline; }
}

/* Responsive (md: 768px+) */
@media (min-width: 768px) {
    .md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .md\\:flex-row { flex-direction: row; }
    .md\\:text-4xl { font-size: 2.25rem; line-height: 2.5rem; } .md\\:text-7xl { font-size: 4.5rem; line-height: 1; } .md\\:text-8xl { font-size: 6rem; line-height: 1; }
    .md\\:text-2xl { font-size: 1.5rem; line-height: 2rem; } .md\\:text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
    .md\\:p-12 { padding: 3rem; } .md\\:p-16 { padding: 4rem; }
}
`;

/**
 * Downloads the portfolio from the editor view
 * @param {boolean} offline - If true, embeds CSS for offline use
 */
function downloadSite(offline = false) {
    // Get the portfolio HTML content from inside the iframe
    const iframe = document.getElementById('preview-container');
    const portfolioContent = iframe?.contentDocument?.body?.innerHTML || '';

    // Get form data for meta tags
    const form = document.getElementById('portfolio-form');
    const fullName = form.fullName.value || 'My Portfolio';
    const title = form.title.value || 'Professional Portfolio';

    // Generate complete standalone HTML
    const standaloneHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${fullName} - ${title}</title>
    <meta name="description" content="Portfolio of ${fullName} - ${title}">
    <meta name="author" content="${fullName}">
    <meta property="og:title" content="${fullName} - ${title}">
    <meta property="og:description" content="Professional portfolio of ${fullName}">
    <meta property="og:type" content="website">
    
    ${offline ? `
    <!-- Embedded Fonts (subset) -->
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
    </style>
    <!-- Inline CSS for Offline Use -->
    <style>${OFFLINE_CSS}</style>
    ` : `
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"><\/script>
    
    <!-- FontAwesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    
    <style>
        * { font-family: 'Outfit', sans-serif; }
        html { scroll-behavior: smooth; }
    </style>
    `}
</head>
<body>
${portfolioContent}
</body>
</html>`;

    // Create and download the file
    const blob = new Blob([standaloneHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fullName.toLowerCase().replace(/\\s+/g, '-')}-portfolio${offline ? '-offline' : ''}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`Portfolio exported${offline ? ' (offline version)' : ''} successfully!`);
}

/**
 * Utility function to download offline version
 */
function downloadSiteOffline() {
    downloadSite(true);
}

/**
 * Downloads the portfolio from the preview mode view
 */
function downloadSiteFromPreview() {
    const iframe = document.getElementById('preview-mode-container');
    const portfolioContent = iframe?.contentDocument?.body?.innerHTML || '';
    const fullName = state.data.fullName || 'My Portfolio';
    const title = state.data.title || 'Professional Portfolio';

    const standaloneHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${fullName} - ${title}</title>
    <meta name="description" content="Portfolio of ${fullName} - ${title}">
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"><\/script>
    
    <!-- FontAwesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    
    <style>
        * { font-family: 'Outfit', sans-serif; }
        html { scroll-behavior: smooth; }
    </style>
</head>
<body>
${portfolioContent}
</body>
</html>`;

    const blob = new Blob([standaloneHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fullName.toLowerCase().replace(/\\s+/g, '-')}-portfolio.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Portfolio exported successfully!');
}
