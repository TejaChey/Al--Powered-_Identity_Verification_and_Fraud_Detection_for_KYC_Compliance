// src/services/clientOCR.js
// Client-side OCR using Tesseract.js for real-time preview before upload
import Tesseract from "tesseract.js";

/**
 * Parse raw OCR text to extract ID fields
 * @param {string} text - Raw OCR text
 * @returns {Object} - Parsed data with name, aadhaar, pan, dob, etc.
 */
function parseOCRText(text) {
    const parsed = {
        name: null,
        aadhaarNumber: null,
        panNumber: null,
        dlNumber: null,
        dob: null,
        gender: null,
        address: null,
        documentType: null,
    };

    // Clean text
    const full = text.replace(/\n+/g, " ").replace(/\s+/g, " ").trim();
    const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 2);

    // 1. Extract Aadhaar (12 digits, possibly with spaces)
    const aadhaarMatch = full.match(/\b(\d{4}\s?\d{4}\s?\d{4})\b/);
    if (aadhaarMatch) {
        parsed.aadhaarNumber = aadhaarMatch[1].replace(/\s/g, "");
        parsed.documentType = "Aadhaar";
    }

    // 2. Extract PAN (5 letters + 4 digits + 1 letter)
    const panMatch = full.match(/\b[A-Z]{5}\d{4}[A-Z]\b/);
    if (panMatch) {
        parsed.panNumber = panMatch[0];
        parsed.documentType = "PAN";
    }

    // 3. Extract DOB (dd/mm/yyyy or dd-mm-yyyy)
    const dobMatch = full.match(/\b(\d{1,2}[-/]\d{1,2}[-/]\d{4})\b/);
    if (dobMatch) {
        parsed.dob = dobMatch[1];
    }

    // 4. Extract Gender
    const genderMatch = full.match(/\b(MALE|FEMALE|Male|Female|Transgender)\b/i);
    if (genderMatch) {
        parsed.gender = genderMatch[1].charAt(0).toUpperCase() + genderMatch[1].slice(1).toLowerCase();
    }

    // 5. Extract Name (look for "Name:" pattern or multi-word lines)
    const nameMatch = full.match(/(?:Name|S\.?\s*Name)[:\s\-]+([A-Za-z][A-Za-z\s\.]{2,50})(?=\n|$|DOB|Date|[0-9])/i);
    if (nameMatch) {
        parsed.name = nameMatch[1].trim().replace(/\s+/g, " ");
    } else {
        // Fallback: find multi-word lines that look like names
        const badPatterns = ["GOVERNMENT", "INDIA", "AADHAAR", "PAN", "LICENSE", "DEPT", "DEPARTMENT"];
        for (const line of lines) {
            const clean = line.replace(/[^A-Za-z\s\.]/g, "").trim();
            const words = clean.split(" ").filter((w) => w.length >= 2);
            if (
                words.length >= 2 &&
                clean.length >= 5 &&
                clean.length <= 50 &&
                !badPatterns.some((bp) => clean.toUpperCase().includes(bp))
            ) {
                parsed.name = clean;
                break;
            }
        }
    }

    // 6. Extract DL Number
    const dlMatch = full.match(/(?:DL|License|Licence)[\s\-:]*([A-Z0-9\-]{6,20})/i);
    if (dlMatch) {
        parsed.dlNumber = dlMatch[1].replace(/[^A-Z0-9]/gi, "");
        parsed.documentType = "DrivingLicence";
    }

    // 7. Detect document type from keywords
    if (!parsed.documentType) {
        if (/AADHAAR/i.test(full)) parsed.documentType = "Aadhaar";
        else if (/DRIVING|LICENSE|LICENCE/i.test(full)) parsed.documentType = "DrivingLicence";
        else if (/PERMANENT|ACCOUNT|PAN/i.test(full)) parsed.documentType = "PAN";
    }

    return parsed;
}

/**
 * Mask sensitive ID numbers (show only last 4 chars)
 */
function maskNumber(num) {
    if (!num || num.length <= 4) return num || "";
    const visible = num.slice(-4);
    const masked = "X".repeat(num.length - 4);
    // Format nicely for Aadhaar
    if (num.length === 12) {
        return `XXXX-XXXX-${visible}`;
    }
    return masked + visible;
}

/**
 * Run OCR on an image file and return parsed results
 * @param {File} file - Image file to process
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<Object>} - OCR results with parsed data
 */
export async function runClientOCR(file, onProgress = () => { }) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();

        Tesseract.recognize(file, "eng", {
            logger: (m) => {
                if (m.status === "recognizing text" && m.progress) {
                    onProgress(Math.round(m.progress * 100));
                }
            },
        })
            .then(({ data: { text } }) => {
                const processingTime = Date.now() - startTime;
                const parsed = parseOCRText(text);

                // Build result object
                const result = {
                    rawText: text,
                    parsed,
                    name: parsed.name,
                    aadhaarNumber: parsed.aadhaarNumber,
                    panNumber: parsed.panNumber,
                    dlNumber: parsed.dlNumber,
                    dob: parsed.dob,
                    gender: parsed.gender,
                    documentType: parsed.documentType,
                    // Masked versions for display
                    maskedAadhaar: maskNumber(parsed.aadhaarNumber),
                    maskedPan: maskNumber(parsed.panNumber),
                    maskedDl: maskNumber(parsed.dlNumber),
                    // Metadata
                    processingTimeMs: processingTime,
                    source: "client-tesseract.js",
                };

                resolve(result);
            })
            .catch((err) => {
                reject(err);
            });
    });
}

/**
 * Quick check if Tesseract.js is available
 */
export function isTesseractAvailable() {
    return typeof Tesseract !== "undefined";
}

const ClientOCR = {
    runClientOCR,
    parseOCRText,
    maskNumber,
    isTesseractAvailable,
};

export default ClientOCR;
