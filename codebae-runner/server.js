import express from "express";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuid } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const MAX_CODE_SIZE = parseInt(process.env.MAX_CODE_SIZE) || 100000;
const EXECUTION_TIMEOUT = parseInt(process.env.EXECUTION_TIMEOUT) || 5000;
const MAX_OUTPUT_SIZE = parseInt(process.env.MAX_OUTPUT_SIZE) || 100000;
const API_KEY = process.env.API_KEY;

app.use(express.json({ limit: "1mb" }));

const activeJobs = new Map();

function cleanup(dir) {
  try {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  } catch (err) {
    console.error("Cleanup error:", err);
  }
}

function truncateOutput(output) {
  if (output.length > MAX_OUTPUT_SIZE) {
    return output.substring(0, MAX_OUTPUT_SIZE) + "\n[Output truncated...]";
  }
  return output;
}

// PUBLIC ROUTES FIRST
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    activeJobs: activeJobs.size,
    uptime: process.uptime()
  });
});

app.get("/stats", (req, res) => {
  res.json({
    activeJobs: activeJobs.size,
    jobs: Array.from(activeJobs.entries()).map(([id, job]) => ({
      id,
      language: job.language,
      duration: Date.now() - job.startTime
    }))
  });
});

// AUTH MIDDLEWARE
function authMiddleware(req, res, next) {
  if (!API_KEY) {
    // Per requirement 6: If API_KEY environment variable is missing, return 500 error.
    // Assuming this means securely failing if the server isn't configured with a key.
    console.error("Server misconfiguration: API_KEY missing");
    return res.status(500).json({ error: "Server misconfiguration: API_KEY missing" });
  }

  // Requirement 3: The /execute endpoint must REQUIRE a valid x-api-key header.
  const clientKey = req.headers['x-api-key'];

  if (!clientKey || clientKey !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

app.use(authMiddleware);

// PROTECTED ROUTES
app.post("/execute", async (req, res) => {
  const { language, code, input = "", timeout = EXECUTION_TIMEOUT } = req.body;

  if (!language || !code) {
    return res.status(400).json({ error: "Missing language or code" });
  }

  if (code.length > MAX_CODE_SIZE) {
    return res.status(400).json({ error: "Code exceeds maximum size" });
  }

  const allowedLanguages = ["cpp", "java", "python", "c"];
  if (!allowedLanguages.includes(language)) {
    return res.status(400).json({ error: "Unsupported language" });
  }

  const jobId = uuid();
  const jobDir = path.join("/tmp", jobId);
  const startTime = Date.now();

  try {
    fs.mkdirSync(jobDir, { recursive: true });
    activeJobs.set(jobId, { startTime, language });

    let result;
    switch (language) {
      case "cpp":
      case "c":
        result = await executeCpp(code, input, jobDir, timeout);
        break;
      case "java":
        result = await executeJava(code, input, jobDir, timeout);
        break;
      case "python":
        result = await executePython(code, input, jobDir, timeout);
        break;
    }

    activeJobs.delete(jobId);
    cleanup(jobDir);

    res.json({
      success: result.success,
      output: truncateOutput(result.output),
      error: result.error,
      executionTime: Date.now() - startTime
    });

  } catch (err) {
    activeJobs.delete(jobId);
    cleanup(jobDir);
    console.error("Execution error:", err);
    res.status(500).json({
      success: false,
      output: "",
      error: "Execution failed",
      executionTime: Date.now() - startTime
    });
  }
});

async function executeCpp(code, input, jobDir, timeout) {
  const filePath = path.join(jobDir, "main.cpp");
  fs.writeFileSync(filePath, code);

  return new Promise((resolve, reject) => {
    const compile = spawn("g++", ["-O2", "-std=c++17", "-o", "main", "main.cpp"], {
      cwd: jobDir,
      timeout: 10000
    });

    let compileError = "";
    compile.stderr.on("data", (data) => {
      compileError += data.toString();
    });

    compile.on("close", (code) => {
      if (code !== 0) {
        resolve({
          success: false,
          output: "",
          error: `Compilation Error:\n${compileError}`
        });
        return;
      }

      const executable = process.platform === "win32" ? "main.exe" : "./main";
      runCommand([executable], jobDir, input, timeout, resolve);
    });

    compile.on("error", (err) => {
      reject(err);
    });
  });
}

async function executeJava(code, input, jobDir, timeout) {
  const classMatch = code.match(/public\s+class\s+(\w+)/);
  const className = classMatch ? classMatch[1] : "Main";
  const filePath = path.join(jobDir, `${className}.java`);

  fs.writeFileSync(filePath, code);

  return new Promise((resolve, reject) => {
    const compile = spawn("javac", [`${className}.java`], {
      cwd: jobDir,
      timeout: 10000
    });

    let compileError = "";
    compile.stderr.on("data", (data) => {
      compileError += data.toString();
    });

    compile.on("close", (code) => {
      if (code !== 0) {
        resolve({
          success: false,
          output: "",
          error: `Compilation Error:\n${compileError}`
        });
        return;
      }

      runCommand(
        ["java", "-Xmx256m", className],
        jobDir,
        input,
        timeout,
        resolve
      );
    });

    compile.on("error", (err) => {
      reject(err);
    });
  });
}

async function executePython(code, input, jobDir, timeout) {
  const filePath = path.join(jobDir, "script.py");
  fs.writeFileSync(filePath, code);

  const pythonCmd = process.platform === "win32" ? "python" : "python3";

  return new Promise((resolve) => {
    runCommand(
      [pythonCmd, "-u", "script.py"],
      jobDir,
      input,
      timeout,
      resolve
    );
  });
}

function runCommand(cmdArray, cwd, input, timeout, resolve) {
  const run = spawn(cmdArray[0], cmdArray.slice(1), {
    cwd,
    timeout: timeout // Node.js handling of timeout
  });

  let output = "";
  let errorOutput = "";
  let killed = false;

  if (input) {
    run.stdin.write(input);
    run.stdin.end();
  }

  run.stdout.on("data", (data) => {
    output += data.toString();
    if (output.length > MAX_OUTPUT_SIZE && !killed) {
      killed = true;
      run.kill(); // Default SIGTERM
    }
  });

  run.stderr.on("data", (data) => {
    errorOutput += data.toString();
  });

  run.on("close", (code, signal) => {
    let error = null;

    if (signal === "SIGTERM") {
      error = killed ? "Output limit exceeded" : "Execution timed out";
    } else if (code !== 0) {
      error = errorOutput || `Process exited with code ${code}`;
    }

    resolve({
      success: code === 0 && !signal,
      output: output,
      error: error
    });
  });

  run.on("error", (err) => {
    resolve({
      success: false,
      output: "",
      error: err.message
    });
  });
}

// SERVER START
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Codebae Runner listening on port ${PORT}`);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received, cleaning up...");
  for (const [jobId, job] of activeJobs) {
    const jobDir = path.join("/tmp", jobId);
    cleanup(jobDir);
  }
  process.exit(0);
});
