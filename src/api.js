import axios from "axios";
import { LANGUAGE_VERSIONS } from "./constants";

const API = axios.create({
  baseURL: "https://emkc.org/api/v2/piston",
});

const UNIFIED_RUNTIME_LANGUAGES = ["python", "cpp", "java"];

export const executeCode = async (language, sourceCode, stdin = '') => {
  const lang = (language || "").toLowerCase().trim();
  if (UNIFIED_RUNTIME_LANGUAGES.includes(lang)) {
    try {
      const { executeCode: run } = await import("@/runtime/executeCode");
      const result = await run(language, sourceCode, stdin || undefined);
      return {
        run: {
          output: result.output || "",
          stdout: result.output || "",
          stderr: result.error || "",
          code: result.success ? 0 : 1,
        },
      };
    } catch (err) {
      console.error("Unified runtime execution error:", err);
      throw err;
    }
  }

  try {
    // Define file extensions for different languages
    const getFileExtension = (lang) => {
      const extensions = {
        javascript: 'js',
        typescript: 'ts',
        python: 'py',
        java: 'java',
        c: 'c',
        cpp: 'cpp',
        csharp: 'cs',
        php: 'php'
      };
      return extensions[lang] || lang;
    };

    // Map language names to Piston API language names
    const getPistonLanguage = (lang) => {
      const languageMap = {
        cpp: 'c++',
        csharp: 'csharp'
      };
      return languageMap[lang] || lang;
    };

    const requestBody = {
      language: getPistonLanguage(language),
      version: LANGUAGE_VERSIONS[language],
      files: [
        {
          name: `main.${getFileExtension(language)}`,
          content: sourceCode,
        },
      ],
    };

    // Add stdin if provided
    if (stdin && stdin.trim() !== '') {
      requestBody.stdin = stdin;
    }

    const response = await API.post("/execute", requestBody);
    return response.data;
  } catch (error) {
    console.error("Execution error:", error);
    throw error;
  }
};