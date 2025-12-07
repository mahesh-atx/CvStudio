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
        console.log('File input changed', e.target.files);
        if (e.target.files.length) {
            console.log('File selected:', e.target.files[0].name);
            handleFile(e.target.files[0]);
        }
    });
}

// Toast Notification System
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

// Confetti Animation
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

// ==========================================
// PROGRESS UI UPDATE FUNCTION
// ==========================================
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

            console.log('Parsed resume data:', parsedData);
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



// Helper function for download from preview mode
function downloadSiteFromPreview() {
    const portfolioContent = document.getElementById('preview-mode-container').innerHTML;
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
    a.download = `${fullName.toLowerCase().replace(/\s+/g, '-')}-portfolio.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Portfolio exported successfully!');
}

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
// 4.2 REUSABLE TEMPLATE GENERATOR
// ==========================================
function generateModernTemplate(data, initials) {
    const menuId = 'mobile-menu-' + Math.random().toString(36).substr(2, 9);

    // Helper for custom sections (e.g., Languages, Awards, leftover Profiles)
    const customSectionsHtml = (data.customSections && data.customSections.length > 0) ? data.customSections.map(section => `
            <section id="${section.name.toLowerCase().replace(/\s+/g, '-')}" class="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                <div class="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-10">
                    <div class="flex-1 h-px bg-gray-200"></div>
                    <h2 class="text-base sm:text-xl font-bold text-gray-900 whitespace-nowrap text-center">${section.name}</h2>
                    <div class="flex-1 h-px bg-gray-200"></div>
                </div>
                <div class="space-y-3 sm:space-y-4">
                    ${Array.isArray(section.items) ? section.items.map(item => {
        // Handle string items (like languages list)
        if (typeof item === 'string') {
            // Check if string is a URL or has link-like structure
            if (item.startsWith('http') || item.includes('.com') || item.includes('.io')) {
                return `<a href="${item}" target="_blank" class="block w-full px-4 py-3 border border-gray-100 rounded-lg hover:bg-gray-50 text-blue-600 truncate"><i class="fa-solid fa-link mr-2"></i>${item}</a>`;
            }
            return `<span class="inline-block px-3 py-1.5 mr-2 mb-2 border border-gray-300 rounded-full text-xs sm:text-sm text-gray-700">${item}</span>`;
        }
        // Handle object items (certifications, awards, profiles)
        return `
                            <div class="pb-3 border-b border-gray-100 last:border-0">
                                <h3 class="font-bold text-gray-900 text-xs sm:text-base break-words">${item.title || item.name || ''}</h3>
                                ${item.organization || item.issuer ? `<p class="text-gray-600 text-xs sm:text-sm">${item.organization || item.issuer}</p>` : ''}
                                ${item.duration || item.date ? `<p class="text-gray-500 text-xs">${item.duration || item.date}</p>` : ''}
                                ${item.description ? `<p class="text-gray-600 text-xs sm:text-sm mt-1 break-words whitespace-pre-line">${item.description}</p>` : ''}
                                ${item.link ? `<a href="${item.link}" target="_blank" class="inline-flex items-center gap-1 mt-2 text-blue-600 hover:text-blue-800 text-xs"><i class="fa-solid fa-external-link-alt"></i>View</a>` : ''}
                            </div>
                        `;
    }).join('') : ''}
                </div>
            </section>
            `).join('') : '';

    return `

        <div class="min-h-full bg-gray-50 text-gray-900 font-sans">
            <!-- Navigation -->
            <div class="sticky top-0 md:top-4 z-50 transition-all duration-300">
                <div class="max-w-3xl mx-auto md:px-0">
                    <div class="bg-white/90 backdrop-blur-xl border-b border-gray-100 md:border md:border-white/40 md:shadow-xl md:ring-1 md:ring-white/50 md:rounded-full relative">
                        <div class="px-4 py-2 md:px-5 md:py-2 flex items-center justify-between">
                            <!-- Logo/Initials -->
                            <div class="flex items-center gap-3">
                                ${data.profilePhoto ?
            `<img src="${data.profilePhoto}" alt="${data.fullName || 'Profile'}" class="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-2 ring-white shadow-sm">` :
            `<div class="w-8 h-8 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm">${initials}</div>`
        }
                                <span class="font-bold text-gray-900 text-sm tracking-tight">${data.fullName || 'Portfolio'}</span>
                            </div>
                            
                            <!-- Desktop Navigation Links -->
                            <div class="hidden md:flex items-center gap-1 bg-gray-100/50 p-1 rounded-full border border-gray-100/50">
                                <a href="#home" class="px-3 py-1 rounded-full text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-sm transition-all duration-200">Home</a>
                                <a href="#projects" class="px-3 py-1 rounded-full text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-sm transition-all duration-200">Projects</a>
                                <a href="#experience" class="px-3 py-1 rounded-full text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-sm transition-all duration-200">Experience</a>
                                <a href="#education" class="px-3 py-1 rounded-full text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-sm transition-all duration-200">Education</a>
                                <a href="#contact" class="px-3 py-1 rounded-full text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-sm transition-all duration-200">Contact</a>
                            </div>
                            
                            <!-- Hamburger Button (Mobile Only) -->
                            <button onclick="const menu = document.getElementById('${menuId}'); menu.classList.toggle('hidden'); this.querySelector('i').classList.toggle('fa-bars'); this.querySelector('i').classList.toggle('fa-xmark');" class="md:hidden w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition active:scale-95">
                                <i class="fa-solid fa-bars text-sm"></i>
                            </button>
                        </div>
                        
                        <!-- Mobile Menu (Hidden by default) -->
                        <div id="${menuId}" class="hidden md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-xl px-4 py-4 rounded-b-2xl">
                            <div class="flex flex-col gap-1 text-sm text-gray-600">
                                <a href="#home" class="py-2 px-4 rounded-xl hover:bg-gray-50 transition font-medium flex items-center gap-3"><i class="fa-solid fa-home text-blue-500/70 w-5"></i>Home</a>
                                <a href="#projects" class="py-2 px-4 rounded-xl hover:bg-gray-50 transition font-medium flex items-center gap-3"><i class="fa-solid fa-briefcase text-purple-500/70 w-5"></i>Projects</a>
                                <a href="#experience" class="py-2 px-4 rounded-xl hover:bg-gray-50 transition font-medium flex items-center gap-3"><i class="fa-solid fa-layer-group text-emerald-500/70 w-5"></i>Experience</a>
                                <a href="#education" class="py-2 px-4 rounded-xl hover:bg-gray-50 transition font-medium flex items-center gap-3"><i class="fa-solid fa-graduation-cap text-orange-500/70 w-5"></i>Education</a>
                                <a href="#contact" class="py-2 px-4 rounded-xl hover:bg-gray-50 transition font-medium flex items-center gap-3"><i class="fa-solid fa-paper-plane text-rose-500/70 w-5"></i>Contact</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Hero Section -->
            <section id="home" class="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-10 sm:pb-16">
                <div class="flex flex-col items-center gap-4 sm:gap-8 mb-8 sm:mb-12">
                    ${data.profilePhoto ?
            `<img src="${data.profilePhoto}" alt="${data.fullName || 'Profile'}" class="w-20 h-20 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white shadow-lg flex-shrink-0">` :
            `<div class="w-20 h-20 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-700 text-2xl sm:text-4xl font-bold border-4 border-white shadow-lg flex-shrink-0">${initials}</div>`
        }
                    <div class="text-center">
                        <h1 class="text-xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 break-words">Hey, I'm ${data.fullName || 'Your Name'}</h1>
                        <p class="text-gray-600 text-sm sm:text-lg break-words">${data.title || 'Your Title'}${data.location ? ` • ${data.location}` : ''}</p>
                        <div class="flex flex-wrap gap-2 sm:gap-3 mt-4 justify-center">
                            <button class="px-3 sm:px-5 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-50 transition">Get In Touch</button>
                            <button class="px-3 sm:px-5 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-50 transition">View Resume</button>
                        </div>
                    </div>
                </div>
                
                ${data.bio ? `<p class="text-gray-600 leading-relaxed text-sm sm:text-base max-w-3xl break-words text-center mx-auto">${data.bio}</p>` : ''}

                <!-- Technical Skills -->
                ${Array.isArray(data.skills) && data.skills.length > 0 ? `
                <div class="mt-6 sm:mt-10">
                    <h3 class="font-bold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base text-center">Technical Skills</h3>
                    <div class="flex flex-wrap gap-1.5 sm:gap-2 justify-center">
                        ${data.skills.map(skill => `<span class="px-2 sm:px-4 py-1 sm:py-1.5 border border-gray-300 rounded-full text-xs sm:text-sm text-gray-700 font-mono">${skill}</span>`).join('')}
                    </div>
                </div>
                ` : ''}
            </section>

            <!-- Featured Projects -->
            ${data.projects && data.projects.length > 0 ? `
            <section id="projects" class="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                <div class="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-10">
                    <div class="flex-1 h-px bg-gray-200"></div>
                    <h2 class="text-base sm:text-xl font-bold text-gray-900 whitespace-nowrap">Featured Projects</h2>
                    <div class="flex-1 h-px bg-gray-200"></div>
                </div>
                <div class="space-y-6 sm:space-y-8">
                    ${data.projects.map(project => `
                        <div class="pb-6 sm:pb-8 border-b border-gray-100 last:border-0">
                            <h3 class="text-sm sm:text-lg font-bold text-gray-900 mb-2 break-words">${project.name || ''}</h3>
                            <p class="text-gray-600 mb-3 sm:mb-4 leading-relaxed text-xs sm:text-base break-words whitespace-pre-line">${project.description || ''}</p>
                            ${project.technologies ? `
                            <div class="flex flex-wrap gap-1.5 sm:gap-2 mb-3">
                                ${project.technologies.split(',').map(tech => `<span class="px-2 sm:px-3 py-0.5 sm:py-1 border border-gray-300 rounded text-xs text-gray-600 font-mono">${tech.trim()}</span>`).join('')}
                            </div>
                            ` : ''}
                            ${(project.link || project.github) ? `
                            <div class="flex flex-wrap gap-2 mt-2">
                                ${project.github ? `<a href="${project.github}" target="_blank" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-700 transition"><i class="fa-brands fa-github"></i>GitHub</a>` : ''}
                                ${project.link ? `<a href="${project.link}" target="_blank" class="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 transition"><i class="fa-solid fa-external-link-alt"></i>View Project</a>` : ''}
                            </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </section>
            ` : ''}

            <!-- Work Experience -->
            <section id="experience" class="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                <div class="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-10">
                    <div class="flex-1 h-px bg-gray-200"></div>
                    <h2 class="text-base sm:text-xl font-bold text-gray-900 whitespace-nowrap">Work Experience</h2>
                    <div class="flex-1 h-px bg-gray-200"></div>
                </div>
                <div class="space-y-6 sm:space-y-8">
                    ${data.experiences && data.experiences.length > 0 ? data.experiences.map(exp => `
                        <div class="pb-4 sm:pb-6">
                            <div class="flex flex-col gap-0.5 mb-1">
                                <h3 class="text-sm sm:text-lg font-bold text-gray-900 break-words">${exp.role || ''}</h3>
                                <span class="text-xs sm:text-sm text-gray-500">${exp.duration || ''}</span>
                            </div>
                            <p class="text-gray-600 mb-2 text-xs sm:text-base break-words">${exp.company || ''}</p>
                            <p class="text-gray-600 leading-relaxed text-xs sm:text-sm break-words">${exp.description || ''}</p>
                        </div>
                    `).join('') : `
                        <div class="pb-4 sm:pb-6">
                            <h3 class="text-sm sm:text-lg font-bold text-gray-900">${data.expRole || 'Your Role'}</h3>
                            <p class="text-gray-600 mb-2 text-xs sm:text-base">${data.expCompany || 'Company Name'} • ${data.expDuration || 'Duration'}</p>
                            <p class="text-gray-600 leading-relaxed text-xs sm:text-sm">${data.expDesc || 'Description of your work...'}</p>
                        </div>
                    `}
                </div>
            </section>

            <!-- Education -->
            ${data.education && data.education.length > 0 ? `
            <section id="education" class="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                <div class="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-10">
                    <div class="flex-1 h-px bg-gray-200"></div>
                    <h2 class="text-base sm:text-xl font-bold text-gray-900">Education</h2>
                    <div class="flex-1 h-px bg-gray-200"></div>
                </div>
                <div class="space-y-4 sm:space-y-6">
                    ${data.education.map(edu => `
                        <div class="flex flex-col gap-0.5">
                            <h3 class="font-bold text-gray-900 uppercase text-xs sm:text-base break-words">${edu.degree || ''}</h3>
                            <p class="text-gray-600 text-xs sm:text-base break-words">${edu.institution || ''}</p>
                            <span class="text-xs sm:text-sm text-gray-500">${edu.year || ''}</span>
                        </div>
                    `).join('')}
                </div>
            </section>
            ` : ''}

            <!-- Achievements & Certifications -->
            ${data.certifications && data.certifications.length > 0 ? `
            <section id="certifications" class="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                <div class="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-10">
                    <div class="flex-1 h-px bg-gray-200"></div>
                    <h2 class="text-base sm:text-xl font-bold text-gray-900 whitespace-nowrap text-center">Achievements & Certifications</h2>
                    <div class="flex-1 h-px bg-gray-200"></div>
                </div>
                <div class="space-y-3 sm:space-y-4">
                    ${data.certifications.map(cert => `
                        <div>
                            <h3 class="font-bold text-gray-900 text-xs sm:text-base break-words">${cert.name || ''}</h3>
                            <p class="text-gray-500 text-xs sm:text-sm break-words">${cert.issuer || ''}</p>
                        </div>
                    `).join('')}
                </div>
            </section>
            ` : ''}

            <!-- Languages -->
            ${data.languages && data.languages.length > 0 ? `
            <section id="languages" class="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                <div class="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-10">
                    <div class="flex-1 h-px bg-gray-200"></div>
                    <h2 class="text-base sm:text-xl font-bold text-gray-900 whitespace-nowrap text-center">Languages</h2>
                    <div class="flex-1 h-px bg-gray-200"></div>
                </div>
                <div class="flex flex-wrap gap-3 justify-center">
                    ${data.languages.map(lang => `
                        <span class="px-4 py-2 bg-gray-100 rounded-lg text-sm">
                            <span class="font-semibold text-gray-900">${lang.name || ''}</span>
                            ${lang.proficiency ? `<span class="text-gray-500 ml-1">(${lang.proficiency})</span>` : ''}
                        </span>
                    `).join('')}
                </div>
            </section>
            ` : ''}

            <!-- Awards & Achievements -->
            ${data.awards && data.awards.length > 0 ? `
            <section id="awards" class="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                <div class="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-10">
                    <div class="flex-1 h-px bg-gray-200"></div>
                    <h2 class="text-base sm:text-xl font-bold text-gray-900 whitespace-nowrap text-center">Awards & Achievements</h2>
                    <div class="flex-1 h-px bg-gray-200"></div>
                </div>
                <div class="space-y-3 sm:space-y-4">
                    ${data.awards.map(award => `
                        <div class="p-4 bg-gray-50 rounded-lg">
                            <div class="flex justify-between items-start">
                                <div>
                                    <h3 class="font-bold text-gray-900 text-sm sm:text-base">${award.title || ''}</h3>
                                    <p class="text-gray-600 text-xs sm:text-sm">${award.issuer || ''}</p>
                                    ${award.description ? `<p class="text-gray-500 text-xs sm:text-sm mt-1">${award.description}</p>` : ''}
                                </div>
                                ${award.year ? `<span class="text-gray-500 text-xs sm:text-sm whitespace-nowrap ml-4">${award.year}</span>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </section>
            ` : ''}

            <!-- DYNAMIC CUSTOM SECTIONS (Including Profile Overflow) -->
            ${customSectionsHtml}

            <!-- Contact -->
            ${(data.email || data.phone || data.linkedin || data.github) ? `
            <section id="contact" class="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 pb-16 sm:pb-20">
                <div class="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-10">
                    <div class="flex-1 h-px bg-gray-200"></div>
                    <h2 class="text-base sm:text-xl font-bold text-gray-900">Contact</h2>
                    <div class="flex-1 h-px bg-gray-200"></div>
                </div>
                <div class="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4 justify-center items-center">
                    ${data.email ? `<a href="mailto:${data.email}" class="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-xs sm:text-sm"><i class="fa-solid fa-envelope text-gray-500"></i><span class="truncate">${data.email}</span></a>` : ''}
                    ${data.phone ? `<a href="tel:${data.phone}" class="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-xs sm:text-sm"><i class="fa-solid fa-phone text-gray-500"></i>${data.phone}</a>` : ''}
                    ${data.linkedin ? `<a href="${data.linkedin}" target="_blank" class="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-xs sm:text-sm"><i class="fa-brands fa-linkedin text-gray-500"></i>LinkedIn</a>` : ''}
                    ${data.github ? `<a href="${data.github}" target="_blank" class="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-xs sm:text-sm"><i class="fa-brands fa-github text-gray-500"></i>GitHub</a>` : ''}
                    ${data.website ? `<a href="${data.website}" target="_blank" class="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-xs sm:text-sm"><i class="fa-solid fa-globe text-gray-500"></i>Website</a>` : ''}
                    ${data.twitter ? `<a href="${data.twitter}" target="_blank" class="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-xs sm:text-sm"><i class="fa-brands fa-x-twitter text-gray-500"></i>Twitter</a>` : ''}
                </div>
            </section>
            ` : ''}
        </div>
    `;
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

    // Common Logic for Custom Sections in Minimal/Bold templates
    const renderCustomSectionsSimple = () => {
        if (!data.customSections || data.customSections.length === 0) return '';
        return data.customSections.map(section => `
            <div class="mt-8">
                <h3 class="font-bold mb-4 ${state.template === 'bold' ? 'text-white border-b border-slate-700 pb-2 text-xl' : colors.text}">${section.name}</h3>
                <div class="space-y-4">
                    ${Array.isArray(section.items) ? section.items.map(item => {
            if (typeof item === 'string') return `<span class="block text-sm ${state.template === 'bold' ? 'text-slate-400' : 'text-muted-foreground'} mb-1">• ${item}</span>`;
            return `
                            <div>
                                <div class="font-bold ${state.template === 'bold' ? 'text-white' : 'text-foreground'}">${item.title || item.name || ''}</div>
                                ${(item.organization || item.issuer) ? `<div class="text-xs ${state.template === 'bold' ? 'text-slate-500' : 'text-muted-foreground'}">${item.organization || item.issuer}</div>` : ''}
                                ${item.description ? `<div class="text-sm ${state.template === 'bold' ? 'text-slate-400' : 'text-muted-foreground'} mt-1">${item.description}</div>` : ''}
                            </div>
                        `;
        }).join('') : ''}
                </div>
            </div>
        `).join('');
    };

    if (state.template === 'modern') {
        // Get initials for avatar
        const initials = data.fullName ? data.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'ME';

        html = generateModernTemplate(data, initials);
    } else if (state.template === 'minimal') {
        html = `
            <div class="min-h-full bg-muted/30 text-foreground p-8 md:p-12 flex flex-col items-center text-center">
                ${data.profilePhoto ?
                `<img src="${data.profilePhoto}" alt="${data.fullName || 'Profile'}" class="w-24 h-24 rounded-full object-cover mb-6 shadow-xl">` :
                `<div class="w-24 h-24 rounded-full ${colors.bg} flex items-center justify-center text-white text-3xl font-bold mb-6 shadow-xl">${data.fullName ? data.fullName.charAt(0) : 'A'}</div>`
            }
                <h1 class="text-4xl font-bold mb-2 text-foreground">${data.fullName}</h1>
                <p class="text-lg text-muted-foreground mb-8">${data.title}${data.location ? ` • ${data.location}` : ''}</p>
                
                <div class="w-12 h-1 ${colors.bg} mb-8"></div>
                
                <p class="max-w-xl text-muted-foreground leading-loose mb-12">${data.bio}</p>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl text-left">
                    <!-- Experience Card -->
                    <div class="bg-card p-6 rounded-xl shadow-sm border border-border">
                        <h3 class="font-bold mb-4 ${colors.text}">Experience</h3>
                        ${data.experiences && data.experiences.length > 0 ? data.experiences.map(exp => `
                            <div class="mb-4 pb-4 border-b border-border last:border-0 last:mb-0 last:pb-0">
                                <div class="font-bold text-foreground">${exp.role}</div>
                                <div class="text-sm text-muted-foreground mb-1">${exp.company}${exp.duration ? ` • ${exp.duration}` : ''}</div>
                                <div class="text-sm text-muted-foreground">${exp.description}</div>
                            </div>
                        `).join('') : `
                            <div class="mb-4">
                                <div class="font-bold text-foreground">${data.expRole || 'Your Role'}</div>
                                <div class="text-sm text-muted-foreground mb-2">${data.expCompany || 'Company'}</div>
                                <div class="text-sm text-muted-foreground">${data.expDesc || 'Description...'}</div>
                            </div>
                        `}
                    </div>
                    
                    <!-- Skills Card -->
                    <div class="bg-card p-6 rounded-xl shadow-sm border border-border">
                        <h3 class="font-bold mb-4 ${colors.text}">Expertise</h3>
                        <div class="flex flex-wrap gap-2">
                            ${data.skills.map(skill => `<span class="text-sm text-muted-foreground border border-border px-2 py-1 rounded">${skill}</span>`).join('')}
                        </div>
                    </div>
                    
                    <!-- Projects Card -->
                    ${data.projects && data.projects.length > 0 ? `
                    <div class="bg-card p-6 rounded-xl shadow-sm border border-border">
                        <h3 class="font-bold mb-4 ${colors.text}">Projects</h3>
                        ${data.projects.map(project => `
                            <div class="mb-4 pb-4 border-b border-border last:border-0 last:mb-0 last:pb-0">
                                <div class="font-bold text-foreground">${project.name}</div>
                                <div class="text-sm text-muted-foreground mb-2">${project.description}</div>
                                ${project.technologies ? `<div class="flex flex-wrap gap-1">${project.technologies.split(',').map(t => `<span class="text-xs px-2 py-0.5 bg-muted rounded">${t.trim()}</span>`).join('')}</div>` : ''}
                            </div>
                        `).join('')}
                    </div>
                    ` : ''}
                    
                    <!-- Education Card -->
                    ${data.education && data.education.length > 0 ? `
                    <div class="bg-card p-6 rounded-xl shadow-sm border border-border">
                        <h3 class="font-bold mb-4 ${colors.text}">Education</h3>
                        ${data.education.map(edu => `
                            <div class="mb-4 pb-4 border-b border-border last:border-0 last:mb-0 last:pb-0">
                                <div class="font-bold text-foreground">${edu.degree}</div>
                                <div class="text-sm text-muted-foreground">${edu.institution}${edu.year ? ` • ${edu.year}` : ''}</div>
                            </div>
                        `).join('')}
                    </div>
                    ` : ''}
                    
                    <!-- Certifications Card -->
                    ${data.certifications && data.certifications.length > 0 ? `
                    <div class="bg-card p-6 rounded-xl shadow-sm border border-border">
                        <h3 class="font-bold mb-4 ${colors.text}">Certifications</h3>
                        ${data.certifications.map(cert => `
                            <div class="mb-3 last:mb-0">
                                <div class="font-bold text-foreground text-sm">${cert.name}</div>
                                <div class="text-xs text-muted-foreground">${cert.issuer}</div>
                            </div>
                        `).join('')}
                    </div>
                    ` : ''}
                    
                    <!-- Languages Card -->
                    ${data.languages && data.languages.length > 0 ? `
                    <div class="bg-card p-6 rounded-xl shadow-sm border border-border">
                        <h3 class="font-bold mb-4 ${colors.text}">Languages</h3>
                        <div class="flex flex-wrap gap-2">
                            ${data.languages.map(lang => `
                                <span class="text-sm text-foreground border border-border px-3 py-1.5 rounded-lg">
                                    ${lang.name}${lang.proficiency ? ` (${lang.proficiency})` : ''}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}
                    
                    <!-- Awards Card -->
                    ${data.awards && data.awards.length > 0 ? `
                    <div class="bg-card p-6 rounded-xl shadow-sm border border-border">
                        <h3 class="font-bold mb-4 ${colors.text}">Awards & Achievements</h3>
                        ${data.awards.map(award => `
                            <div class="mb-3 last:mb-0">
                                <div class="font-bold text-foreground text-sm">${award.title}</div>
                                <div class="text-xs text-muted-foreground">${award.issuer}${award.year ? ` • ${award.year}` : ''}</div>
                                ${award.description ? `<div class="text-xs text-muted-foreground mt-1">${award.description}</div>` : ''}
                            </div>
                        `).join('')}
                    </div>
                    ` : ''}
                    
                    ${renderCustomSectionsSimple()}
                </div>
                
                <!-- Contact Section -->
                ${(data.email || data.phone || data.linkedin || data.github) ? `
                <div class="mt-12 flex flex-wrap gap-4 justify-center">
                    ${data.email ? `<a href="mailto:${data.email}" class="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg hover:bg-muted transition text-sm"><i class="fa-solid fa-envelope ${colors.text}"></i>${data.email}</a>` : ''}
                    ${data.linkedin ? `<a href="${data.linkedin}" target="_blank" class="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg hover:bg-muted transition text-sm"><i class="fa-brands fa-linkedin ${colors.text}"></i>LinkedIn</a>` : ''}
                    ${data.github ? `<a href="${data.github}" target="_blank" class="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg hover:bg-muted transition text-sm"><i class="fa-brands fa-github ${colors.text}"></i>GitHub</a>` : ''}
                </div>
                ` : ''}
            </div>
        `;
    } else if (state.template === 'bold') {
        html = `
            <div class="min-h-full bg-slate-900 text-white p-8 md:p-16">
                <div class="max-w-4xl mx-auto">
                    <!-- Header with Photo -->
                    <div class="flex items-center gap-8 mb-8">
                        ${data.profilePhoto ?
                `<img src="${data.profilePhoto}" alt="${data.fullName || 'Profile'}" class="w-28 h-28 rounded-2xl object-cover border-4 border-slate-700 shadow-2xl">` : ''
            }
                        <div>
                            <h1 class="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                                ${data.fullName.split(' ')[0]}<br>
                                ${data.fullName.split(' ')[1] || ''}
                            </h1>
                            <div class="text-xl md:text-2xl font-light text-${state.accent}-400 mt-2">${data.title}${data.location ? ` • ${data.location}` : ''}</div>
                        </div>
                    </div>
                    
                    <!-- Bio -->
                    <div class="bg-slate-800 p-8 rounded-2xl mb-12 border border-slate-700">
                        <p class="text-lg text-slate-300 leading-relaxed font-light">${data.bio}</p>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <!-- Experience Column -->
                        <div>
                            <h3 class="text-xl font-bold text-white mb-6 border-b border-slate-700 pb-2">Experience</h3>
                            ${data.experiences && data.experiences.length > 0 ? data.experiences.map(exp => `
                                <div class="mb-6">
                                    <div class="text-xl font-bold text-white">${exp.role}</div>
                                    <div class="text-${state.accent}-400 mb-1">${exp.company}${exp.duration ? ` • ${exp.duration}` : ''}</div>
                                    <p class="text-slate-400 font-light text-sm">${exp.description}</p>
                                </div>
                            `).join('') : `
                                <div class="mb-6">
                                    <div class="text-xl font-bold text-white">${data.expRole || 'Your Role'}</div>
                                    <div class="text-${state.accent}-400 mb-2">${data.expCompany || 'Company'}</div>
                                    <p class="text-slate-400 font-light">${data.expDesc || 'Description...'}</p>
                                </div>
                            `}
                            
                            <!-- Education -->
                            ${data.education && data.education.length > 0 ? `
                            <h3 class="text-xl font-bold text-white mb-6 border-b border-slate-700 pb-2 mt-10">Education</h3>
                            ${data.education.map(edu => `
                                <div class="mb-4">
                                    <div class="text-lg font-bold text-white">${edu.degree}</div>
                                    <div class="text-${state.accent}-400">${edu.institution}${edu.year ? ` • ${edu.year}` : ''}</div>
                                </div>
                            `).join('')}
                            ` : ''}
                        </div>
                        
                        <!-- Right Column -->
                        <div>
                            <h3 class="text-xl font-bold text-white mb-6 border-b border-slate-700 pb-2">Tech Stack</h3>
                            <div class="flex flex-wrap gap-3 mb-8">
                                ${data.skills.map(skill => `<span class="px-4 py-2 bg-slate-800 text-${state.accent}-300 rounded-lg text-sm border border-slate-700">${skill}</span>`).join('')}
                            </div>
                            
                            <!-- Projects -->
                            ${data.projects && data.projects.length > 0 ? `
                            <h3 class="text-xl font-bold text-white mb-6 border-b border-slate-700 pb-2 mt-10">Projects</h3>
                            ${data.projects.map(project => `
                                <div class="mb-6 bg-slate-800 p-4 rounded-xl border border-slate-700">
                                    <div class="text-lg font-bold text-white">${project.name}</div>
                                    <p class="text-slate-400 font-light text-sm mt-1">${project.description}</p>
                                    ${project.technologies ? `<div class="flex flex-wrap gap-2 mt-3">${project.technologies.split(',').map(t => `<span class="text-xs px-2 py-1 bg-slate-700 text-${state.accent}-300 rounded">${t.trim()}</span>`).join('')}</div>` : ''}
                                    ${(project.link || project.github) ? `<div class="flex gap-2 mt-3">
                                        ${project.github ? `<a href="${project.github}" target="_blank" class="text-xs text-${state.accent}-400 hover:underline"><i class="fa-brands fa-github mr-1"></i>GitHub</a>` : ''}
                                        ${project.link ? `<a href="${project.link}" target="_blank" class="text-xs text-${state.accent}-400 hover:underline"><i class="fa-solid fa-external-link-alt mr-1"></i>Live</a>` : ''}
                                    </div>` : ''}
                                </div>
                            `).join('')}
                            ` : ''}
                            
                            <!-- Certifications -->
                            ${data.certifications && data.certifications.length > 0 ? `
                            <h3 class="text-xl font-bold text-white mb-6 border-b border-slate-700 pb-2 mt-10">Certifications</h3>
                            ${data.certifications.map(cert => `
                                <div class="mb-3">
                                    <div class="font-bold text-white text-sm">${cert.name}</div>
                                    <div class="text-xs text-slate-500">${cert.issuer}</div>
                                </div>
                            `).join('')}
                            ` : ''}
                            
                            <!-- Languages -->
                            ${data.languages && data.languages.length > 0 ? `
                            <h3 class="text-xl font-bold text-white mb-6 border-b border-slate-700 pb-2 mt-10">Languages</h3>
                            <div class="flex flex-wrap gap-2">
                                ${data.languages.map(lang => `
                                    <span class="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white">
                                        ${lang.name}${lang.proficiency ? ` <span class="text-slate-400">(${lang.proficiency})</span>` : ''}
                                    </span>
                                `).join('')}
                            </div>
                            ` : ''}
                            
                            <!-- Awards -->
                            ${data.awards && data.awards.length > 0 ? `
                            <h3 class="text-xl font-bold text-white mb-6 border-b border-slate-700 pb-2 mt-10">Awards & Achievements</h3>
                            ${data.awards.map(award => `
                                <div class="mb-4 bg-slate-800 p-4 rounded-xl border border-slate-700">
                                    <div class="flex justify-between items-start">
                                        <div>
                                            <div class="font-bold text-white text-sm">${award.title}</div>
                                            <div class="text-xs text-slate-500">${award.issuer}</div>
                                            ${award.description ? `<div class="text-xs text-slate-400 mt-1">${award.description}</div>` : ''}
                                        </div>
                                        ${award.year ? `<span class="text-xs text-slate-500">${award.year}</span>` : ''}
                                    </div>
                                </div>
                            `).join('')}
                            ` : ''}
                            
                            ${renderCustomSectionsSimple()}
                        </div>
                    </div>
                    
                    <!-- Contact Footer -->
                    ${(data.email || data.phone || data.linkedin || data.github) ? `
                    <div class="mt-16 pt-8 border-t border-slate-700 flex flex-wrap gap-4 justify-center">
                        ${data.email ? `<a href="mailto:${data.email}" class="flex items-center gap-2 px-5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition text-sm"><i class="fa-solid fa-envelope text-${state.accent}-400"></i><span class="text-white">${data.email}</span></a>` : ''}
                        ${data.linkedin ? `<a href="${data.linkedin}" target="_blank" class="flex items-center gap-2 px-5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition text-sm"><i class="fa-brands fa-linkedin text-${state.accent}-400"></i><span class="text-white">LinkedIn</span></a>` : ''}
                        ${data.github ? `<a href="${data.github}" target="_blank" class="flex items-center gap-2 px-5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition text-sm"><i class="fa-brands fa-github text-${state.accent}-400"></i><span class="text-white">GitHub</span></a>` : ''}
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

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
// 6. HELPER FUNCTIONS
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

function downloadSite(offline = false) {
    // Get the portfolio HTML content (without browser chrome)
    const portfolioContent = document.getElementById('preview-container').innerHTML;

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
    <script src="https://cdn.tailwindcss.com"><\\/script>
    
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

// Utility function to download offline version
function downloadSiteOffline() {
    downloadSite(true);
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