export const PYTHON_DRIVER_TEMPLATE = `
import sys
import json
import time
import traceback
from typing import List, Any

# Load test cases
try:
    with open("tests.json", "r") as f:
        test_cases = json.load(f)
except Exception as e:
    print(json.dumps({
        "verdict": "Internal Error",
        "stderr": f"Failed to load test cases: {str(e)}"
    }))
    sys.exit(1)

# Import user solution
try:
    if "solution" in sys.modules:
        del sys.modules["solution"]
    import solution
except ImportError:
    print(json.dumps({
        "verdict": "Runtime Error",
        "stderr": "Solution file not found or invalid python code."
    }))
    sys.exit(0)
except Exception as e:
    print(json.dumps({
        "verdict": "Runtime Error",
        "stderr": f"Import Error: {traceback.format_exc()}"
    }))
    sys.exit(0)

results = []
overall_verdict = "Accepted"
total_time = 0

# Find the solution class/function
solver = None
method = None

if hasattr(solution, "Solution"):
    cls = getattr(solution, "Solution")
    try:
        solver = cls()
        methods = [func for func in dir(solver) if callable(getattr(solver, func)) and not func.startswith("__")]
        if methods:
            method = getattr(solver, methods[0])
    except Exception as e:
        print(json.dumps({
            "verdict": "Runtime Error",
            "stderr": f"Failed to instantiate Solution class: {traceback.format_exc()}"
        }))
        sys.exit(0)
else:
    # Fallback: look for generic functions if no class "Solution"
    functions = [f for f in dir(solution) if callable(getattr(solution, f)) and not f.startswith("__") and f != "Solution"]
    if functions:
        method = getattr(solution, functions[0])

if not method:
    print(json.dumps({
        "verdict": "Compilation Error",
        "stderr": "No valid solution class/method found. Expected 'class Solution' with a method."
    }))
    sys.exit(0)

# Execute cases
for i, case in enumerate(test_cases):
    args = case.get("input", [])
    expected = case.get("expectedOutput")
    
    start = time.time()
    captured_stdout = ""
    error_msg = ""
    status = "Accepted"
    actual = None
    
    try:
        # Capture stdout
        from io import StringIO
        old_stdout = sys.stdout
        sys.stdout = mystdout = StringIO()
        
        actual = method(*args)
        
        captured_stdout = mystdout.getvalue()
        sys.stdout = old_stdout
        
        # Compare
        if expected is not None:
             # Handle simple types. Complex types need deep compare.
             # For lists in python, == checks content, which is good.
             if actual != expected:
                status = "Wrong Answer"
                overall_verdict = "Wrong Answer"
            
    except Exception as e:
        status = "Runtime Error"
        error_msg = traceback.format_exc()
        overall_verdict = "Runtime Error"
        sys.stdout = old_stdout 
    
    duration = (time.time() - start) * 1000
    total_time += duration
    
    results.append({
        "testCaseId": case.get("id", str(i)),
        "verdict": status,
        "actualOutput": str(actual),
        "expectedOutput": str(expected),
        "timeMs": duration,
        "stdout": captured_stdout,
        "stderr": error_msg
    })
    
    if status == "Runtime Error":
        break

print(json.dumps({
    "verdict": overall_verdict,
    "results": results,
    "timeMs": total_time
}))
`;
