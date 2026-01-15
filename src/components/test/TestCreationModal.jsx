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
    });

    const updateField = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
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
            
            let updatedFormData = { ...prev, files: newFiles };
            
            // If changing the name field and randomization is enabled, adjust questionsCount if needed
            if (field === 'name' && prev.randomizeQuestions) {
                const namedFilesAfterUpdate = newFiles.filter(f => f.name.trim()).length;
                if (parseInt(prev.questionsCount) > namedFilesAfterUpdate) {
                    updatedFormData.questionsCount = namedFilesAfterUpdate.toString();
                }
            }
            
            return updatedFormData;
        });
    };

    const removeFile = (index) => {
        if (formData.files.length <= 1) return;
        setFormData((prev) => {
            const newFiles = prev.files.filter((_, i) => i !== index);
            
            let updatedFormData = {
                ...prev,
                files: newFiles
            };
            
            // If randomization is enabled, adjust questionsCount if needed
            if (prev.randomizeQuestions) {
                const namedFilesAfterRemoval = newFiles.filter(f => f.name.trim()).length;
                if (parseInt(prev.questionsCount) > namedFilesAfterRemoval) {
                    updatedFormData.questionsCount = namedFilesAfterRemoval.toString();
                }
            }
            
            return updatedFormData;
        });
    };

    const handleCreate = async () => {
        const namedFiles = formData.files.filter((f) => f.name.trim());
        
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
            
            if (questionsCount > namedFiles.length) {
                toast.error(`Cannot assign ${questionsCount} questions per student when only ${namedFiles.length} named files exist`);
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
                                        max={formData.files.filter(f => f.name.trim()).length}
                                        placeholder="Number of questions each student gets"
                                        value={formData.questionsCount}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            const numValue = parseInt(value) || 0;
                                            // Validate that questionsCount is not greater than total named files
                                            const namedFilesCount = formData.files.filter(f => f.name.trim()).length;
                                            if (numValue <= namedFilesCount) {
                                                updateField("questionsCount", e.target.value);
                                            }
                                        }}
                                        className="bg-zinc-800 text-white border-white/10 focus:border-blue-500/50 h-10 rounded-lg"
                                    />
                                    <p className="text-xs text-zinc-500">
                                        Maximum {formData.files.filter(f => f.name.trim()).length} based on named files
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Starter Files */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold ml-1">
                                Starter Files
                            </label>
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
