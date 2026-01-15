"use client";
import { useState, useEffect } from "react";
import { executeCode } from "../api";
import { Play, Terminal, AlertTriangle, Loader2 } from "lucide-react";

const Output = ({ editorRef, language }) => {
  const [output, setOutput] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [needsInput, setNeedsInput] = useState(false);
  const [inputExamples, setInputExamples] = useState('');

  // Input detection patterns for different languages
  const inputPatterns = {
    c: [/\bscanf\s*\(/, /\bfgets\s*\(/, /\bgetchar\s*\(/, /\bfgetc\s*\(/, /\bgets\s*\(/],
    cpp: [/\bcin\s*>>/, /\bgetline\s*\(/, /\bcin\.get\s*\(/, /\bcin\.getline\s*\(/],
    python: [/\binput\s*\(/, /\braw_input\s*\(/, /\bsys\.stdin\.readline\s*\(/],
    java: [/\bScanner\b/, /\bnextLine\s*\(/, /\bnext\s*\(/, /\bnextInt\s*\(/, /\bnextDouble\s*\(/, /\bnextFloat\s*\(/, /\bnextLong\s*\(/],
    csharp: [/\bConsole\.ReadLine\s*\(/, /\bConsole\.Read\s*\(/, /\bConsole\.ReadKey\s*\(/],
    php: [/\breadline\s*\(/, /\bfgets\s*\(/, /\bfgetc\s*\(/],
    javascript: [/\bprompt\s*\(/, /\breadline\s*\(/, /\bprocess\.stdin\.read\s*\(/],
    typescript: [/\bprompt\s*\(/, /\breadline\s*\(/, /\bprocess\.stdin\.read\s*\(/]
  };

  // Generate input examples based on language and detected patterns
  const generateInputExamples = (code, lang) => {
    const examples = [];

    if (lang === 'c' || lang === 'cpp') {
      const scanfCount = (code.match(/\bscanf\s*\(/g) || []).length;
      const cinCount = (code.match(/\bcin\s*>>/g) || []).length;
      const getlineCount = (code.match(/\bgetline\s*\(/g) || []).length;

      if (scanfCount > 0) {
        examples.push(`// For ${scanfCount} scanf() call(s):`);
        examples.push('John');
        if (scanfCount > 1) examples.push('25');
        if (scanfCount > 2) examples.push('Engineer');
      }

      if (cinCount > 0) {
        examples.push(`// For ${cinCount} cin >> call(s):`);
        examples.push('Alice');
        if (cinCount > 1) examples.push('30');
      }

      if (getlineCount > 0) {
        examples.push('// For getline() calls:');
        examples.push('Hello World');
        examples.push('This is a longer string');
      }
    }

    if (lang === 'python') {
      const inputCount = (code.match(/\binput\s*\(/g) || []).length;
      if (inputCount > 0) {
        examples.push(`# For ${inputCount} input() call(s):`);
        examples.push('Bob');
        if (inputCount > 1) examples.push('25');
        if (inputCount > 2) examples.push('Developer');
      }
    }

    if (lang === 'java') {
      const scannerCount = (code.match(/\bScanner\b/g) || []).length;
      if (scannerCount > 0) {
        examples.push(`// For Scanner input:`);
        examples.push('Charlie');
        examples.push('28');
        examples.push('Software Engineer');
      }
    }

    if (lang === 'csharp') {
      const readlineCount = (code.match(/\bConsole\.ReadLine\s*\(/g) || []).length;
      if (readlineCount > 0) {
        examples.push(`// For ${readlineCount} Console.ReadLine() call(s):`);
        examples.push('David');
        if (readlineCount > 1) examples.push('32');
      }
    }

    return examples.join('\n');
  };

  // Detect if code needs input
  const detectInputNeeds = (code, lang) => {
    const patterns = inputPatterns[lang] || [];
    return patterns.some(pattern => pattern.test(code));
  };

  // Update input detection when code or language changes
  useEffect(() => {
    const checkInputNeeds = () => {
      if (editorRef.current) {
        const sourceCode = editorRef.current.getValue();
        const needsInputDetected = detectInputNeeds(sourceCode, language);
        setNeedsInput(needsInputDetected);

        if (needsInputDetected) {
          const examples = generateInputExamples(sourceCode, language);
          setInputExamples(examples);
          setShowInput(true); // Auto-show input field when input is needed
        } else {
          setInputExamples('');
          setShowInput(false);
        }
      }
    };

    // Check immediately
    checkInputNeeds();

    // Set up interval to check for changes
    const interval = setInterval(checkInputNeeds, 1000);

    return () => clearInterval(interval);
  }, [language, editorRef]);

  // Also check when editor content changes
  useEffect(() => {
    if (editorRef.current) {
      const editor = editorRef.current;
      const disposable = editor.onDidChangeModelContent(() => {
        const sourceCode = editor.getValue();
        const needsInputDetected = detectInputNeeds(sourceCode, language);
        setNeedsInput(needsInputDetected);

        if (needsInputDetected) {
          const examples = generateInputExamples(sourceCode, language);
          setInputExamples(examples);
          setShowInput(true); // Auto-show input field when input is needed
        } else {
          setInputExamples('');
          setShowInput(false); // Close input if not needed
        }
      });

      return () => disposable.dispose();
    }
  }, [language, editorRef]);

  const runCode = async () => {
    const sourceCode = editorRef.current.getValue();
    if (!sourceCode) return;
    setIsLoading(true);
    try {
      const { run: result } = await executeCode(language, sourceCode, userInput);

      // Piston returns 'output' which combines stdout and stderr
      // But sometimes we want to check them explicitly
      const outputText = result.output || result.stdout || result.stderr || "";
      setOutput(outputText.split("\n"));

      // Check for errors (stderr or non-zero exit code)
      if (result.stderr || (result.code !== 0 && result.code !== null)) {
        setIsError(true);
      } else {
        setIsError(false);
      }
    } catch (error) {
      setIsError(true);
      setOutput([`Error while running the code: ${error.message || 'Unknown error'}`]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-zinc-400" />
          <span className="text-xs font-medium text-zinc-300">Output</span>
        </div>

        <div className="flex gap-2">
          {needsInput && (
            <button
              onClick={() => setShowInput(!showInput)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all border ${needsInput
                ? 'bg-zinc-800 text-amber-400 border-amber-500/30 hover:bg-zinc-700'
                : 'bg-zinc-800 text-zinc-300 border-white/10 hover:bg-zinc-700 hover:text-white'
                }`}
            >
              {showInput ? 'Hide Input' : 'Add Input ⚠️'}
            </button>
          )}

          <button
            onClick={runCode}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black hover:bg-zinc-200 rounded-lg text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
            {isLoading ? 'Running...' : 'Run'}
          </button>
        </div>
      </div>

      {/* Input Section */}
      {showInput && (
        <div className="p-4 border-b border-white/10 bg-zinc-900/30">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-zinc-400">
              Standard Input (stdin)
            </label>
            {needsInput && (
              <span className="text-[10px] text-amber-400 bg-amber-900/20 px-2 py-0.5 rounded border border-amber-500/20">
                Required
              </span>
            )}
          </div>

          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder={needsInput ? "Enter input for your program..." : "Enter input here..."}
            className={`w-full h-24 px-3 py-2 bg-zinc-900 text-zinc-200 border rounded-lg resize-none focus:outline-none focus:ring-1 text-xs font-mono ${needsInput && !userInput.trim()
              ? 'border-amber-500/50 focus:border-amber-500 focus:ring-amber-500/20'
              : 'border-white/10 focus:border-white/20 focus:ring-white/10'
              }`}
          />

          {/* Input Examples */}
          {inputExamples && (
            <div className="mt-2 p-2 bg-zinc-900/50 border border-white/5 rounded text-[10px] font-mono">
              <div className="text-zinc-500 mb-1">Example input format:</div>
              <pre className="text-zinc-300 whitespace-pre-wrap">{inputExamples}</pre>
            </div>
          )}
        </div>
      )}

      {/* Output Display */}
      <div className="flex-1 overflow-auto p-4 font-mono text-sm">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-3">
            <Loader2 size={24} className="animate-spin" />
            <span className="text-xs">Compiling and running...</span>
          </div>
        ) : output ? (
          <div className={`space-y-1 ${isError ? 'text-red-400' : 'text-zinc-300'}`}>
            {output.map((line, i) => (
              <p key={i} className="whitespace-pre-wrap break-words">{line}</p>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-2">
            <Terminal size={24} className="opacity-50" />
            <p className="text-xs">Run code to see output</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Output;
