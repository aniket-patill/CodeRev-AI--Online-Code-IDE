# Code Execution Flow Documentation

## Overview

This document explains how code execution works in the CodeRev-AI Online Code IDE platform. 

**Note**: This documentation describes the **backend execution system** located in the `codetest/` directory, which uses FastAPI with Docker-based sandboxed execution. The current Next.js application (`src/`) uses a different client-side execution approach (see "Current Implementation" section below).

## Current Implementation (Next.js App)

**Location**: `src/components/test/TestOutput.jsx` and `src/utils/execution/CodeExecutionService.js`

The current Next.js application uses **client-side code execution**:

- **JavaScript Execution**: Uses Web Workers for isolated execution
  - Code runs in a separate worker thread
  - 5-second timeout to prevent infinite loops
  - Captures console.log, console.error, and console.warn
  - No DOM access (worker isolation)

- **Python Execution**: Currently placeholder (Pyodide integration pending)

- **Execution Flow**:
  1. User clicks "Run Code" in `TestOutput` component
  2. `CodeExecutionService.execute()` is called with code and language
  3. For JavaScript: Creates a Web Worker with the code
  4. Worker executes code and captures output
  5. Results displayed in the output panel

**Limitations**: 
- Client-side execution is less secure than server-side sandboxing
- Limited language support (currently only JavaScript)
- No testcase validation or automated testing
- No resource limits (memory, CPU) enforcement

---

## Backend Execution System (codetest/)

The following documentation describes the **production-ready backend execution system** that provides secure, sandboxed code execution with testcase validation.

## Architecture Flow

### 1. Frontend: User Interaction

**Location**: `codetest/frontend/src/pages/test/TestEnvironment.tsx`

- User writes code in Monaco Editor (`CodeEditor` component)
- User clicks "Run" or "Submit" button
- Frontend merges user code with driver code (if present) using `getFullCode()`:
  ```typescript
  const getFullCode = (userCode: string) => {
    const snippet = codeSnippets['python'];
    if (!snippet?.driver_code) return userCode;
    return userCode + "\n" + snippet.driver_code;
  };
  ```

- Code snippets are extracted from question description (JSON embedded in markdown comments)

### 2. Frontend: API Request

**Location**: `codetest/frontend/src/lib/api.ts`

- `executeCode()` function sends POST request to `/api/v1/execute`
- Request includes:
  - `code`: Full code (user + driver merged)
  - `language`: Currently only 'python' supported
  - `testcases`: Array of input/expected_output pairs
  - `timeout_seconds`: Default 10s (capped by backend config)
  - `memory_limit_mb`: Default 256MB (capped by backend config)
- Request is authenticated with JWT token from Supabase session

### 3. Backend: API Endpoint

**Location**: `codetest/backend/app/routers/execution.py`

- FastAPI endpoint `/api/v1/execute` receives request
- Validates user authentication via `get_current_user` dependency
- Applies timeout/memory limits from config (capped at request values)
- Iterates through each testcase and calls `execute_testcase()` for each

### 4. Backend: Sandbox Execution

**Location**: `codetest/backend/app/services/sandbox.py`

#### Execution Strategy

The system uses a **two-tier execution approach**:

1. **Docker Execution (Preferred)**: `run_code_docker()`

   - Attempts to use Docker for secure sandboxing
   - Falls back to local execution if Docker unavailable
   - Uses language-specific Docker images (e.g., `python:3.11-slim`)
   - Container runs with:
     - Network disabled (`network_disabled=True`)
     - Memory limit enforced (`mem_limit`)
     - Read-only volume mount
     - Auto-removal after execution

2. **Local Execution (Fallback)**: `run_code_locally()`

   - Used when Docker is not available (common in development)
   - Runs code in subprocess with timeout
   - Less secure but functional for development

#### Execution Process

1. **Create temporary file**: `create_solution_file()` writes code to temp file with language extension
2. **Prepare input**: Input data written to `input.txt` in temp directory
3. **Execute**: 

   - For Python: `python {file}` with input piped via stdin
   - Command: `echo '{input_data}' | python /code/{file}`

4. **Capture output**: stdout/stderr captured, execution time measured
5. **Compare results**: Output compared with expected (JSON-aware comparison)
6. **Cleanup**: Temp files deleted

### 5. Output Comparison

**Location**: `codetest/backend/app/services/sandbox.py` (lines 288-296)

- First attempts JSON parsing for semantic comparison
- Falls back to string comparison if JSON parsing fails
- Whitespace normalized via `.strip()`

### 6. Response Assembly

**Location**: `codetest/backend/app/routers/execution.py`

- Aggregates results from all testcases
- Calculates summary:
  - Passed/failed counts
  - Average execution time
  - Maximum memory usage
- Returns `ExecutionResponse` with:
  - `results`: Array of `TestcaseResult` objects
  - `summary`: Execution statistics
  - `runtime_error`: First error encountered (if any)

### 7. Frontend: Result Display

**Location**: `codetest/frontend/src/pages/test/TestEnvironment.tsx` & `TestOutput.tsx`

- Results displayed in `TestOutput` component
- Shows:
  - Pass/fail status for each testcase
  - Actual vs expected output
  - Execution time and memory usage
  - Error messages (if any)

## Submission Flow (Final Submit)

When user clicks "Final Submit":

1. **Frontend**: Calls `submitSolution()` API (different from `executeCode()`)
2. **Backend**: `/api/v1/submit` endpoint (`codetest/backend/app/routers/submission.py`)

   - Executes against ALL testcases (including hidden ones)
   - Calculates rule-based score
   - Stores submission in database
   - Triggers background AI evaluation task
   - Updates participant status to 'submitted'

3. **AI Evaluation**: Runs asynchronously in background

   - Analyzes code quality, complexity
   - Updates final score (70% rule-based + 30% AI score)

## Security Features

1. **Sandboxing**: Docker containers with network disabled
2. **Resource Limits**: Timeout (10s default) and memory limits (256MB default)
3. **Isolation**: Each execution in separate container, auto-removed
4. **Input Validation**: Pydantic schemas validate all inputs

## Language Support

Currently configured:

- **Python**: Fully supported via `python:3.11-slim` Docker image
- **Java/C++**: Configuration exists but not fully implemented in `LANGUAGE_CONFIG`

## Configuration

**Location**: `codetest/backend/app/config.py`

- `code_timeout_seconds`: Default 10 seconds
- `code_memory_limit_mb`: Default 256 MB
- Configurable via environment variables

## Key Files

- **Frontend Execution**: `codetest/frontend/src/pages/test/TestEnvironment.tsx`
- **API Client**: `codetest/frontend/src/lib/api.ts`
- **Execution Router**: `codetest/backend/app/routers/execution.py`
- **Sandbox Service**: `codetest/backend/app/services/sandbox.py`
- **Schemas**: `codetest/backend/app/schemas/execution.py`
- **Docker Config**: `codetest/backend/docker/sandbox/python.Dockerfile`
