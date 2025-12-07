// ==========================================
// CvStudio - Resume Parser Module
// PDF Text Extraction + Server API Integration
// ==========================================

// ==========================================
// 1. PDF.JS AVAILABILITY CHECK
// ==========================================
function checkPdfJsAvailability() {
    if (typeof pdfjsLib === 'undefined') {
        throw new Error('PDF.js library not loaded. Please check your internet connection and refresh the page.');
    }

    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        try {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        } catch (e) {
            throw new Error('Failed to configure PDF.js worker. Please refresh the page.');
        }
    }

    return true;
}

// ==========================================
// 2. PDF TEXT EXTRACTION (Enhanced for Links & Layouts)
// ==========================================
async function extractTextFromPDF(file) {
    // Check PDF.js is available before proceeding
    checkPdfJsAvailability();

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async function (event) {
            try {
                const typedArray = new Uint8Array(event.target.result);

                // Load PDF with error handling
                let pdf;
                try {
                    pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
                } catch (pdfError) {
                    if (pdfError.message.includes('Invalid PDF')) {
                        throw new Error('Invalid PDF file. Please upload a valid PDF document.');
                    } else if (pdfError.message.includes('password')) {
                        throw new Error('This PDF is password-protected. Please upload an unprotected PDF.');
                    } else {
                        throw new Error('Failed to load PDF: ' + pdfError.message);
                    }
                }

                if (pdf.numPages === 0) {
                    throw new Error('PDF has no pages. Please upload a valid resume.');
                }

                let fullText = '';

                for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                    const page = await pdf.getPage(pageNum);
                    const viewport = page.getViewport({ scale: 1 });
                    const pageWidth = viewport.width;
                    const pageHeight = viewport.height;

                    // 1. Get Visible Text
                    const textContent = await page.getTextContent();

                    // 2. Get Hidden Links (Annotations)
                    const annotations = await page.getAnnotations();

                    // Process Text Items with position data
                    const items = textContent.items.map(item => ({
                        str: item.str,
                        x: item.transform[4],
                        y: item.transform[5],
                        h: item.height || 0,
                        width: item.width || 0
                    }));

                    // ==========================================
                    // COLUMN DETECTION ALGORITHM
                    // ==========================================
                    const midpoint = pageWidth / 2;
                    const margin = pageWidth * 0.1; // 10% margin for column detection

                    // Count items in left/right halves
                    const leftItems = items.filter(i => i.x < midpoint - margin);
                    const rightItems = items.filter(i => i.x > midpoint + margin);
                    const hasColumns = leftItems.length > 10 && rightItems.length > 10;

                    let pageText = '';

                    if (hasColumns) {
                        // Two-column layout: process left column first, then right
                        leftItems.sort((a, b) => b.y - a.y || a.x - b.x);
                        rightItems.sort((a, b) => b.y - a.y || a.x - b.x);

                        const leftText = leftItems.map(i => i.str).join(' ');
                        const rightText = rightItems.map(i => i.str).join(' ');

                        pageText = `[LEFT COLUMN]\n${leftText}\n\n[RIGHT COLUMN]\n${rightText}`;
                    } else {
                        // Single column: standard processing
                        items.sort((a, b) => {
                            if (Math.abs(a.y - b.y) < 5) return a.x - b.x;
                            return b.y - a.y;
                        });
                        pageText = items.map(item => item.str).join(' ');
                    }

                    // ==========================================
                    // LINK ATTRIBUTION
                    // Map links to nearby text content
                    // ==========================================
                    const attributedLinks = annotations
                        .filter(annot => annot.subtype === 'Link' && annot.url)
                        .map(annot => {
                            const [x1, y1, x2, y2] = annot.rect || [0, 0, 0, 0];
                            const linkCenterY = (y1 + y2) / 2;
                            const linkCenterX = (x1 + x2) / 2;

                            // Find text items near this link (within 15px Y tolerance)
                            const nearbyText = items
                                .filter(item => Math.abs(item.y - linkCenterY) < 15)
                                .sort((a, b) => Math.abs(a.x - linkCenterX) - Math.abs(b.x - linkCenterX))
                                .slice(0, 5) // Take closest 5 items
                                .map(item => item.str)
                                .join(' ')
                                .trim();

                            const context = nearbyText || 'Link';
                            return `[LINK: context="${context}" url="${annot.url}"]`;
                        })
                        .join('\n');

                    fullText += `--- PAGE ${pageNum} TEXT ---\n${pageText}\n\n`;
                    if (attributedLinks.length > 0) {
                        fullText += `--- PAGE ${pageNum} ATTRIBUTED LINKS ---\n${attributedLinks}\n\n`;
                    }
                }

                resolve(fullText.trim());
            } catch (error) {
                reject(new Error('PDF extraction failed: ' + error.message));
            }
        };

        reader.onerror = function () {
            reject(new Error('Failed to read the PDF file. The file may be corrupted.'));
        };

        reader.readAsArrayBuffer(file);
    });
}

// ==========================================
// 2. SERVER API CALL (All AI logic is on server)
// ==========================================
async function parseResumeViaServer(resumeText) {
    try {
        // Call the server endpoint - server handles API key and AI prompt
        const response = await fetch('/api/parse-resume', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                resumeText: resumeText
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error('Server API Error:', error);
        throw new Error('Failed to parse resume: ' + error.message);
    }
}

// ==========================================
// 3. MAIN PARSE FUNCTION
// ==========================================
async function parseResume(file, onProgress) {
    // Step 1: Reading PDF
    onProgress?.({ step: 1, message: 'Reading PDF file...' });

    // Step 2: Extract text from PDF (client-side)
    onProgress?.({ step: 2, message: 'Extracting content...' });
    const resumeText = await extractTextFromPDF(file);

    if (!resumeText || resumeText.length < 50) {
        throw new Error('Could not extract text. PDF might be image-based.');
    }

    // Step 3: Send to server for AI parsing
    onProgress?.({ step: 3, message: 'AI analyzing resume...' });
    const parsedData = await parseResumeViaServer(resumeText);

    // Step 4: Building portfolio
    onProgress?.({ step: 4, message: 'Building portfolio...' });

    return parsedData;
}

// ==========================================
// 4. UTILITY FUNCTIONS
// ==========================================
function formatParsedDataForState(parsedData) {
    const sections = parsedData.sections || [];

    // Flexible finder that checks both type AND name
    const findSection = (typeOrKeyword) => {
        const keyword = typeOrKeyword.toLowerCase();
        return sections.find(s =>
            s.type?.toLowerCase() === keyword ||
            s.name?.toLowerCase().includes(keyword)
        );
    };

    // Find sections with flexible matching
    const skillsSection = findSection('skills');
    const experienceSection = findSection('experience');
    const educationSection = findSection('education');
    const projectsSection = findSection('projects');
    const certificationsSection = findSection('certification'); // matches "certifications", "certification", etc.
    const languagesSection = findSection('language'); // matches "languages", "language"
    const awardsSection = findSection('award') || findSection('achievement'); // matches both

    const contact = parsedData.contact || {};

    const skillsArray = skillsSection?.items || [];

    // --- Profile/Contact Merge Logic ---
    let finalSections = sections;
    let finalContact = { ...contact };

    const profilesSectionIndex = finalSections.findIndex(s =>
        s.name.toLowerCase().includes('profile') || s.name.toLowerCase().includes('social')
    );

    if (profilesSectionIndex !== -1) {
        const profilesSection = finalSections[profilesSectionIndex];
        const remainingItems = [];

        if (Array.isArray(profilesSection.items)) {
            profilesSection.items.forEach(item => {
                const itemStr = typeof item === 'string' ? item.toLowerCase() : (item.title || item.name || '').toLowerCase();
                const itemLink = typeof item === 'object' ? item.link : '';
                let moved = false;

                if (!finalContact.twitter && (itemStr.includes('twitter') || itemStr.includes(' x ') || itemStr === 'x')) {
                    finalContact.twitter = itemLink || itemStr;
                    moved = true;
                } else if (!finalContact.github && itemStr.includes('github')) {
                    finalContact.github = itemLink || itemStr;
                    moved = true;
                } else if (!finalContact.linkedin && itemStr.includes('linkedin')) {
                    finalContact.linkedin = itemLink || itemStr;
                    moved = true;
                } else if (!finalContact.website) {
                    finalContact.website = itemLink || (typeof item === 'string' ? item : item.description || item.title);
                    moved = true;
                } else if (!finalContact.portfolio) {
                    finalContact.portfolio = itemLink || (typeof item === 'string' ? item : item.description || item.title);
                    moved = true;
                }

                if (!moved) {
                    if (typeof item === 'string') {
                        remainingItems.push({ title: item, description: '', link: '' });
                    } else {
                        remainingItems.push(item);
                    }
                }
            });

            if (remainingItems.length > 0) {
                finalSections[profilesSectionIndex].items = remainingItems;
            } else {
                finalSections.splice(profilesSectionIndex, 1);
            }
        }
    }

    return {
        fullName: parsedData.fullName || '',
        title: parsedData.title || '',
        location: parsedData.location || '',
        bio: parsedData.bio || '',
        skills: Array.isArray(skillsArray) ? skillsArray.join(', ') : '',
        skillsArray: skillsArray,
        sections: finalSections,

        // Mapped Arrays for UI
        experiences: (experienceSection?.items || []).map(exp => ({
            role: exp.title || '',
            company: exp.organization || '',
            duration: exp.duration || '',
            location: exp.location || '',
            description: exp.description || '',
            link: exp.link || ''
        })),
        education: (educationSection?.items || []).map(edu => ({
            degree: edu.title || '',
            institution: edu.organization || '',
            year: edu.duration || '',
            description: edu.description || '',
            gpa: edu.gpa || '',
            link: edu.link || ''
        })),
        projects: (projectsSection?.items || []).map(proj => ({
            name: proj.title || '',
            description: proj.description || '',
            technologies: proj.technologies || '',
            link: proj.link || '',
            github: proj.github || ''
        })),

        // New sections - use the pre-found sections or initialize as empty arrays
        certifications: (certificationsSection?.items || parsedData.certifications || []).map((cert, idx) => ({
            id: Date.now() + idx,
            name: typeof cert === 'string' ? cert : (cert.title || cert.name || ''),
            issuer: typeof cert === 'object' ? (cert.organization || cert.issuer || '') : '',
            year: typeof cert === 'object' ? (cert.duration || cert.year || '') : '',
            link: typeof cert === 'object' ? (cert.link || '') : ''
        })),
        languages: (languagesSection?.items || []).map((lang, idx) => ({
            id: Date.now() + idx + 100,
            name: typeof lang === 'string' ? lang : (lang.title || lang.name || ''),
            proficiency: typeof lang === 'object' ? (lang.proficiency || lang.level || 'Fluent') : 'Fluent'
        })),
        awards: (awardsSection?.items || []).map((award, idx) => ({
            id: Date.now() + idx + 200,
            title: typeof award === 'string' ? award : (award.title || award.name || ''),
            issuer: typeof award === 'object' ? (award.organization || award.issuer || '') : '',
            year: typeof award === 'object' ? (award.duration || award.year || '') : '',
            description: typeof award === 'object' ? (award.description || '') : ''
        })),

        // Filter out standard sections to leave only custom ones
        // Check both type and name to properly exclude matched sections
        customSections: finalSections.filter(s => {
            const type = (s.type || '').toLowerCase();
            const name = (s.name || '').toLowerCase();
            const excludeKeywords = ['skills', 'experience', 'education', 'projects', 'certification', 'language', 'award', 'achievement'];
            return !excludeKeywords.some(keyword => type.includes(keyword) || name.includes(keyword));
        }),

        // Contact
        email: finalContact.email || '',
        phone: finalContact.phone || '',
        linkedin: finalContact.linkedin || '',
        github: finalContact.github || '',
        website: finalContact.website || '',
        twitter: finalContact.twitter || '',

        // Legacy Fields
        expRole: experienceSection?.items?.[0]?.title || '',
        expCompany: experienceSection?.items?.[0]?.organization || '',
        expDesc: experienceSection?.items?.[0]?.description || '',

        _fullData: parsedData
    };
}
