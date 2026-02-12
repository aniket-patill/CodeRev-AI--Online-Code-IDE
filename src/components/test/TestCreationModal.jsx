"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, FileText, Lock, Loader2, X, Plus, Trash2, Upload, Sparkles } from "lucide-react";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db, auth } from "@/config/firebase";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

const TestCreationModal = ({ isOpen, onClose }) => {
    const router = useRouter();
    const user = auth.currentUser;

    const [isCreating, setIsCreating] = useState(false);
    const [showAIDialog, setShowAIDialog] = useState(false);
    const [aiPrompt, setAiPrompt] = useState("");
    const [aiDifficulty, setAiDifficulty] = useState("medium");
    const [aiTestcaseCount, setAiTestcaseCount] = useState(5);
    const [isGenerating, setIsGenerating] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        password: "",
        duration: "",
        randomizeQuestions: false,
        questionsCount: "",
        allowedLanguages: ["python", "javascript", "java", "cpp"],
        files: [
            { name: "main.py", language: "python", content: "# Write your solution here\n", readOnly: false },
        ],
        questions: [{ id: 1, title: "Question 1", description: "", points: 10, testcases: [], codeSnippets: null }],
    });

    const updateField = (field, value) => {
        setFormData((prev) => {
            // When toggling randomizeQuestions, preserve questionsCount value
            if (field === "randomizeQuestions") {
                return {
                    ...prev,
                    [field]: value,
                    // If enabling randomization and questionsCount is empty, set it to 1
                    ...(value && !prev.questionsCount && { questionsCount: "1" })
                };
            }

            // When updating questionsCount, validate against available questions
            if (field === "questionsCount" && prev.randomizeQuestions) {
                const numValue = parseInt(value) || 0;
                const availableQuestions = prev.questions.length;
                if (numValue > availableQuestions) {
                    return prev; // Don't update if value exceeds available questions
                }
                return { ...prev, [field]: value };
            }

            return { ...prev, [field]: value };
        });
    };

    const addFile = () => {
        setFormData((prev) => ({
            ...prev,
            files: [...prev.files, { name: "", language: prev.allowedLanguages?.[0] || "python", content: "", readOnly: false }],
        }));
    };

    const updateFile = (index, field, value) => {
        setFormData((prev) => {
            const newFiles = [...prev.files];
            newFiles[index] = { ...newFiles[index], [field]: value };

            return { ...prev, files: newFiles };
        });
    };

    const removeFile = (index) => {
        if (formData.files.length <= 2) return; // Keep at least one file per language (py + js)
        setFormData((prev) => ({
            ...prev,
            files: prev.files.filter((_, i) => i !== index)
        }));
    };

    const addQuestion = () => {
        setFormData((prev) => {
            const newId = Math.max(...prev.questions.map(q => q.id), 0) + 1;
            const langs = prev.allowedLanguages || ["python", "javascript"];
            const newFiles = [{
                name: `solution_${newId}.py`,
                language: "python",
                content: "# Write your solution here\n",
                readOnly: false,
            }];
            return {
                ...prev,
                files: [...prev.files, ...newFiles],
                questions: [
                    ...prev.questions,
                    { id: newId, title: `Question ${newId}`, description: "", points: 10, testcases: [], codeSnippets: null }
                ]
            };
        });
    };

    const handleGenerateQuestion = async () => {
        if (!aiPrompt.trim()) {
            toast.error("Please enter a topic or description");
            return;
        }

        setIsGenerating(true);
        try {
            const response = await fetch('/api/generate-question', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: aiPrompt,
                    difficulty: aiDifficulty,
                    testcaseCount: aiTestcaseCount,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to generate question');
            }

            const result = await response.json();
            const snippets = result.code_snippets || {};
            const pyStarter = snippets.python?.starter_code || "# Code not generated\n";
            const jsStarter = snippets.javascript?.starter_code || "// Code not generated\n";
            const javaStarter = snippets.java?.starter_code || "// Code not generated\npublic class Solution {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}\n";
            const cppStarter = snippets.cpp?.starter_code || "// Code not generated\n#include <iostream>\n\nint main() {\n    // Your code here\n    return 0;\n}\n";

            // Add generated question with one file per allowed language (Python + JavaScript + Java + C++)
            setFormData((prev) => {
                const newId = Math.max(...prev.questions.map(q => q.id), 0) + 1;
                const questionIndex = prev.questions.length;
                const newFiles = [...prev.files];

                if (questionIndex === 0 && newFiles.length >= 1) {
                    // First question: overwrite initial solution files
                    newFiles[0] = { name: "solution.py", language: "python", content: pyStarter, readOnly: false };
                    // Remove other default files if they exist (cleanup from old multi-file default)
                    if (newFiles.length > 1) {
                        newFiles.splice(1);
                    }
                } else {
                    newFiles.push(
                        { name: `solution_${newId}.py`, language: "python", content: pyStarter, readOnly: false }
                    );
                }

                return {
                    ...prev,
                    files: newFiles,
                    questions: [
                        ...prev.questions,
                        {
                            id: newId,
                            title: result.title,
                            description: result.description,
                            points: result.difficulty === 'easy' ? 50 : result.difficulty === 'medium' ? 100 : 150,
                            testcases: result.testcases,
                            codeSnippets: result.code_snippets,
                        }
                    ]
                };
            });

            setShowAIDialog(false);
            setAiPrompt("");
            toast.success("Question generated successfully!");
        } catch (err) {
            console.error("AI Generation failed:", err);
            toast.error(err.message || "Failed to generate question. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const updateQuestion = (id, field, value) => {
        setFormData((prev) => ({
            ...prev,
            questions: prev.questions.map(question =>
                question.id === id ? { ...question, [field]: value } : question
            )
        }));
    };

    const removeQuestion = (id) => {
        if (formData.questions.length <= 1) return;
        setFormData((prev) => ({
            ...prev,
            questions: prev.questions.filter(question => question.id !== id)
        }));
    };

    // Function to handle JSON file import
    const handleJsonImport = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (file.type !== 'application/json') {
            toast.error('Please select a valid JSON file');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const jsonData = JSON.parse(e.target.result);

                // Validate the JSON structure
                if (!Array.isArray(jsonData)) {
                    toast.error('JSON file must contain an array of questions');
                    return;
                }

                // Validate each question object
                const validQuestions = [];
                for (let i = 0; i < jsonData.length; i++) {
                    const question = jsonData[i];

                    // Check required fields
                    if (typeof question.title !== 'string') {
                        toast.error(`Question ${i + 1} is missing a title`);
                        return;
                    }

                    // Create a valid question object with defaults
                    const validQuestion = {
                        id: Date.now() + i, // Ensure unique IDs
                        title: question.title,
                        description: question.description || '',
                        points: typeof question.points === 'number' ? question.points : 10,
                    };

                    validQuestions.push(validQuestion);
                }

                // Add imported questions to existing questions
                setFormData(prev => ({
                    ...prev,
                    questions: [...prev.questions, ...validQuestions]
                }));

                toast.success(`${validQuestions.length} questions imported successfully!`);
            } catch (error) {
                console.error('Error parsing JSON:', error);
                toast.error('Invalid JSON format');
            }
        };

        reader.onerror = () => {
            toast.error('Error reading file');
        };

        reader.readAsText(file);

        // Reset the file input
        event.target.value = '';
    };

    // Trigger file input click
    const triggerFileInput = () => {
        document.getElementById('json-file-input').click();
    };

    const handleCreate = async () => {
        const namedFiles = formData.files.filter((f) => f.name.trim());
        const availableQuestions = formData.questions.length;

        // Validate required fields
        if (!formData.title || !formData.password || isCreating) return;

        // Validate randomization settings if enabled
        if (formData.randomizeQuestions) {
            if (!formData.questionsCount) {
                toast.error("Please specify number of questions per student");
                return;
            }

            const questionsCount = parseInt(formData.questionsCount);
            if (isNaN(questionsCount) || questionsCount <= 0) {
                toast.error("Questions per student must be a positive number");
                return;
            }

            if (questionsCount > availableQuestions) {
                toast.error(`Cannot assign ${questionsCount} questions per student when only ${availableQuestions} questions exist`);
                return;
            }
        }

        try {
            setIsCreating(true);

            const testData = {
                title: formData.title,
                description: formData.description,
                password: formData.password, // In production, hash this
                duration: formData.duration ? parseInt(formData.duration) : null,
                randomizeQuestions: formData.randomizeQuestions,
                questionsCount: formData.randomizeQuestions ? parseInt(formData.questionsCount) : null,
                createdBy: user?.uid || "anonymous",
                createdAt: Timestamp.now(),
                status: "draft",
                startTime: null,
                endTime: null,
                files: formData.files.filter((f) => f.name.trim()),
                questions: formData.questions,
            };

            const testRef = await addDoc(collection(db, "tests"), testData);

            toast.success("Test created successfully!");
            onClose();
            router.push(`/test/${testRef.id}/manage`);
        } catch (error) {
            console.error("Error creating test:", error);
            toast.error("Failed to create test");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-zinc-950/95 backdrop-blur-2xl border border-white/10 p-0 overflow-hidden rounded-2xl w-[95%] max-w-2xl shadow-2xl max-h-[85vh] overflow-y-auto mx-auto">
                {/* Header */}
                <div className="p-4 md:p-6 border-b border-white/5 bg-zinc-900/30 sticky top-0 z-10">
                    <DialogTitle className="text-2xl font-bold text-white mb-1 flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-xl">
                            <FileText className="w-5 h-5 text-blue-400" />
                        </div>
                        Create New Test
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Set up a coding test for your students or participants.
                    </DialogDescription>
                </div>

                <div className="p-4 md:p-6 space-y-4 md:space-y-6">
                    {/* Title */}
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold ml-1">
                            Test Title *
                        </label>
                        <Input
                            placeholder="e.g., JavaScript Fundamentals"
                            value={formData.title}
                            onChange={(e) => updateField("title", e.target.value)}
                            className="bg-zinc-900 text-white border-white/10 focus:border-blue-500/50 h-10 md:h-12 rounded-xl"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold ml-1">
                            Description
                        </label>
                        <textarea
                            placeholder="Describe what participants need to do..."
                            value={formData.description}
                            onChange={(e) => updateField("description", e.target.value)}
                            className="w-full bg-zinc-900 text-white border border-white/10 focus:border-blue-500/50 rounded-xl p-3 min-h-[80px] resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                        />
                    </div>

                    {/* Password & Duration Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold ml-1 flex items-center gap-2">
                                <Lock size={12} /> Password *
                            </label>
                            <Input
                                type="password"
                                placeholder="Access password"
                                value={formData.password}
                                onChange={(e) => updateField("password", e.target.value)}
                                className="bg-zinc-900 text-white border-white/10 focus:border-blue-500/50 h-10 md:h-12 rounded-xl"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold ml-1 flex items-center gap-2">
                                <Clock size={12} /> Duration (minutes)
                            </label>
                            <Input
                                type="number"
                                placeholder="e.g., 60 (optional)"
                                value={formData.duration}
                                onChange={(e) => updateField("duration", e.target.value)}
                                className="bg-zinc-900 text-white border-white/10 focus:border-blue-500/50 h-10 md:h-12 rounded-xl"
                            />
                        </div>
                    </div>

                    {/* Randomization Options */}
                    <div className="space-y-4 p-4 bg-zinc-900/30 rounded-xl border border-white/5">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="randomizeQuestions"
                                checked={formData.randomizeQuestions}
                                onChange={(e) => updateField("randomizeQuestions", e.target.checked)}
                                className="w-4 h-4 rounded bg-zinc-800 border-white/10 text-blue-500 focus:ring-blue-500"
                            />
                            <label htmlFor="randomizeQuestions" className="text-sm font-medium text-white">
                                Randomize Questions
                            </label>
                        </div>

                        {formData.randomizeQuestions && (
                            <div className="space-y-3 pl-7">
                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold ml-1">
                                        Questions per Student *
                                    </label>
                                    <Input
                                        type="number"
                                        min="1"
                                        max={formData.questions.length}
                                        placeholder="Number of questions each student gets"
                                        value={formData.questionsCount}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            const numValue = parseInt(value) || 0;
                                            // Validate that questionsCount is not greater than total questions
                                            const totalQuestions = formData.questions.length;
                                            if (numValue <= totalQuestions && numValue > 0) {
                                                updateField("questionsCount", e.target.value);
                                            }
                                        }}
                                        className="bg-zinc-800 text-white border-white/10 focus:border-blue-500/50 h-10 rounded-lg"
                                    />
                                    <p className="text-xs text-zinc-500">
                                        Maximum {formData.questions.length} based on total questions
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Questions Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold ml-1">
                                    Test Questions
                                </label>
                                <p className="text-xs text-zinc-500 mt-1">Define the questions for this test</p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => setShowAIDialog(true)}
                                    variant="ghost"
                                    size="sm"
                                    className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 h-8 px-3"
                                >
                                    <Sparkles size={14} className="mr-1" /> AI Generate
                                </Button>
                                <Button
                                    onClick={triggerFileInput}
                                    variant="ghost"
                                    size="sm"
                                    className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 h-8 px-3"
                                >
                                    <Upload size={14} className="mr-1" /> Import JSON
                                </Button>
                                <Button
                                    onClick={addQuestion}
                                    variant="ghost"
                                    size="sm"
                                    className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 h-8 px-3"
                                >
                                    <Plus size={14} className="mr-1" /> Add Question
                                </Button>
                            </div>
                        </div>
                        <input
                            id="json-file-input"
                            type="file"
                            accept=".json,application/json"
                            onChange={handleJsonImport}
                            className="hidden"
                        />

                        <div className="space-y-3">
                            {formData.questions.map((question, index) => (
                                <div
                                    key={question.id}
                                    className="p-4 bg-zinc-900/50 border border-white/5 rounded-xl"
                                >
                                    <div className="flex gap-2 mb-3">
                                        <Input
                                            placeholder="Question title"
                                            value={question.title}
                                            onChange={(e) => updateQuestion(question.id, "title", e.target.value)}
                                            className="bg-zinc-800 text-white border-white/10 h-10 rounded-lg flex-1"
                                        />
                                        <Input
                                            type="number"
                                            placeholder="Points"
                                            value={question.points}
                                            onChange={(e) => updateQuestion(question.id, "points", parseInt(e.target.value) || 0)}
                                            className="bg-zinc-800 text-white border-white/10 h-10 rounded-lg w-20"
                                        />
                                        {formData.questions.length > 1 && (
                                            <Button
                                                onClick={() => removeQuestion(question.id)}
                                                variant="ghost"
                                                size="icon"
                                                className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 h-10 w-10"
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        )}
                                    </div>
                                    <textarea
                                        placeholder="Question description"
                                        value={question.description}
                                        onChange={(e) => updateQuestion(question.id, "description", e.target.value)}
                                        className="w-full bg-zinc-800 text-white border border-white/10 rounded-lg p-3 min-h-[80px] resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                                    />

                                    {/* Testcases Section */}
                                    <div className="mt-3 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                                                Test Cases
                                            </label>
                                            <Button
                                                onClick={() => {
                                                    const newTestcases = [
                                                        ...(question.testcases || []),
                                                        { input: "", expected_output: "", is_hidden: false }
                                                    ];
                                                    updateQuestion(question.id, "testcases", newTestcases);
                                                }}
                                                variant="ghost"
                                                size="sm"
                                                className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 h-7 px-2 text-xs"
                                            >
                                                <Plus size={12} className="mr-1" /> Add Testcase
                                            </Button>
                                        </div>

                                        {question.testcases && question.testcases.length > 0 ? (
                                            <div className="space-y-2">
                                                {question.testcases.map((testcase, tcIndex) => (
                                                    <div key={tcIndex} className="p-2 bg-zinc-800/50 border border-white/5 rounded-lg space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs text-zinc-400">Test Case #{tcIndex + 1}</span>
                                                            <Button
                                                                onClick={() => {
                                                                    const newTestcases = question.testcases.filter((_, idx) => idx !== tcIndex);
                                                                    updateQuestion(question.id, "testcases", newTestcases);
                                                                }}
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 h-6 w-6 p-0"
                                                            >
                                                                <Trash2 size={12} />
                                                            </Button>
                                                        </div>
                                                        <Input
                                                            placeholder='Input (JSON format, e.g., {"nums": [1,2], "target": 3})'
                                                            value={testcase.input}
                                                            onChange={(e) => {
                                                                const newTestcases = [...question.testcases];
                                                                newTestcases[tcIndex] = { ...newTestcases[tcIndex], input: e.target.value };
                                                                updateQuestion(question.id, "testcases", newTestcases);
                                                            }}
                                                            className="bg-zinc-900 text-white border-white/10 h-8 text-xs rounded-md font-mono"
                                                        />
                                                        <Input
                                                            placeholder="Expected Output (e.g., 3 or [1,2,3])"
                                                            value={testcase.expected_output}
                                                            onChange={(e) => {
                                                                const newTestcases = [...question.testcases];
                                                                newTestcases[tcIndex] = { ...newTestcases[tcIndex], expected_output: e.target.value };
                                                                updateQuestion(question.id, "testcases", newTestcases);
                                                            }}
                                                            className="bg-zinc-900 text-white border-white/10 h-8 text-xs rounded-md font-mono"
                                                        />
                                                        <label className="flex items-center gap-2 text-xs text-zinc-400">
                                                            <input
                                                                type="checkbox"
                                                                checked={testcase.is_hidden || false}
                                                                onChange={(e) => {
                                                                    const newTestcases = [...question.testcases];
                                                                    newTestcases[tcIndex] = { ...newTestcases[tcIndex], is_hidden: e.target.checked };
                                                                    updateQuestion(question.id, "testcases", newTestcases);
                                                                }}
                                                                className="rounded bg-zinc-800 border-white/10"
                                                            />
                                                            Hidden from students
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-xs text-zinc-600 italic p-2 text-center border border-dashed border-white/5 rounded-lg">
                                                No test cases added yet. Use "AI Generate" or add manually.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Files Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold ml-1">
                                    Starter Files
                                </label>
                                <p className="text-xs text-zinc-500 mt-1">Python & JavaScript supported. AI Generate adds both for each question.</p>
                            </div>
                            <Button
                                onClick={addFile}
                                variant="ghost"
                                size="sm"
                                className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 h-8 px-3"
                            >
                                <Plus size={14} className="mr-1" /> Add File
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {formData.files.map((file, index) => (
                                <div
                                    key={index}
                                    className="flex flex-wrap gap-3 p-3 bg-zinc-900/50 border border-white/5 rounded-xl items-center"
                                >
                                    <Input
                                        placeholder={file.language === "javascript" ? "filename.js" : "filename.py"}
                                        value={file.name}
                                        onChange={(e) => updateFile(index, "name", e.target.value)}
                                        className="bg-zinc-800 text-white border-white/10 h-10 rounded-lg flex-1 min-w-[140px]"
                                    />
                                    <select
                                        value={file.language || "python"}
                                        onChange={(e) => updateFile(index, "language", e.target.value)}
                                        className="bg-zinc-800 text-white border border-white/10 h-10 rounded-lg px-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 min-w-[120px]"
                                    >
                                        <option value="python">Python</option>
                                        <option value="javascript">JavaScript</option>
                                        <option value="cpp">C++</option>
                                        <option value="java">Java</option>
                                    </select>
                                    <label className="flex items-center gap-2 text-xs text-zinc-400 shrink-0">
                                        <input
                                            type="checkbox"
                                            checked={file.readOnly}
                                            onChange={(e) => updateFile(index, "readOnly", e.target.checked)}
                                            className="rounded bg-zinc-800 border-white/10"
                                        />
                                        Read-only
                                    </label>
                                    {formData.files.length > 2 && (
                                        <Button
                                            onClick={() => removeFile(index)}
                                            variant="ghost"
                                            size="icon"
                                            className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 h-10 w-10 shrink-0"
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-white/5">
                        <Button
                            onClick={onClose}
                            className="flex-1 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 h-10 md:h-12 rounded-xl font-medium"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreate}
                            disabled={isCreating || !formData.title || !formData.password}
                            className="flex-1 bg-white text-black hover:bg-zinc-200 h-10 md:h-12 rounded-xl font-semibold disabled:opacity-50"
                        >
                            {isCreating ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                "Create Test"
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>

            {/* AI Generation Dialog - Following CodeRev's UI Theme */}
            <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
                <DialogContent className="bg-zinc-950/95 backdrop-blur-2xl border border-white/10 p-0 overflow-hidden rounded-2xl w-[95%] max-w-md shadow-2xl mx-auto">
                    <div className="p-4 md:p-6 border-b border-white/5 bg-indigo-900/10">
                        <DialogTitle className="text-2xl font-bold text-white mb-1 flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/20 rounded-xl">
                                <Sparkles className="w-5 h-5 text-indigo-400" />
                            </div>
                            AI Question Generator
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            Generate coding questions instantly using AI (powered by Groq)
                        </DialogDescription>
                    </div>

                    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
                        {/* Topic Input */}
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold ml-1">
                                What topic or problem?
                            </label>
                            <textarea
                                placeholder="e.g., Binary Search Algorithm, Two Sum Problem, etc."
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                className="w-full bg-zinc-900 text-white border border-white/10 focus:border-indigo-500/50 rounded-xl p-3 min-h-[100px] resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                            />
                        </div>

                        {/* Difficulty and Testcase Count */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold ml-1">
                                    Difficulty
                                </label>
                                <select
                                    value={aiDifficulty}
                                    onChange={(e) => setAiDifficulty(e.target.value)}
                                    className="w-full bg-zinc-900 text-white border border-white/10 h-10 md:h-12 rounded-xl px-3 text-sm focus:outline-none focus:border-indigo-500/50"
                                >
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold ml-1">
                                    Test Cases
                                </label>
                                <Input
                                    type="number"
                                    min="3"
                                    max="10"
                                    value={aiTestcaseCount}
                                    onChange={(e) => setAiTestcaseCount(parseInt(e.target.value) || 5)}
                                    className="bg-zinc-900 text-white border-white/10 focus:border-indigo-500/50 h-10 md:h-12 rounded-xl"
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-4 border-t border-white/5">
                            <Button
                                onClick={() => setShowAIDialog(false)}
                                disabled={isGenerating}
                                className="flex-1 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 h-10 md:h-12 rounded-xl font-medium"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleGenerateQuestion}
                                disabled={isGenerating || !aiPrompt.trim()}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white h-10 md:h-12 rounded-xl font-semibold disabled:opacity-50 shadow-lg shadow-indigo-900/20"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-5 w-5 mr-2" />
                                        Generate
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </Dialog>
    );
};

export default TestCreationModal;
