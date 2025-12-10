/**
 * Maps file extensions to programming language identifiers
 * Compatible with Monaco Editor and Piston API
 */
export const getLanguageFromFilename = (filename) => {
    if (!filename || typeof filename !== 'string') {
        return "javascript";
    }

    // Extract extension from filename
    const parts = filename.split('.');
    if (parts.length < 2) {
        return "javascript"; // No extension found
    }

    const extension = parts.pop().toLowerCase();

    // Extension to language mapping
    const extensionMap = {
        // JavaScript family
        js: "javascript",
        jsx: "javascript",
        mjs: "javascript",
        cjs: "javascript",

        // TypeScript family
        ts: "typescript",
        tsx: "typescript",

        // Python
        py: "python",
        pyw: "python",

        // Java
        java: "java",

        // C
        c: "c",
        h: "c",

        // C++
        cpp: "cpp",
        cc: "cpp",
        cxx: "cpp",
        hpp: "cpp",
        hxx: "cpp",

        // C#
        cs: "csharp",

        // PHP
        php: "php",

        // Web Technologies
        html: "html",
        htm: "html",
        css: "css",
        scss: "css",
        sass: "css",
        less: "css",

        // Data formats
        json: "json",
        xml: "xml",
        yml: "yaml",
        yaml: "yaml",

        // Documentation
        md: "markdown",
        markdown: "markdown",
        txt: "plaintext",

        // Other languages
        go: "go",
        rs: "rust",
        rb: "ruby",
        sql: "sql",
        sh: "shell",
        bash: "shell",
        ps1: "powershell",
    };

    return extensionMap[extension] || "javascript";
};
