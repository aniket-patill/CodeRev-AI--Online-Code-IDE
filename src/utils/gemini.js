import { GoogleGenerativeAI } from "@google/generative-ai";

// Service types for API key management
const SERVICES = {
    DOCS: 'docs',
    CHAT: 'chat',
    FIX: 'fix',
    AUTOCOMPLETE: 'autocomplete'
};

// Service-specific API key environment variable mapping
const SERVICE_API_KEY_MAP = {
    [SERVICES.DOCS]: 'GEMINI_API_KEY_DOCS',
    [SERVICES.CHAT]: 'GEMINI_API_KEY_CHAT',
    [SERVICES.FIX]: 'GEMINI_API_KEY_FIX',
    [SERVICES.AUTOCOMPLETE]: 'GEMINI_API_KEY_AUTOCOMPLETE'
};

// Cache for lazy-initialized Gemini clients per service
const clientCache = new Map();

/**
 * Get API key for a specific service with fallback to shared key
 * @param {string} service - Service type (docs, chat, fix, autocomplete)
 * @returns {string} API key
 */
const getServiceApiKey = (service) => {
    // Try service-specific key first
    const serviceKeyName = SERVICE_API_KEY_MAP[service];
    const serviceKey = serviceKeyName ? process.env[serviceKeyName] : null;
    
    if (serviceKey) {
        console.log(`[Gemini] Using service-specific key for: ${service}`);
        return serviceKey;
    }
    
    // Fallback to shared key
    const sharedKey = process.env.GEMINI_API_KEY;
    if (sharedKey) {
        console.log(`[Gemini] Using shared key for: ${service}`);
        return sharedKey;
    }
    
    throw new Error(
        `No API key configured for service "${service}". ` +
        `Set either ${serviceKeyName} or GEMINI_API_KEY in your environment variables.`
    );
};

/**
 * Get or create a Gemini client for a specific service
 * @param {string} service - Service type
 * @returns {GoogleGenerativeAI}
 */
const getClientForService = (service) => {
    const apiKey = getServiceApiKey(service);
    const cacheKey = `${service}_${apiKey.slice(-8)}`; // Cache by service + key suffix
    
    if (!clientCache.has(cacheKey)) {
        clientCache.set(cacheKey, new GoogleGenerativeAI(apiKey));
    }
    
    return clientCache.get(cacheKey);
};

/**
 * Get model for a specific service
 * @param {string} service - Service type
 * @param {string} modelName - Model name
 * @returns {GenerativeModel}
 */
const getModelForService = (service, modelName = "gemini-2.5-flash") => {
    return getClientForService(service).getGenerativeModel({ model: modelName });
};

/**
 * Execute API call with retry logic and exponential backoff
 * @param {Function} apiCall - The API call function to execute
 * @param {number} maxRetries - Maximum retry attempts
 * @param {number} baseDelay - Base delay in ms for exponential backoff
 * @returns {Promise<any>}
 */
const executeWithRetry = async (apiCall, maxRetries = 3, baseDelay = 1000) => {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await apiCall();
        } catch (error) {
            lastError = error;
            const errorMessage = error?.message || '';
            
            // Check if it's a rate limit error (429) or quota exceeded
            const isRateLimitError = 
                error?.status === 429 || 
                errorMessage.includes('429') ||
                errorMessage.includes('quota') ||
                errorMessage.includes('rate limit');
            
            if (isRateLimitError && attempt < maxRetries) {
                const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
                console.log(`[Gemini] Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            
            // For non-rate-limit errors or final attempt, throw
            throw error;
        }
    }
    
    throw lastError;
};

// Clean up response text
const cleanResponse = (text, removeOriginal = "") => {
    if (!text) return "";
    let cleaned = text.trim();
    // Remove markdown code blocks
    cleaned = cleaned.replace(/```[\s\S]*?```/g, (match) => {
        return match.replace(/```[a-z]*\n?/gi, "").replace(/```/g, "");
    });
    // Remove original code if it appears
    if (removeOriginal) {
        cleaned = cleaned.replace(removeOriginal, "");
    }
    // Remove triple backticks
    cleaned = cleaned.replace(/```/g, "");
    return cleaned.trim();
};

/**
 * Generate documentation for code
 * @param {string} code 
 * @param {string} language 
 * @returns {Promise<string>}
 */
export const generateDocumentation = async (code, language) => {
    const candidateModels = [
        "gemini-3-flash",
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite"
    ];

    const prompt = `
    Generate detailed documentation for the following code.
    The documentation should be in plain text format, NOT as code comments.
    Do not include any code blocks or markdown formatting like bold or italics if possible, just clean text.
    Explain the purpose, functionality, and key components of the code.
    Do not include the original code in the response.
    Code:
    ${code}
    `;

    for (const modelName of candidateModels) {
        try {
            const model = getModelForService(SERVICES.DOCS, modelName);
            const result = await executeWithRetry(() => model.generateContent(prompt));
            let documentation = result?.response?.text?.()?.trim() ?? "";

            // Clean up
            documentation = documentation.replace(code, "").trim();
            if (language) {
                documentation = documentation.replace(language, "").trim();
            }
            documentation = documentation.replace(/`{3}/g, "").replace(/`{3}$/g, "");

            if (documentation) {
                return documentation;
            }
        } catch (error) {
            console.error(`Gemini API Error (generateDocumentation) with ${modelName}:`, error?.message || error);
        }
    }

    throw new Error("Failed to generate documentation");
};

/**
 * Get chat response
 * @param {string} message 
 * @returns {Promise<string>}
 */
export const getChatResponse = async (message, codeContext) => {
    const candidateModels = [
        "gemini-3-flash",
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite"
    ];

    const contextPrompt = codeContext ? `\n\nHere is the current code in the editor for context:\n\`\`\`\n${codeContext}\n\`\`\`\n\n` : "";
    const prompt = `you an ai chat bot , who helps people in giving code and solve their probems . your response will directly be shown in the text , so give the response like a chat  and your request is this  ${message}${contextPrompt},also if asked to generate code generate them with predefined inputs dont ask for inputs from user. if the message is not related to coding or technical stuff reply i am a coding assistant i can only help you with coding related stuff . be very concise and clear in your response dont make it very lengthy and if the message is not clear ask for more clarity dont make assumptions. `;

    for (const modelName of candidateModels) {
        try {
            const model = getModelForService(SERVICES.CHAT, modelName);
            const result = await executeWithRetry(() => model.generateContent(prompt));
            const response = result?.response?.text?.()?.trim() ?? "";

            if (response) {
                return response;
            }
        } catch (error) {
            console.error(`Gemini API Error (getChatResponse) with ${modelName}:`, error?.message || error);
        }
    }

    throw new Error("Failed to generate response");
};

/**
 * Auto-complete code
 * @param {string} code 
 * @param {string} language 
 * @returns {Promise<string>}
 */
export const autoComplete = async (code, language) => {
    const candidateModels = [
        "gemini-3-flash",
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite"
    ];

    const prompt = `generate clear and concise documentation in the form of comments to be added at the end of the 
    code file for the code also if useful add Timecomplexity and space complexity if needed: ${code}. use the approapriate comment format for the language of the code.`;

    for (const modelName of candidateModels) {
        try {
            const model = getModelForService(SERVICES.AUTOCOMPLETE, modelName);
            const result = await executeWithRetry(() => model.generateContent(prompt));
            let documentation = result?.response?.text?.()?.trim() ?? "";

            documentation = documentation.replace(/```[\s\S]*?```/g, "");
            documentation = documentation.replace(code, "").trim();

            if (documentation) {
                return documentation;
            }
        } catch (error) {
            console.error(`Gemini API Error (autoComplete) with ${modelName}:`, error?.message || error);
        }
    }

    throw new Error("Failed to generate documentation");
};

/**
 * Fix code errors with model fallback
 * @param {string} code 
 * @returns {Promise<{fixedCode: string, aiFixed: boolean, message?: string}>}
 */
export const fixCode = async (code) => {
    const candidateModels = [
        "gemini-3-flash",
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite"
    ];

    const prompt = `Fix the syntax errors in the following code:\n\n${code}\n\nReturn only the corrected code without any comments or markdown formatting. Preserve any existing comments.`;

    for (const modelName of candidateModels) {
        try {
            const model = getModelForService(SERVICES.FIX, modelName);
            const result = await executeWithRetry(() => model.generateContent([{ text: prompt }]));
            const text = result?.response?.text?.() ?? "";
            const fixedCode = (text || "").replace(/```[a-z]*\n?/gi, "").replace(/```/g, "").trim();

            if (fixedCode) {
                return { fixedCode, aiFixed: true };
            }
        } catch (err) {
            console.error(`AI Fix Error with ${modelName}:`, err?.message || err);
        }
    }

    return { fixedCode: code, aiFixed: false, message: "No fixes needed or could not determine fixes" };
};
