"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, collection, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "@/config/firebase";
import { MODES } from "@/context/WorkspaceSettingsContext";

/**
 * Custom hook to manage workspace logic based on mode.
 * Separates file systems for Focus and Learning modes.
 */
export const useWorkspaceLogic = (workspaceId, mode) => {
    const [workspaceName, setWorkspaceName] = useState("");
    const [membersCount, setMembersCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hasFiles, setHasFiles] = useState(false);
    const [showCreateFilePrompt, setShowCreateFilePrompt] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    // Determine collection names based on mode
    const getCollectionNames = (currentMode) => {
        if (currentMode === MODES.LEARNING) {
            return {
                files: `workspaces/${workspaceId}/learningFiles`,
                folders: `workspaces/${workspaceId}/learningFolders`,
            };
        }
        // Default to Focus mode collections (existing data)
        return {
            files: `workspaces/${workspaceId}/files`,
            folders: `workspaces/${workspaceId}/folders`,
        };
    };

    const collectionNames = getCollectionNames(mode);

    // Fetch workspace data (name, members - shared across modes)
    useEffect(() => {
        const fetchWorkspace = async () => {
            if (!workspaceId) {
                setError("No workspace ID provided");
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                setError(null);

                const workspaceRef = doc(db, "workspaces", workspaceId);
                const workspaceSnap = await getDoc(workspaceRef);

                if (workspaceSnap.exists()) {
                    const workspaceData = workspaceSnap.data();
                    setWorkspaceName(workspaceData.name || "Untitled Workspace");

                    const membersRef = collection(db, `workspaces/${workspaceId}/members`);
                    const membersSnap = await getDocs(membersRef);
                    setMembersCount(membersSnap.size);

                    // Check if workspace has any files for current mode
                    const filesRef = collection(db, collectionNames.files);
                    const filesSnap = await getDocs(filesRef);
                    const filesExist = filesSnap.size > 0;
                    setHasFiles(filesExist);

                    if (!filesExist && !error) {
                        setShowCreateFilePrompt(true);
                    }
                } else {
                    setError("Space not found");
                }
            } catch (err) {
                console.error("Error fetching workspace:", err);
                setError("Failed to load workspace. Please try again.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchWorkspace();
    }, [workspaceId, mode, collectionNames.files]);

    // Listen for file changes (mode-specific)
    useEffect(() => {
        if (!workspaceId || isLoading || !mode) return;

        const filesRef = collection(db, collectionNames.files);
        const unsubscribe = onSnapshot(filesRef, (snapshot) => {
            const filesExist = snapshot.size > 0;
            setHasFiles(filesExist);

            if (filesExist) {
                setShowCreateFilePrompt(false);
            } else {
                if (!isLoading) {
                    setSelectedFile(null);
                    setShowCreateFilePrompt(true);
                }
            }
        });

        return () => unsubscribe();
    }, [workspaceId, isLoading, mode, collectionNames.files]);

    // Reset selected file when mode changes
    useEffect(() => {
        setSelectedFile(null);
    }, [mode]);

    const handleFileSelect = (file) => {
        setSelectedFile(file);
    };

    const handleFileCreated = (file) => {
        if (!hasFiles && file) {
            handleFileSelect(file);
            setHasFiles(true);
            setShowCreateFilePrompt(false);
        }
    };

    return {
        workspaceName,
        membersCount,
        isLoading,
        error,
        hasFiles,
        showCreateFilePrompt,
        selectedFile,
        handleFileSelect,
        handleFileCreated,
        collectionNames,
    };
};
