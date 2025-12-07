const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper to get model
const getModel = (modelName = "gemini-2.5-flash") => {
    return genAI.getGenerativeModel({ model: modelName });
};

// Clean up response text
const cleanResponse = (text, removeOriginal = "") => {
    if (!text) return "";
    let cleaned = text.trim();
    // Remove markdown code blocks
    cleaned = cleaned.replace(/```[\s\S]*?```/g, (match) => {
        // Keep content inside code blocks if needed, but for now we often want raw text or specific formats
        // If the prompt asked for code, we might want to keep it, but usually we want to strip the markers
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
    try {
        const model = getModel();
        const prompt = `
        Generate detailed documentation for the following code.
        The documentation should be in plain text format, NOT as code comments.
        Do not include any code blocks or markdown formatting like bold or italics if possible, just clean text.
        Explain the purpose, functionality, and key components of the code.
        Do not include the original code in the response.
        Code:
        ${code}
        `;

        const result = await model.generateContent(prompt);
        let documentation = result.response.text().trim();

        // Clean up
        documentation = documentation.replace(code, "").trim();
        if (language) {
            documentation = documentation.replace(language, "").trim();
        }
        documentation = documentation.replace(/`{3}/g, "").replace(/`{3}$/g, "");

        return documentation;
    } catch (error) {
        console.error("Gemini API Error (generateDocumentation):", error);
        throw new Error("Failed to generate documentation");
    }
};

/**
 * Get chat response
 * @param {string} message 
 * @returns {Promise<string>}
 */
export const getChatResponse = async (message, codeContext) => {
    try {
        const model = getModel();
        const contextPrompt = codeContext ? `\n\nHere is the current code in the editor for context:\n\`\`\`\n${codeContext}\n\`\`\`\n\n` : "";
        const prompt = `you an ai chat bot , who helps people in giving code and solve their probems . your response will directly be shown in the text , so give the response like a chat  and your request is this  ${message}${contextPrompt},also if asked to generate code generate them with predefined inputs dont ask for inputs from user. if the message is not related to coding or technical stuff reply i am a coding assistant i can only help you with coding related stuff . be very concise and clear in your response dont make it very lengthy and if the message is not clear ask for more clarity dont make assumptions. `;

        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch (error) {
        console.error("Gemini API Error (getChatResponse):", error);
        throw new Error("Failed to generate response");
    }
};

/**
 * Auto-complete code
 * @param {string} code 
 * @param {string} language 
 * @returns {Promise<string>}
 */
export const autoComplete = async (code, language) => {
    try {
        const model = getModel();
        const prompt = `generate clear and concise documentation in the form of comments to be added at the end of the 
        code file for the code also if useful add Timecomplexity and space complexity if needed: ${code}. use the approapriate comment format for the language of the code.`;

        const result = await model.generateContent(prompt);
        let documentation = result.response.text().trim();

        documentation = documentation.replace(/```[\s\S]*?```/g, "");
        documentation = documentation.replace(code, "").trim();

        return documentation;
    } catch (error) {
        console.error("Gemini API Error (autoComplete):", error);
        throw new Error("Failed to generate documentation");
    }
};

/**
 * Fix code errors
 * @param {string} code 
 * @returns {Promise<{fixedCode: string, aiFixed: boolean, message?: string}>}
 */
export const fixCode = async (code) => {
    const candidateModels = [
        "gemini-2.5-flash",
        "gemini-1.5-pro",
        "gemini-1.5-flash"
    ];

    const prompt = `Fix the syntax errors in the following code:\n\n${code}\n\nReturn only the corrected code without any comments or markdown formatting. Preserve any existing comments.`;

    for (const modelName of candidateModels) {
        try {
            const model = getModel(modelName);
            const result = await model.generateContent([{ text: prompt }]);
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
