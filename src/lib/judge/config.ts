export const JUDGE_CONFIG = {
    python: {
        image: "python:3.10-slim",
        entrypoint: ["python3", "-u"],
        extension: "py",
        memoryLimitMb: 128,
        cpuLimit: 0.5,
    },
    javascript: {
        image: "node:18-alpine",
        entrypoint: ["node"],
        extension: "js",
        memoryLimitMb: 128,
        cpuLimit: 0.5,
    },
    java: {
        image: "openjdk:17-slim",
        entrypoint: ["java"],
        extension: "java",
        memoryLimitMb: 256,
        cpuLimit: 1.0,
    },
    cpp: {
        image: "gcc:latest",
        entrypoint: ["./a.out"],
        extension: "cpp",
        memoryLimitMb: 128,
        cpuLimit: 1.0,
    }
} as const;

export const SESSION_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes session life
export const EXECUTION_TIMEOUT_MS = 5000; // 5 seconds max per run
