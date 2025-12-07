// ==========================================
// FolioFlow Backend Server
// Secure API Proxy - All AI logic is handled here
// ==========================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static files from the project root (parent of server folder)
app.use(express.static(path.join(__dirname, '..')));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==========================================
// SYSTEM PROMPT - All AI logic is here (secure)
// ==========================================
const RESUME_PARSER_SYSTEM_PROMPT = `You are an expert resume parser. Extract ALL information EXACTLY as written.

CRITICAL INSTRUCTION FOR PROFILES & CONTACTS:
1. Look for a section named "Profiles" or "Socials".
2. Extract these links and handles into the 'contact' object.
   - Map "X" or "Twitter" to contact.twitter
   - Map "GitHub" to contact.github
   - Map "LinkedIn" to contact.linkedin
   - Map ANY other profile (e.g., "Spacing Whale", Personal Blog, Portfolio) to 'contact.website' or 'contact.portfolio'.
3. **IMPORTANT**: Prioritize mapping to contact fields. 
4. If there are MORE links than can fit in the contact fields (e.g., multiple portfolios), KEEP the remaining ones in the "Profiles" section in the 'sections' array. Do not lose any data.

CRITICAL INSTRUCTION FOR LAYOUT:
1. Extract ALL other sections found (Interests, Languages, Awards, Volunteering).
2. Do NOT summarize bullet points. Keep them verbatim.
3. Use the "HIDDEN LINKS" section to find URLs for projects and profiles.

Return ONLY valid JSON:
{
    "fullName": "Name",
    "title": "Professional Title",
    "location": "City, Country",
    "bio": "Full professional summary",
    "contact": {
        "email": "Email",
        "phone": "Phone",
        "linkedin": "LinkedIn URL",
        "github": "GitHub URL",
        "website": "Personal Website or Blog URL",
        "twitter": "Twitter Handle/URL",
        "portfolio": "Portfolio URL"
    },
    "sections": [
        {
            "name": "Skills",
            "type": "skills",
            "items": ["skill1", "skill2"]
        },
        {
            "name": "Work Experience",
            "type": "experience",
            "items": [
                {
                    "title": "Job Title",
                    "organization": "Company",
                    "duration": "Dates",
                    "location": "Location",
                    "description": "FULL description with bullet points.",
                    "link": "URL"
                }
            ]
        },
        {
            "name": "Projects",
            "type": "projects",
            "items": [
                {
                    "title": "Project Name",
                    "description": "Full detailed description",
                    "technologies": "Tech Stack",
                    "link": "Project URL",
                    "github": "Repo URL"
                }
            ]
        },
        {
            "name": "Education",
            "type": "education",
            "items": [
                {
                    "title": "Degree",
                    "organization": "School",
                    "duration": "Year",
                    "description": "Details",
                    "gpa": "GPA"
                }
            ]
        },
        {
            "name": "Interests",
            "type": "custom",
            "items": ["Interest 1", "Interest 2"]
        },
        {
            "name": "Languages",
            "type": "custom",
            "items": ["Language 1", "Language 2"]
        },
        {
            "name": "Any Other Header",
            "type": "custom",
            "items": [
                {
                    "title": "Item Name",
                    "description": "Description",
                    "link": "URL"
                }
            ]
        }
    ]
}`;

// ==========================================
// MAIN RESUME PARSING ENDPOINT
// Accepts: { resumeText: "..." }
// Returns: Parsed JSON data
// ==========================================
app.post('/api/parse-resume', async (req, res) => {
    try {
        const { resumeText } = req.body;

        // Validate input
        if (!resumeText || typeof resumeText !== 'string') {
            return res.status(400).json({ error: 'resumeText is required and must be a string' });
        }

        if (resumeText.length < 50) {
            return res.status(400).json({ error: 'Resume text is too short. PDF might be image-based.' });
        }

        // Check API key
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'Server API key not configured. Please set GROQ_API_KEY in .env file.' });
        }

        // Build messages array (server-side only)
        const messages = [
            { role: 'system', content: RESUME_PARSER_SYSTEM_PROMPT },
            { role: 'user', content: `Parse this resume text and hidden links:\n\n${resumeText}` }
        ];

        // Get model from env (with fallback)
        const primaryModel = process.env.MODEL_NAME || 'openai/gpt-oss-120b';
        const fallbackModel = process.env.FALLBACK_MODEL || 'llama-3.1-8b-instant';
        const temperature = 0.1;
        const max_tokens = 8000;

        // Try primary model first
        console.log(`📝 Parsing resume with ${primaryModel}...`);
        let response = await callGroqAPI(apiKey, primaryModel, messages, temperature, max_tokens);

        // If rate limited, try fallback model
        if (response.status === 429 && fallbackModel) {
            console.log(`⚠️ Primary model rate limited, switching to fallback (${fallbackModel})`);
            response = await callGroqAPI(apiKey, fallbackModel, messages, temperature, max_tokens);
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Groq API Error:', errorData);
            return res.status(response.status).json({
                error: errorData.error?.message || `AI API error: ${response.status}`
            });
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            return res.status(500).json({ error: 'No response from AI model' });
        }

        // Parse and clean the JSON response
        let jsonString = content.trim();

        // Clean markdown code blocks if present
        if (jsonString.includes('```json')) {
            jsonString = jsonString.split('```json')[1].split('```')[0].trim();
        } else if (jsonString.startsWith('```')) {
            jsonString = jsonString.replace(/```\w*\n?/g, '').replace(/```$/g, '').trim();
        }

        // Parse JSON
        let parsedResume;
        try {
            parsedResume = JSON.parse(jsonString);
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            console.error('Raw content:', jsonString.substring(0, 500));
            return res.status(500).json({ error: 'Failed to parse AI response as JSON' });
        }

        console.log(`✅ Successfully parsed resume for: ${parsedResume.fullName || 'Unknown'}`);
        res.json(parsedResume);

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

// ==========================================
// HELPER: Call Groq API
// ==========================================
async function callGroqAPI(apiKey, model, messages, temperature, max_tokens) {
    return fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model,
            messages,
            temperature,
            max_tokens
        })
    });
}

// ==========================================
// CATCH-ALL: Serve index.html for SPA routing
// ==========================================
app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`\n✅ FolioFlow Server running on http://localhost:${PORT}`);
    console.log(`📝 API Key configured: ${process.env.GROQ_API_KEY ? 'Yes' : '❌ No - Set GROQ_API_KEY in .env'}`);
    console.log(`🤖 Primary Model: ${process.env.MODEL_NAME || 'openai/gpt-oss-120b'}`);
    console.log(`🔄 Fallback Model: ${process.env.FALLBACK_MODEL || 'llama-3.1-8b-instant'}`);
    console.log(`\n🔒 Security: All API keys are handled server-side only.\n`);
});

const RENDER_URL = process.env.RENDER_EXTERNAL_URL;
const PING_INTERVAL_MS = 14 * 60 * 1000;

if (RENDER_URL) {
    setInterval(() => {
        try {
            https
                .get(RENDER_URL, (res) => {
                    if (res.statusCode === 200) {
                        console.log(
                            `[Self-Ping] Successful. Status: ${res.statusCode}. Server remains awake.`
                        );
                    } else {
                        console.log(
                            `[Self-Ping] Received status: ${res.statusCode}. Server remains awake.`
                        );
                    }
                })
                .on("error", (err) => {
                    console.error("[Self-Ping] Error:", err.message);
                });
        } catch (error) {
            console.error("[Self-Ping] Error initiating ping:", error);
        }
    }, PING_INTERVAL_MS);
    console.log(
        `✅ Self-Ping job scheduled to run every 14 minutes on ${RENDER_URL}`
    );
} else {
    console.log("⚠️ Self-Ping skipped: RENDER_EXTERNAL_URL not found.");
}

