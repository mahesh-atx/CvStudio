// ==========================================
// CvStudio - Template Renderer Module
// Generates the Modern Portfolio Template HTML
// ==========================================

/**
 * Generates the modern portfolio template HTML
 * @param {Object} data - Portfolio data object
 * @param {string} initials - User's initials for avatar fallback
 * @returns {string} - Complete HTML template string
 */
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
