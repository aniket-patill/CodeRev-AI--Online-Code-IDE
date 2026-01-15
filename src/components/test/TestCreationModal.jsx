"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, FileText, Lock, Loader2, X, Plus, Trash2 } from "lucide-react";
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
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        password: "",
        duration: "",
        randomizeQuestions: false,
        questionsCount: "",
        files: [{ name: "main.js", language: "javascript", content: "// Write your solution here\n", readOnly: false }],
        questions: [{ id: 1, title: "Question 1", description: "", points: 10 }],
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
            files: [...prev.files, { name: "", language: "javascript", content: "", readOnly: false }],
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
        if (formData.files.length <= 1) return;
        setFormData((prev) => ({
            ...prev,
            files: prev.files.filter((_, i) => i !== index)
        }));
    };

    const addQuestion = () => {
        setFormData((prev) => {
            const newId = Math.max(...prev.questions.map(q => q.id), 0) + 1;
            return {
                ...prev,
                questions: [
                    ...prev.questions,
                    { id: newId, title: `Question ${newId}`, description: "", points: 10 }
                ]
            };
        });
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

    const languageOptions = [
        { value: "javascript", label: "JavaScript" },
        { value: "python", label: "Python" },
        { value: "java", label: "Java" },
        { value: "cpp", label: "C++" },
        { value: "c", label: "C" },
        { value: "typescript", label: "TypeScript" },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-zinc-950/95 backdrop-blur-2xl border border-white/10 p-0 overflow-hidden rounded-2xl max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b border-white/5 bg-zinc-900/30 sticky top-0 z-10">
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

                <div className="p-6 space-y-6">
                    {/* Title */}
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold ml-1">
                            Test Title *
                        </label>
                        <Input
                            placeholder="e.g., JavaScript Fundamentals"
                            value={formData.title}
                            onChange={(e) => updateField("title", e.target.value)}
                            className="bg-zinc-900 text-white border-white/10 focus:border-blue-500/50 h-12 rounded-xl"
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
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold ml-1 flex items-center gap-2">
                                <Lock size={12} /> Password *
                            </label>
                            <Input
                                type="password"
                                placeholder="Access password"
                                value={formData.password}
                                onChange={(e) => updateField("password", e.target.value)}
                                className="bg-zinc-900 text-white border-white/10 focus:border-blue-500/50 h-12 rounded-xl"
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
                                className="bg-zinc-900 text-white border-white/10 focus:border-blue-500/50 h-12 rounded-xl"
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
                            <Button
                                onClick={addQuestion}
                                variant="ghost"
                                size="sm"
                                className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 h-8 px-3"
                            >
                                <Plus size={14} className="mr-1" /> Add Question
                            </Button>
                        </div>

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
                                <p className="text-xs text-zinc-500 mt-1">Provide starter code files for the questions</p>
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
                                    className="flex gap-3 p-3 bg-zinc-900/50 border border-white/5 rounded-xl"
                                >
                                    <Input
                                        placeholder="filename.js"
                                        value={file.name}
                                        onChange={(e) => updateFile(index, "name", e.target.value)}
                                        className="bg-zinc-800 text-white border-white/10 h-10 rounded-lg flex-1"
                                    />
                                    <select
                                        value={file.language}
                                        onChange={(e) => updateFile(index, "language", e.target.value)}
                                        className="bg-zinc-800 text-white border border-white/10 h-10 rounded-lg px-3 text-sm focus:outline-none focus:border-blue-500/50"
                                    >
                                        {languageOptions.map((lang) => (
                                            <option key={lang.value} value={lang.value}>
                                                {lang.label}
                                            </option>
                                        ))}
                                    </select>
                                    <label className="flex items-center gap-2 text-xs text-zinc-400">
                                        <input
                                            type="checkbox"
                                            checked={file.readOnly}
                                            onChange={(e) => updateFile(index, "readOnly", e.target.checked)}
                                            className="rounded bg-zinc-800 border-white/10"
                                        />
                                        Read-only
                                    </label>
                                    {formData.files.length > 1 && (
                                        <Button
                                            onClick={() => removeFile(index)}
                                            variant="ghost"
                                            size="icon"
                                            className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 h-10 w-10"
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
                            className="flex-1 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 h-12 rounded-xl font-medium"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreate}
                            disabled={isCreating || !formData.title || !formData.password}
                            className="flex-1 bg-white text-black hover:bg-zinc-200 h-12 rounded-xl font-semibold disabled:opacity-50"
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
        </Dialog>
    );
};

export default TestCreationModal;
