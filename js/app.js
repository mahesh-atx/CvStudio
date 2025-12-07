// ==========================================
// CvStudio - Main Application JavaScript
// ==========================================

// ==========================================
// 1. STATE MANAGEMENT
// ==========================================
const state = {
    mode: 'landing', // 'landing' | 'editor'
    template: 'modern', // 'modern' | 'minimal' | 'bold'
    accent: 'violet',
    data: {
        fullName: '',
        title: '',
        location: '',
        bio: '',
        skills: '',
        expRole: '',
        expCompany: '',
        expDesc: '',
        experiences: [],
        education: [],
        projects: [],
        certifications: [],
        languages: [],
        awards: [],
        customSections: [],
        email: '',
        phone: '',
        linkedin: '',
        github: '',
        profilePhoto: '' // Base64 encoded photo
    }
};

// ==========================================
// UNDO/REDO HISTORY SYSTEM
// ==========================================
const history = {
    past: [],
    future: [],
    maxSize: 50,
    isRestoring: false // Prevent saving while restoring
};

function saveToHistory() {
    if (history.isRestoring) return;

    // Deep clone current state.data
    const snapshot = JSON.parse(JSON.stringify(state.data));
    history.past.push(snapshot);
    history.future = []; // Clear redo stack on new change

    if (history.past.length > history.maxSize) {
        history.past.shift();
    }
    updateUndoRedoButtons();
}

function undo() {
    if (history.past.length === 0) {
        showToast('Nothing to undo', 'info');
        return;
    }

    history.isRestoring = true;

    // Save current state to future
    history.future.push(JSON.parse(JSON.stringify(state.data)));

    // Restore previous state
    state.data = history.past.pop();
    populateForm();
    renderAllDynamicLists();
    updatePreview();
    updateUndoRedoButtons();

    history.isRestoring = false;
    showToast('Undo successful');
}

function redo() {
    if (history.future.length === 0) {
        showToast('Nothing to redo', 'info');
        return;
    }

    history.isRestoring = true;

    // Save current to past
    history.past.push(JSON.parse(JSON.stringify(state.data)));

    // Restore future state
    state.data = history.future.pop();
    populateForm();
    renderAllDynamicLists();
    updatePreview();
    updateUndoRedoButtons();

    history.isRestoring = false;
    showToast('Redo successful');
}

function updateUndoRedoButtons() {
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    if (undoBtn) undoBtn.disabled = history.past.length === 0;
    if (redoBtn) redoBtn.disabled = history.future.length === 0;
}

// Keyboard shortcuts for undo/redo
document.addEventListener('keydown', (e) => {
    // Only handle if not typing in an input/textarea
    const target = e.target;
    const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
            redo();
        } else {
            undo();
        }
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
    }
});

// Debounced save to history (prevents too many snapshots while typing)
let saveHistoryTimeout;
function debouncedSaveToHistory() {
    clearTimeout(saveHistoryTimeout);
    saveHistoryTimeout = setTimeout(() => {
        saveToHistory();
    }, 1000); // Save after 1 second of no changes
}

const accentColors = {
    violet: { text: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-600 dark:bg-violet-500', light: 'bg-violet-50 dark:bg-violet-900/20', border: 'border-violet-200 dark:border-violet-800' },
    blue: { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-600 dark:bg-blue-500', light: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800' },
    emerald: { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-600 dark:bg-emerald-500', light: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800' },
    rose: { text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-600 dark:bg-rose-500', light: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-200 dark:border-rose-800' },
};

// ==========================================
// 2. DOM ELEMENTS
// ==========================================
const fileInput = document.getElementById('cv-upload');
const dropZone = document.getElementById('drop-zone');
const createBtn = document.getElementById('create-btn');
const photoInput = document.getElementById('photo-upload');

// ==========================================
// 2.1 PHOTO UPLOAD HANDLER
// ==========================================
function handlePhotoUpload(file) {
    if (!file.type.startsWith('image/')) {
        showToast('Please upload an image file (JPG, PNG, etc.)', 'info');
        return;
    }

    // Max size check (5MB)
    if (file.size > 5 * 1024 * 1024) {
        showToast('Image too large. Please use an image under 5MB.', 'info');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        state.data.profilePhoto = e.target.result; // Base64 encoded image
        showToast('Profile photo uploaded!');

        // Update preview if in editor mode
        if (document.getElementById('editor-app') && !document.getElementById('editor-app').classList.contains('hidden')) {
            updatePreview();
        }
        // Update preview mode if visible
        if (document.getElementById('preview-mode') && !document.getElementById('preview-mode').classList.contains('hidden')) {
            updatePreviewMode();
        }

        // Update photo preview thumbnail if exists
        const photoPreview = document.getElementById('photo-preview');
        if (photoPreview) {
            photoPreview.innerHTML = `<img src="${e.target.result}" alt="Profile" class="w-full h-full object-cover">`;
        }
    };
    reader.readAsDataURL(file);
}

// Initialize photo upload listener (wait for DOM since input is in editor)
document.addEventListener('DOMContentLoaded', () => {
    const photoUploadInput = document.getElementById('photo-upload');
    if (photoUploadInput) {
        photoUploadInput.addEventListener('change', (e) => {
            if (e.target.files.length) handlePhotoUpload(e.target.files[0]);
        });
    }
});

// ==========================================
// 2.2 SECTION NAVIGATION & DYNAMIC FORMS
// ==========================================

// Section switching function
function switchSection(sectionName) {
    // Hide all section panels
    document.querySelectorAll('.section-panel').forEach(panel => {
        panel.classList.add('hidden');
    });

    // Show the selected section
    const targetSection = document.getElementById(`section-${sectionName}`);
    if (targetSection) {
        targetSection.classList.remove('hidden');
    }

    // Update nav button styles
    document.querySelectorAll('.section-nav-btn').forEach(btn => {
        btn.classList.remove('text-white', 'bg-brand-600');
        btn.classList.add('text-slate-400', 'hover:text-white', 'hover:bg-slate-800');
    });

    const activeBtn = document.getElementById(`nav-${sectionName}`);
    if (activeBtn) {
        activeBtn.classList.remove('text-slate-400', 'hover:text-white', 'hover:bg-slate-800');
        activeBtn.classList.add('text-white', 'bg-brand-600');
    }
}

// ==========================================
// EXPERIENCE MANAGEMENT
// ==========================================
function addExperience() {
    const newExp = {
        id: Date.now(),
        role: '',
        company: '',
        duration: '',
        description: ''
    };
    state.data.experiences.push(newExp);
    renderExperienceList();
    updatePreview();
}

function removeExperience(id) {
    state.data.experiences = state.data.experiences.filter(exp => exp.id !== id);
    renderExperienceList();
    updatePreview();
}

function updateExperience(id, field, value) {
    const exp = state.data.experiences.find(e => e.id === id);
    if (exp) {
        exp[field] = value;
        updatePreview();
    }
}

function renderExperienceList() {
    const container = document.getElementById('experience-list');
    if (!container) return;

    if (state.data.experiences.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = state.data.experiences.map((exp, index) => `
        <div class="bg-slate-800 border border-slate-700 rounded-lg p-4 relative">
            <button type="button" onclick="removeExperience(${exp.id})" class="absolute top-3 right-3 text-red-400 hover:text-red-300 text-sm">
                <i class="fa-solid fa-trash"></i>
            </button>
            <div class="space-y-3 pr-8">
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs text-slate-500 mb-1">Role/Position</label>
                        <input type="text" value="${exp.role || ''}" onchange="updateExperience(${exp.id}, 'role', this.value)" 
                            class="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-sm text-white focus:border-brand-500 focus:outline-none" placeholder="Software Engineer">
                    </div>
                    <div>
                        <label class="block text-xs text-slate-500 mb-1">Company</label>
                        <input type="text" value="${exp.company || ''}" onchange="updateExperience(${exp.id}, 'company', this.value)"
                            class="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-sm text-white focus:border-brand-500 focus:outline-none" placeholder="Company Name">
                    </div>
                </div>
                <div>
                    <label class="block text-xs text-slate-500 mb-1">Duration</label>
                    <input type="text" value="${exp.duration || ''}" onchange="updateExperience(${exp.id}, 'duration', this.value)"
                        class="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-sm text-white focus:border-brand-500 focus:outline-none" placeholder="Jan 2020 - Present">
                </div>
                <div>
                    <label class="block text-xs text-slate-500 mb-1">Description</label>
                    <textarea onchange="updateExperience(${exp.id}, 'description', this.value)"
                        class="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-sm text-white focus:border-brand-500 focus:outline-none resize-none h-16" placeholder="Describe your responsibilities...">${exp.description || ''}</textarea>
                </div>
            </div>
        </div>
    `).join('');
}

// ==========================================
// EDUCATION MANAGEMENT
// ==========================================
function addEducation() {
    const newEdu = {
        id: Date.now(),
        degree: '',
        institution: '',
        year: ''
    };
    state.data.education.push(newEdu);
    renderEducationList();
    updatePreview();
}

function removeEducation(id) {
    state.data.education = state.data.education.filter(edu => edu.id !== id);
    renderEducationList();
    updatePreview();
}

function updateEducation(id, field, value) {
    const edu = state.data.education.find(e => e.id === id);
    if (edu) {
        edu[field] = value;
        updatePreview();
    }
}

function renderEducationList() {
    const container = document.getElementById('education-list');
    if (!container) return;

    if (state.data.education.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = state.data.education.map((edu, index) => `
        <div class="bg-slate-800 border border-slate-700 rounded-lg p-4 relative">
            <button type="button" onclick="removeEducation(${edu.id})" class="absolute top-3 right-3 text-red-400 hover:text-red-300 text-sm">
                <i class="fa-solid fa-trash"></i>
            </button>
            <div class="space-y-3 pr-8">
                <div>
                    <label class="block text-xs text-slate-500 mb-1">Degree/Certification</label>
                    <input type="text" value="${edu.degree || ''}" onchange="updateEducation(${edu.id}, 'degree', this.value)"
                        class="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-sm text-white focus:border-brand-500 focus:outline-none" placeholder="B.S. Computer Science">
                </div>
                <div>
                    <label class="block text-xs text-slate-500 mb-1">Institution</label>
                    <input type="text" value="${edu.institution || ''}" onchange="updateEducation(${edu.id}, 'institution', this.value)"
                        class="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-sm text-white focus:border-brand-500 focus:outline-none" placeholder="University Name">
                </div>
                <div>
                    <label class="block text-xs text-slate-500 mb-1">Year</label>
                    <input type="text" value="${edu.year || ''}" onchange="updateEducation(${edu.id}, 'year', this.value)"
                        class="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-sm text-white focus:border-brand-500 focus:outline-none" placeholder="2020">
                </div>
            </div>
        </div>
    `).join('');
}

// ==========================================
// PROJECTS MANAGEMENT
// ==========================================
function addProject() {
    const newProj = {
        id: Date.now(),
        name: '',
        description: '',
        technologies: '',
        link: '',
        github: ''
    };
    state.data.projects.push(newProj);
    renderProjectsList();
    updatePreview();
}

function removeProject(id) {
    state.data.projects = state.data.projects.filter(proj => proj.id !== id);
    renderProjectsList();
    updatePreview();
}

function updateProject(id, field, value) {
    const proj = state.data.projects.find(p => p.id === id);
    if (proj) {
        proj[field] = value;
        updatePreview();
    }
}

function renderProjectsList() {
    const container = document.getElementById('projects-list');
    if (!container) return;

    if (state.data.projects.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = state.data.projects.map((proj, index) => `
        <div class="bg-slate-800 border border-slate-700 rounded-lg p-4 relative">
            <button type="button" onclick="removeProject(${proj.id})" class="absolute top-3 right-3 text-red-400 hover:text-red-300 text-sm">
                <i class="fa-solid fa-trash"></i>
            </button>
            <div class="space-y-3 pr-8">
                <div>
                    <label class="block text-xs text-slate-500 mb-1">Project Name</label>
                    <input type="text" value="${proj.name || ''}" onchange="updateProject(${proj.id}, 'name', this.value)"
                        class="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-sm text-white focus:border-brand-500 focus:outline-none" placeholder="My Awesome Project">
                </div>
                <div>
                    <label class="block text-xs text-slate-500 mb-1">Description</label>
                    <textarea onchange="updateProject(${proj.id}, 'description', this.value)"
                        class="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-sm text-white focus:border-brand-500 focus:outline-none resize-none h-16" placeholder="What does this project do?">${proj.description || ''}</textarea>
                </div>
                <div>
                    <label class="block text-xs text-slate-500 mb-1">Technologies (comma separated)</label>
                    <input type="text" value="${proj.technologies || ''}" onchange="updateProject(${proj.id}, 'technologies', this.value)"
                        class="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-sm text-white focus:border-brand-500 focus:outline-none" placeholder="React, Node.js, MongoDB">
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs text-slate-500 mb-1">Live URL</label>
                        <input type="url" value="${proj.link || ''}" onchange="updateProject(${proj.id}, 'link', this.value)"
                            class="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-sm text-white focus:border-brand-500 focus:outline-none" placeholder="https://...">
                    </div>
                    <div>
                        <label class="block text-xs text-slate-500 mb-1">GitHub URL</label>
                        <input type="url" value="${proj.github || ''}" onchange="updateProject(${proj.id}, 'github', this.value)"
                            class="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-sm text-white focus:border-brand-500 focus:outline-none" placeholder="https://github.com/...">
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Render all dynamic lists (call after data is loaded)
function renderAllDynamicLists() {
    renderExperienceList();
    renderEducationList();
    renderProjectsList();
    renderCertificationsList();
    renderLanguagesList();
    renderAwardsList();
}

// ==========================================
// CERTIFICATIONS MANAGEMENT
// ==========================================
function addCertification() {
    const newCert = {
        id: Date.now(),
        name: '',
        issuer: '',
        year: '',
        link: ''
    };
    state.data.certifications.push(newCert);
    renderCertificationsList();
    updatePreview();
}

function removeCertification(id) {
    state.data.certifications = state.data.certifications.filter(cert => cert.id !== id);
    renderCertificationsList();
    updatePreview();
}

function updateCertification(id, field, value) {
    const cert = state.data.certifications.find(c => c.id === id);
    if (cert) {
        cert[field] = value;
        updatePreview();
    }
}

function renderCertificationsList() {
    const container = document.getElementById('certifications-list');
    if (!container) return;

    // Ensure certifications array exists
    if (!state.data.certifications) {
        state.data.certifications = [];
    }

    if (state.data.certifications.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = state.data.certifications.map((cert, index) => `
        <div class="bg-slate-800 border border-slate-700 rounded-lg p-4 relative">
            <button type="button" onclick="removeCertification(${cert.id || index})" class="absolute top-3 right-3 text-red-400 hover:text-red-300 text-sm">
                <i class="fa-solid fa-trash"></i>
            </button>
            <div class="space-y-3 pr-8">
                <div>
                    <label class="block text-xs text-slate-500 mb-1">Certification Name</label>
                    <input type="text" value="${cert.name || ''}" onchange="updateCertification(${cert.id || index}, 'name', this.value)"
                        class="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-sm text-white focus:border-brand-500 focus:outline-none" placeholder="AWS Solutions Architect">
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs text-slate-500 mb-1">Issuing Organization</label>
                        <input type="text" value="${cert.issuer || ''}" onchange="updateCertification(${cert.id || index}, 'issuer', this.value)"
                            class="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-sm text-white focus:border-brand-500 focus:outline-none" placeholder="Amazon">
                    </div>
                    <div>
                        <label class="block text-xs text-slate-500 mb-1">Year</label>
                        <input type="text" value="${cert.year || ''}" onchange="updateCertification(${cert.id || index}, 'year', this.value)"
                            class="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-sm text-white focus:border-brand-500 focus:outline-none" placeholder="2023">
                    </div>
                </div>
                <div>
                    <label class="block text-xs text-slate-500 mb-1">Credential URL (optional)</label>
                    <input type="url" value="${cert.link || ''}" onchange="updateCertification(${cert.id || index}, 'link', this.value)"
                        class="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-sm text-white focus:border-brand-500 focus:outline-none" placeholder="https://...">
                </div>
            </div>
        </div>
    `).join('');
}

// ==========================================
// LANGUAGES MANAGEMENT
// ==========================================
function addLanguage() {
    const newLang = {
        id: Date.now(),
        name: '',
        proficiency: 'Fluent'
    };
    state.data.languages.push(newLang);
    renderLanguagesList();
    updatePreview();
}

function removeLanguage(id) {
    state.data.languages = state.data.languages.filter(lang => lang.id !== id);
    renderLanguagesList();
    updatePreview();
}

function updateLanguage(id, field, value) {
    const lang = state.data.languages.find(l => l.id === id);
    if (lang) {
        lang[field] = value;
        updatePreview();
    }
}

function renderLanguagesList() {
    const container = document.getElementById('languages-list');
    if (!container) return;

    // Ensure languages array exists
    if (!state.data.languages) {
        state.data.languages = [];
    }

    if (state.data.languages.length === 0) {
        container.innerHTML = '';
        return;
    }

    const proficiencyLevels = ['Native', 'Fluent', 'Advanced', 'Intermediate', 'Basic'];

    container.innerHTML = state.data.languages.map((lang, index) => `
        <div class="bg-slate-800 border border-slate-700 rounded-lg p-4 relative">
            <button type="button" onclick="removeLanguage(${lang.id || index})" class="absolute top-3 right-3 text-red-400 hover:text-red-300 text-sm">
                <i class="fa-solid fa-trash"></i>
            </button>
            <div class="grid grid-cols-2 gap-3 pr-8">
                <div>
                    <label class="block text-xs text-slate-500 mb-1">Language</label>
                    <input type="text" value="${lang.name || ''}" onchange="updateLanguage(${lang.id || index}, 'name', this.value)"
                        class="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-sm text-white focus:border-brand-500 focus:outline-none" placeholder="English">
                </div>
                <div>
                    <label class="block text-xs text-slate-500 mb-1">Proficiency</label>
                    <select onchange="updateLanguage(${lang.id || index}, 'proficiency', this.value)"
                        class="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-sm text-white focus:border-brand-500 focus:outline-none">
                        ${proficiencyLevels.map(level => `<option value="${level}" ${lang.proficiency === level ? 'selected' : ''}>${level}</option>`).join('')}
                    </select>
                </div>
            </div>
        </div>
    `).join('');
}

// ==========================================
// AWARDS MANAGEMENT
// ==========================================
function addAward() {
    const newAward = {
        id: Date.now(),
        title: '',
        issuer: '',
        year: '',
        description: ''
    };
    state.data.awards.push(newAward);
    renderAwardsList();
    updatePreview();
}

function removeAward(id) {
    state.data.awards = state.data.awards.filter(award => award.id !== id);
    renderAwardsList();
    updatePreview();
}

function updateAward(id, field, value) {
    const award = state.data.awards.find(a => a.id === id);
    if (award) {
        award[field] = value;
        updatePreview();
    }
}

function renderAwardsList() {
    const container = document.getElementById('awards-list');
    if (!container) return;

    // Ensure awards array exists
    if (!state.data.awards) {
        state.data.awards = [];
    }

    if (state.data.awards.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = state.data.awards.map((award, index) => `
        <div class="bg-slate-800 border border-slate-700 rounded-lg p-4 relative">
            <button type="button" onclick="removeAward(${award.id || index})" class="absolute top-3 right-3 text-red-400 hover:text-red-300 text-sm">
                <i class="fa-solid fa-trash"></i>
            </button>
            <div class="space-y-3 pr-8">
                <div>
                    <label class="block text-xs text-slate-500 mb-1">Award/Achievement Title</label>
                    <input type="text" value="${award.title || ''}" onchange="updateAward(${award.id || index}, 'title', this.value)"
                        class="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-sm text-white focus:border-brand-500 focus:outline-none" placeholder="Best Developer Award">
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs text-slate-500 mb-1">Issuing Organization</label>
                        <input type="text" value="${award.issuer || ''}" onchange="updateAward(${award.id || index}, 'issuer', this.value)"
                            class="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-sm text-white focus:border-brand-500 focus:outline-none" placeholder="Company/Organization">
                    </div>
                    <div>
                        <label class="block text-xs text-slate-500 mb-1">Year</label>
                        <input type="text" value="${award.year || ''}" onchange="updateAward(${award.id || index}, 'year', this.value)"
                            class="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-sm text-white focus:border-brand-500 focus:outline-none" placeholder="2023">
                    </div>
                </div>
                <div>
                    <label class="block text-xs text-slate-500 mb-1">Description (optional)</label>
                    <textarea onchange="updateAward(${award.id || index}, 'description', this.value)"
                        class="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-sm text-white focus:border-brand-500 focus:outline-none resize-none h-12" placeholder="Brief description...">${award.description || ''}</textarea>
                </div>
            </div>
        </div>
    `).join('');
}

// ==========================================
// 3. UPLOAD & SIMULATION LOGIC
// ==========================================

// ==========================================
// PARALLAX SCROLL EFFECT
// ==========================================
window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const blob1 = document.getElementById('parallax-blob-1');
    const blob2 = document.getElementById('parallax-blob-2');
    const blob3 = document.getElementById('parallax-blob-3');

    if (blob1) blob1.style.transform = `translateY(${scrollY * 0.3}px)`;
    if (blob2) blob2.style.transform = `translateY(${scrollY * 0.2}px) translateX(${scrollY * -0.1}px)`;
    if (blob3) blob3.style.transform = `translateY(${scrollY * 0.4}px)`;
});

// Drag & Drop Visuals
if (dropZone) {
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('border-brand-500', 'bg-brand-50', 'dark:bg-brand-900/20');
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-brand-500', 'bg-brand-50', 'dark:bg-brand-900/20');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-brand-500', 'bg-brand-50', 'dark:bg-brand-900/20');
        if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    });
}

if (fileInput) {
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFile(e.target.files[0]);
        }
    });
}


function handleFile(file) {
    if (file.type !== 'application/pdf') {
        showToast('Please upload a PDF file.', 'info');
        return;
    }

    // 1. Show Loading & Reset Progress
    document.getElementById('upload-initial-state').classList.add('hidden');
    document.getElementById('upload-loading-state').classList.remove('hidden');
    resetProgressUI();

    // 2. Real PDF Parsing with Progress Callback
    parseResume(file, updateProgressUI)
        .then((parsedData) => {
            // Hide loading, show success
            document.getElementById('upload-loading-state').classList.add('hidden');
            document.getElementById('upload-success-state').classList.remove('hidden');
            document.getElementById('filename-display').textContent = file.name;

            // Enable Button
            createBtn.disabled = false;
            createBtn.classList.remove('bg-secondary', 'text-secondary-foreground', 'disabled:cursor-not-allowed', 'disabled:text-muted-foreground', 'disabled:bg-muted');
            createBtn.classList.add('bg-primary', 'text-primary-foreground', 'hover:bg-primary/90', 'shadow-lg', 'shadow-primary/30');

            // Success celebration!
            showConfetti();
            showToast('Resume parsed successfully!');

            // 3. Populate state with REAL parsed data
            state.data = formatParsedDataForState(parsedData);
        })
        .catch((error) => {
            console.error('Resume parsing error:', error);

            // Reset to initial state
            document.getElementById('upload-loading-state').classList.add('hidden');
            document.getElementById('upload-initial-state').classList.remove('hidden');

            // Show error message (API key issues are handled server-side)
            showToast(error.message || 'Failed to parse resume. Please try again.', 'info');
        });
}

// ==========================================
// 4. TRANSITION TO PREVIEW MODE
// ==========================================
if (createBtn) {
    createBtn.addEventListener('click', () => {
        // Animation
        const landing = document.getElementById('landing-page');
        landing.style.opacity = '0';

        setTimeout(() => {
            landing.classList.add('hidden');

            // Show Preview Mode instead of Editor
            const previewMode = document.getElementById('preview-mode');
            previewMode.classList.remove('hidden');
            previewMode.classList.add('animate-fade-in-up');

            // Update preview URL with user's name
            const userName = state.data.fullName ? state.data.fullName.toLowerCase().replace(/\s+/g, '-') : 'yourname';
            document.getElementById('preview-url').textContent = `${userName}.cvstudio.co`;

            // Render Preview in the preview mode container
            updatePreviewMode();
        }, 500);
    });
}

// ==========================================
// 4.1 PREVIEW MODE NAVIGATION HANDLERS
// ==========================================

// Back button - return to landing page
document.getElementById('preview-back-btn')?.addEventListener('click', () => {
    const previewMode = document.getElementById('preview-mode');
    previewMode.style.opacity = '0';

    setTimeout(() => {
        previewMode.classList.add('hidden');
        previewMode.style.opacity = '';
        previewMode.classList.remove('animate-fade-in-up');

        // Reset and show landing page
        const landing = document.getElementById('landing-page');
        landing.classList.remove('hidden');
        landing.style.opacity = '';

        // Reset upload state
        document.getElementById('upload-success-state').classList.add('hidden');
        document.getElementById('upload-initial-state').classList.remove('hidden');
        createBtn.disabled = true;
        createBtn.classList.add('bg-secondary', 'text-secondary-foreground', 'disabled:cursor-not-allowed', 'disabled:text-muted-foreground', 'disabled:bg-muted');
        createBtn.classList.remove('bg-primary', 'text-primary-foreground', 'hover:bg-primary/90', 'shadow-lg', 'shadow-primary/30');
    }, 300);
});

// Editor button - go to full editor
document.getElementById('preview-editor-btn')?.addEventListener('click', () => {
    const previewMode = document.getElementById('preview-mode');
    previewMode.style.opacity = '0';

    setTimeout(() => {
        previewMode.classList.add('hidden');
        previewMode.style.opacity = '';

        // Show Editor
        const editor = document.getElementById('editor-app');
        editor.classList.remove('hidden');
        editor.classList.add('animate-fade-in-up');

        // Populate Inputs
        populateForm();
        // Render Preview
        updatePreview();
    }, 300);
});

// Download button in preview mode
document.getElementById('preview-download-btn')?.addEventListener('click', () => {
    downloadSiteFromPreview();
});

// Publish button in preview mode
document.getElementById('preview-publish-btn')?.addEventListener('click', () => {
    const userName = state.data.fullName ? state.data.fullName.toLowerCase().replace(/\s+/g, '-') : 'yourname';
    showToast(`Published to https://${userName}.cvstudio.co`);
});




function populateForm() {
    const form = document.getElementById('portfolio-form');
    if (form) {
        // Personal info
        if (form.fullName) form.fullName.value = state.data.fullName || '';
        if (form.title) form.title.value = state.data.title || '';
        if (form.location) form.location.value = state.data.location || '';
        if (form.bio) form.bio.value = state.data.bio || '';
        if (form.skills) form.skills.value = state.data.skills || '';

        // Contact info
        if (form.email) form.email.value = state.data.email || '';
        if (form.phone) form.phone.value = state.data.phone || '';
        if (form.linkedin) form.linkedin.value = state.data.linkedin || '';
        if (form.github) form.github.value = state.data.github || '';
        if (form.website) form.website.value = state.data.website || '';

        // Hidden fields for backward compatibility
        if (form.expRole) form.expRole.value = state.data.expRole || '';
        if (form.expCompany) form.expCompany.value = state.data.expCompany || '';
        if (form.expDesc) form.expDesc.value = state.data.expDesc || '';

        // Update photo preview if photo exists
        const photoPreview = document.getElementById('photo-preview');
        if (photoPreview && state.data.profilePhoto) {
            photoPreview.innerHTML = `<img src="${state.data.profilePhoto}" alt="Profile" class="w-full h-full object-cover">`;
        }

        // Render dynamic lists
        renderAllDynamicLists();
    }
}


// ==========================================
// 5. PREVIEW RENDERING ENGINE
// ==========================================
function setTemplate(tpl) {
    state.template = tpl;

    // Update template-btn buttons (new dark theme style)
    document.querySelectorAll('.template-btn').forEach(btn => {
        btn.classList.remove('border-brand-500', 'border-2', 'bg-brand-500/20', 'text-brand-300');
        btn.classList.add('border-slate-700', 'border', 'text-slate-400');
    });

    // Update theme-btn buttons (old light theme style)
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.remove('border-brand-500', 'bg-brand-50', 'dark:bg-brand-900/20', 'text-brand-700', 'dark:text-brand-300');
        btn.classList.add('border-border', 'text-muted-foreground');
    });

    // Highlight current template button
    if (window.event && window.event.target) {
        const target = window.event.target;
        if (target.classList.contains('template-btn')) {
            target.classList.remove('border-slate-700', 'border', 'text-slate-400');
            target.classList.add('border-brand-500', 'border-2', 'bg-brand-500/20', 'text-brand-300');
        } else if (target.classList.contains('theme-btn')) {
            target.classList.remove('border-border', 'text-muted-foreground');
            target.classList.add('border-brand-500', 'bg-brand-50', 'dark:bg-brand-900/20', 'text-brand-700', 'dark:text-brand-300');
        }
    }

    updatePreview();
}

function setAccent(color) {
    state.accent = color;
    updatePreview();
}

function updatePreview() {
    // Get current form values
    const form = document.getElementById('portfolio-form');
    // Guard clause if form doesn't exist
    if (!form) return;

    // Update state from form fields (for contact info that's now editable)
    if (form.location) state.data.location = form.location.value;
    if (form.email) state.data.email = form.email.value;
    if (form.phone) state.data.phone = form.phone.value;
    if (form.linkedin) state.data.linkedin = form.linkedin.value;
    if (form.github) state.data.github = form.github.value;
    if (form.website) state.data.website = form.website.value;

    const data = {
        fullName: form.fullName ? form.fullName.value : '',
        title: form.title ? form.title.value : '',
        location: form.location ? form.location.value : '',
        bio: form.bio ? form.bio.value : '',
        skills: form.skills && form.skills.value ? form.skills.value.split(',').map(s => s.trim()) : [],
        expRole: form.expRole ? form.expRole.value : '',
        expCompany: form.expCompany ? form.expCompany.value : '',
        expDesc: form.expDesc ? form.expDesc.value : '',
        // Get all data from state
        experiences: state.data.experiences || [],
        education: state.data.education || [],
        projects: state.data.projects || [],
        certifications: state.data.certifications || [],
        languages: state.data.languages || [],
        awards: state.data.awards || [],
        customSections: state.data.customSections || [],
        email: form.email ? form.email.value : '',
        phone: form.phone ? form.phone.value : '',
        linkedin: form.linkedin ? form.linkedin.value : '',
        github: form.github ? form.github.value : '',
        website: form.website ? form.website.value : '',
        twitter: state.data.twitter || '',
        profilePhoto: state.data.profilePhoto || '' // Include profile photo
    };

    const container = document.getElementById('preview-container');
    const colors = accentColors[state.accent];

    let html = '';

    // --- TEMPLATE LOGIC ---
    // Only modern template is supported
    const initials = data.fullName ? data.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'ME';
    html = generateModernTemplate(data, initials);

    // Write to Iframe instead of innerHTML
    writeToIframe('preview-container', html);
}

// Helper function to render preview in preview mode container
function updatePreviewMode() {
    const data = {
        fullName: state.data.fullName || '',
        title: state.data.title || '',
        location: state.data.location || '',
        bio: state.data.bio || '',
        skills: state.data.skills ? (Array.isArray(state.data.skills) ? state.data.skills : state.data.skills.split(',').map(s => s.trim())) : [],
        expRole: state.data.expRole || '',
        expCompany: state.data.expCompany || '',
        expDesc: state.data.expDesc || '',
        experiences: state.data.experiences || [],
        education: state.data.education || [],
        projects: state.data.projects || [],
        certifications: state.data.certifications || [],
        languages: state.data.languages || [],
        awards: state.data.awards || [],
        customSections: state.data.customSections || [],
        email: state.data.email || '',
        phone: state.data.phone || '',
        linkedin: state.data.linkedin || '',
        github: state.data.github || '',
        website: state.data.website || '',
        twitter: state.data.twitter || '',
        profilePhoto: state.data.profilePhoto || ''
    };

    // Generate the same modern template HTML
    const initials = data.fullName ? data.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'ME';

    const html = generateModernTemplate(data, initials);
    writeToIframe('preview-mode-container', html);
}

// Helper function to write content to iframe
function writeToIframe(iframeId, bodyHtml) {
    const iframe = document.getElementById(iframeId);
    if (!iframe) return;

    // Check if iframe is accessible (same origin)
    try {
        const doc = iframe.contentDocument || iframe.contentWindow.document;

        const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- FontAwesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Outfit', 'sans-serif'],
                    },
                    colors: {
                        brand: { 50: '#eff6ff', 100: '#dbeafe', 500: '#3b82f6', 600: '#2563eb', 900: '#1e3a8a' }
                    }
                }
            }
        }
    </script>
    <style>
        ::-webkit-scrollbar { display: none; }
        html { -ms-overflow-style: none; scrollbar-width: none; }
    </style>
</head>
<body class="bg-gray-50 text-gray-900 font-sans">
    ${bodyHtml}
</body>
</html>`;

        doc.open();
        doc.write(fullHtml);
        doc.close();
    } catch (e) {
        console.error('Error writing to iframe:', e);
    }
}

// ==========================================
// 7. MANUAL CREATE HANDLER
// ==========================================
const manualCreateLink = document.getElementById('manual-create-link');
if (manualCreateLink) {
    manualCreateLink.addEventListener('click', (e) => {
        e.preventDefault();

        // Set empty data for manual creation
        state.data = {
            fullName: '',
            title: '',
            bio: '',
            skills: '',
            expRole: '',
            expCompany: '',
            expDesc: ''
        };

        // Transition to editor
        const landing = document.getElementById('landing-page');
        landing.style.opacity = '0';

        setTimeout(() => {
            landing.classList.add('hidden');
            const editor = document.getElementById('editor-app');
            editor.classList.remove('hidden');
            editor.classList.add('animate-fade-in-up');

            // Populate empty form
            populateForm();
            // Render empty preview
            updatePreview();
        }, 500);
    });
}

// ==========================================
// 8. CLICK-TO-EDIT FUNCTIONALITY
// ==========================================
document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-editable]');
    if (!target) return;

    const fieldName = target.getAttribute('data-editable');
    const currentValue = target.textContent.trim();

    // Create inline input
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentValue;
    input.className = 'bg-background text-foreground border-2 border-brand-500 rounded-lg px-3 py-2 w-full outline-none shadow-lg';

    // Replace element with input
    target.innerHTML = '';
    target.appendChild(input);
    input.focus();
    input.select();

    // Handle blur (save on focus loss)
    const saveEdit = () => {
        const newValue = input.value.trim();

        // Update form field
        const form = document.getElementById('portfolio-form');
        if (form && form[fieldName]) {
            form[fieldName].value = newValue;
        }

        // Trigger preview update
        updatePreview();

        showToast('Updated!', 'success');
    };

    input.addEventListener('blur', saveEdit);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            input.blur();
        }
        if (e.key === 'Escape') {
            input.value = currentValue;
            input.blur();
        }
    });
});

// ==========================================
// 9. DESKTOP/MOBILE VIEW TOGGLE
// ==========================================
const desktopViewBtn = document.getElementById('desktop-view-btn');
const mobileViewBtn = document.getElementById('mobile-view-btn');
const previewWrapper = document.getElementById('preview-wrapper');

let currentView = 'desktop'; // 'desktop' | 'mobile'

if (desktopViewBtn && mobileViewBtn && previewWrapper) {
    // Desktop View Button
    desktopViewBtn.addEventListener('click', () => {
        if (currentView === 'desktop') return;
        currentView = 'desktop';

        // Update button styles
        desktopViewBtn.classList.add('bg-card', 'shadow-sm', 'text-foreground');
        desktopViewBtn.classList.remove('text-muted-foreground');
        mobileViewBtn.classList.remove('bg-card', 'shadow-sm', 'text-foreground');
        mobileViewBtn.classList.add('text-muted-foreground');

        // Update preview wrapper - full width
        previewWrapper.classList.remove('max-w-[375px]', 'mx-auto');
        previewWrapper.classList.add('max-w-5xl', 'w-full');

        showToast('Desktop view', 'info');
    });

    // Mobile View Button
    mobileViewBtn.addEventListener('click', () => {
        if (currentView === 'mobile') return;
        currentView = 'mobile';

        // Update button styles
        mobileViewBtn.classList.add('bg-card', 'shadow-sm', 'text-foreground');
        mobileViewBtn.classList.remove('text-muted-foreground');
        desktopViewBtn.classList.remove('bg-card', 'shadow-sm', 'text-foreground');
        desktopViewBtn.classList.add('text-muted-foreground');

        // Update preview wrapper - mobile width (iPhone size)
        previewWrapper.classList.remove('max-w-5xl', 'w-full');
        previewWrapper.classList.add('max-w-[375px]', 'mx-auto');

        showToast('Mobile view', 'info');
    });
}

// ==========================================
// 10. MOBILE SIDEBAR TOGGLE
// ==========================================
const mobileSidebarToggle = document.getElementById('mobile-sidebar-toggle');
const mobileSidebarOverlay = document.getElementById('mobile-sidebar-overlay');
const editorSidebar = document.getElementById('editor-sidebar');

function openMobileSidebar() {
    if (!editorSidebar) return;
    editorSidebar.classList.remove('translate-x-full');
    editorSidebar.classList.add('translate-x-0');
    mobileSidebarOverlay?.classList.remove('hidden');
    mobileSidebarToggle?.querySelector('i')?.classList.replace('fa-sliders', 'fa-xmark');
}

function closeMobileSidebar() {
    if (!editorSidebar) return;
    editorSidebar.classList.remove('translate-x-0');
    editorSidebar.classList.add('translate-x-full');
    mobileSidebarOverlay?.classList.add('hidden');
    mobileSidebarToggle?.querySelector('i')?.classList.replace('fa-xmark', 'fa-sliders');
}

mobileSidebarToggle?.addEventListener('click', () => {
    if (editorSidebar?.classList.contains('translate-x-full')) {
        openMobileSidebar();
    } else {
        closeMobileSidebar();
    }
});

mobileSidebarOverlay?.addEventListener('click', closeMobileSidebar);

// ==========================================
// 11. EDITOR MOBILE MENU TOGGLE
// ==========================================
document.addEventListener('click', (e) => {
    const menu = document.getElementById('editor-mobile-menu');
    const btn = e.target.closest('button');

    // If menu is open and click is outside menu and outside the toggle button
    if (menu && !menu.classList.contains('hidden')) {
        // Check if click was on the toggle button itself (which has the ellipsis icon)
        const isToggleButton = btn && btn.querySelector('.fa-ellipsis-vertical');

        if (!menu.contains(e.target) && !isToggleButton) {
            menu.classList.add('hidden');
        }
    }
});

// ==========================================
// 12. PUBLISH MODAL LOGIC
// ==========================================
function openPublishModal() {
    const modal = document.getElementById('publish-modal');
    modal.classList.remove('hidden');
    // Ensure mobile menu is closed when opening modal
    const mobileMenu = document.getElementById('editor-mobile-menu');
    if (mobileMenu) {
        mobileMenu.classList.add('hidden');
    }
}

function closePublishModal() {
    const modal = document.getElementById('publish-modal');
    modal.classList.add('hidden');
}

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closePublishModal();
    }
});



