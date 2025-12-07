// ==========================================
// Date Parsing Utilities
// Standardizes various date formats from resumes
// ==========================================

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Parse a date string into a standardized format
 * @param {string} dateStr - Date string in various formats
 * @returns {Object|null} - Parsed date object with year, month, display
 */
function parseDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return null;

    dateStr = dateStr.trim();

    // Handle "Present", "Current", "Now", "Ongoing"
    if (/present|current|now|ongoing|today/i.test(dateStr)) {
        return { isPresent: true, display: 'Present' };
    }

    let month = null, year = null;

    // Pattern 1: "January 2023", "Jan 2023", "january 2023"
    let match = dateStr.match(/^([A-Za-z]+)\s*[,.]?\s*(\d{4})$/);
    if (match) {
        const monthStr = match[1].toLowerCase();
        month = MONTH_NAMES.findIndex(m => m.toLowerCase().startsWith(monthStr));
        if (month === -1) month = MONTH_ABBR.findIndex(m => m.toLowerCase() === monthStr);
        year = parseInt(match[2]);
    }

    // Pattern 2: "01/2023", "1/2023", "01-2023"
    if (!year && (match = dateStr.match(/^(\d{1,2})[\/-](\d{4})$/))) {
        month = parseInt(match[1]) - 1;
        year = parseInt(match[2]);
    }

    // Pattern 3: "2023-01", "2023/01"
    if (!year && (match = dateStr.match(/^(\d{4})[\/-](\d{1,2})$/))) {
        year = parseInt(match[1]);
        month = parseInt(match[2]) - 1;
    }

    // Pattern 4: Just year "2023"
    if (!year && (match = dateStr.match(/^(\d{4})$/))) {
        year = parseInt(match[1]);
    }

    // Pattern 5: Full date "January 15, 2023" or "Jan 15 2023"
    if (!year && (match = dateStr.match(/^([A-Za-z]+)\s+\d{1,2}[,.]?\s*(\d{4})$/))) {
        const monthStr = match[1].toLowerCase();
        month = MONTH_NAMES.findIndex(m => m.toLowerCase().startsWith(monthStr));
        if (month === -1) month = MONTH_ABBR.findIndex(m => m.toLowerCase() === monthStr);
        year = parseInt(match[2]);
    }

    if (!year) return null;

    // Validate month range
    if (month !== null && (month < 0 || month > 11)) {
        month = null;
    }

    return {
        year,
        month: month !== null ? month : undefined,
        display: month !== null ? `${MONTH_ABBR[month]} ${year}` : `${year}`
    };
}

/**
 * Format a date range from start to end dates
 * @param {string} startDate - Start date string
 * @param {string} endDate - End date string
 * @returns {string} - Formatted date range
 */
function formatDateRange(startDate, endDate) {
    const start = parseDate(startDate);
    const end = parseDate(endDate);

    if (!start && !end) return '';
    if (!start) return end.isPresent ? 'Present' : end.display;
    if (!end) return `${start.display} – Present`;
    if (end.isPresent) return `${start.display} – Present`;

    // Same year - can abbreviate
    if (start.year === end.year && start.month !== undefined && end.month !== undefined) {
        return `${MONTH_ABBR[start.month]} – ${MONTH_ABBR[end.month]} ${end.year}`;
    }

    return `${start.display} – ${end.display}`;
}

/**
 * Normalize a duration string that might already be formatted
 * @param {string} duration - Duration string like "2020 - 2023" or "Jan 2020 to Dec 2023"
 * @returns {string} - Normalized duration string
 */
function normalizeDuration(duration) {
    if (!duration || typeof duration !== 'string') return '';

    duration = duration.trim();

    // Check if it's a range with separators
    const rangeSeparators = [' - ', ' – ', ' to ', ' until ', ' through '];
    for (const sep of rangeSeparators) {
        if (duration.toLowerCase().includes(sep.toLowerCase())) {
            const parts = duration.split(new RegExp(sep, 'i'));
            if (parts.length === 2) {
                return formatDateRange(parts[0].trim(), parts[1].trim());
            }
        }
    }

    // Not a range, try to parse as single date
    const parsed = parseDate(duration);
    return parsed ? parsed.display : duration;
}

// Export for use in other modules (if using modules)
if (typeof window !== 'undefined') {
    window.parseDate = parseDate;
    window.formatDateRange = formatDateRange;
    window.normalizeDuration = normalizeDuration;
}
