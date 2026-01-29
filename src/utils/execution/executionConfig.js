
const LANGUAGE_CONFIG = {
  python: {
    image: "python:3.11-slim",
    file: "main.py",
    cmd: ["python", "/code/main.py"],
  },
  javascript: {
    image: "node:20-slim",
    file: "main.js",
    cmd: ["node", "/code/main.js"],
  },
  java: {
    image: "openjdk:17-slim",
    file: "Main.java",
    cmd: ["sh", "-c", "javac /code/Main.java && java -cp /code Main"],
  },
  cpp: {
    image: "gcc:latest",
    file: "main.cpp",
    cmd: ["sh", "-c", "g++ -o /code/main /code/main.cpp && /code/main"],
  },
};

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MEMORY_MB = 256;

const ALLOWED_LANGUAGES = Object.keys(LANGUAGE_CONFIG);

export { LANGUAGE_CONFIG, DEFAULT_TIMEOUT_MS, DEFAULT_MEMORY_MB, ALLOWED_LANGUAGES };
