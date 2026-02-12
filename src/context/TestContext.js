"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { doc, getDoc, collection, onSnapshot, setDoc, updateDoc, Timestamp, deleteDoc, getDocs, FieldPath } from "firebase/firestore";
import { db } from "@/config/firebase";

const TestContext = createContext();

export const TestProvider = ({ children, testId, participantId }) => {
    const [test, setTest] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [currentParticipant, setCurrentParticipant] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeRemaining, setTimeRemaining] = useState(null);

    // Listen to test data in real-time
    useEffect(() => {
        if (!testId) return;

        const testRef = doc(db, "tests", testId);
        const unsubscribe = onSnapshot(testRef, (docSnap) => {
            if (docSnap.exists()) {
                const testData = { id: docSnap.id, ...docSnap.data() };
                setTest(testData);

                // Calculate time remaining if duration is set and test is active
                if (testData.duration && testData.status === "active") {
                    const startTime = testData.startTime?.toDate() || new Date();
                    const endTime = new Date(startTime.getTime() + testData.duration * 60 * 1000);
                    const remaining = Math.max(0, endTime.getTime() - Date.now());
                    setTimeRemaining(Math.floor(remaining / 1000));
                } else if (testData.status === "ended") {
                    setTimeRemaining(0);
                }
            } else {
                setError("Test not found");
            }
            setIsLoading(false);
        }, (err) => {
            console.error("Error fetching test:", err);
            setError("Failed to load test");
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [testId]);

    // Listen to participants in real-time
    useEffect(() => {
        if (!testId) return;

        const participantsRef = collection(db, `tests/${testId}/participants`);
        const unsubscribe = onSnapshot(participantsRef, (snapshot) => {
            const participantsList = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setParticipants(participantsList);

            // Update current participant if we have one
            if (participantId) {
                const current = participantsList.find((p) => p.id === participantId);
                setCurrentParticipant(current || null);
            }
        });

        return () => unsubscribe();
    }, [testId, participantId]);

    // Timer countdown
    useEffect(() => {
        if (timeRemaining === null || timeRemaining <= 0) return;

        const interval = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [timeRemaining]);


    const joinTest = async (name, email = "") => {
        if (!testId) throw new Error("No test ID");

        // Dynamically import to avoid circular dependencies if any, though utils should be safe
        const { joinTestSession } = await import("@/utils/testUtils");

        const participantId = await joinTestSession(db, testId, name, "dummy_password_bypass", email);
        return participantId;
    };

    // Update participant's code
    const updateCode = async (fileName, code) => {
        if (!testId || !participantId) return;

        const participantRef = doc(db, `tests/${testId}/participants`, participantId);
        await updateDoc(participantRef, {
            [`files.${fileName}`]: code,
            lastActive: Timestamp.now()
        });
    };

    // Submit test
    const submitTest = async () => {
        if (!testId || !participantId) return;

        const participantRef = doc(db, `tests/${testId}/participants`, participantId);
        await updateDoc(participantRef, {
            status: "submitted",
            submittedAt: Timestamp.now(),
        });
    };

    // Leave test
    const leaveTest = async () => {
        if (!testId || !participantId) return;

        const participantRef = doc(db, `tests/${testId}/participants`, participantId);
        await updateDoc(participantRef, {
            status: "left",
            lastActive: Timestamp.now(),
        });
    };

    // Change participant status (used for marking cheaters)
    const changeParticipantStatus = async (participantId, newStatus) => {
        if (!testId || !participantId) return;

        const participantRef = doc(db, `tests/${testId}/participants`, participantId);
        await updateDoc(participantRef, {
            status: newStatus,
            lastActive: Timestamp.now(),
        });
    };

    // Grade participant
    const gradeParticipant = async (participantId, grade, feedback = "") => {
        if (!testId) return;

        const participantRef = doc(db, `tests/${testId}/participants`, participantId);
        await updateDoc(participantRef, {
            grade: grade, // 'passed' or 'failed'
            gradingFeedback: feedback,
            gradedAt: Timestamp.now(),
        });
    };

    // Add a new file for the participant
    const addParticipantFile = async (fileName, language, content = "") => {
        if (!testId || !participantId) return;

        // Get current participant data to append to assignedFiles
        const participantRef = doc(db, `tests/${testId}/participants`, participantId);
        const participantSnap = await getDoc(participantRef);

        if (participantSnap.exists()) {
            const data = participantSnap.data();
            const currentFiles = data.assignedFiles || test?.files || [];

            // Check if file already exists
            if (currentFiles.some(f => f.name === fileName)) {
                throw new Error("File already exists");
            }

            const newFile = {
                name: fileName,
                language: language,
                content: content,
                readOnly: false
            };

            await updateDoc(participantRef, {
                assignedFiles: [...currentFiles, newFile],
                lastActive: Timestamp.now()
            });

            return newFile;
        }
    };

    // Format time remaining
    const formatTime = (seconds) => {
        if (seconds === null) return null;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    // Delete test and all participants
    const deleteTest = async () => {
        if (!testId) return;

        try {
            // First get all participants to delete them
            const participantsRef = collection(db, `tests/${testId}/participants`);
            const participantsSnapshot = await getDocs(participantsRef);

            // Delete all participant documents
            const deleteParticipantPromises = participantsSnapshot.docs.map(doc =>
                deleteDoc(doc.ref)
            );

            await Promise.all(deleteParticipantPromises);

            // Finally delete the test document itself
            const testRef = doc(db, "tests", testId);
            await deleteDoc(testRef);

            return true;
        } catch (error) {
            console.error("Error deleting test:", error);
            throw error;
        }
    };

    // Get files for current participant (either assigned or from test)
    const getCurrentParticipantFiles = () => {
        if (!currentParticipant) return [];

        // Return assigned files if they exist, otherwise return test files
        return currentParticipant.assignedFiles || test?.files || [];
    };

    // Get questions for current participant (either assigned or from test)
    const getCurrentParticipantQuestions = () => {
        if (!currentParticipant) return [];

        // Return assigned questions if they exist, otherwise return test questions
        return currentParticipant.assignedQuestions || test?.questions || [];
    };

    return (
        <TestContext.Provider
            value={{
                test,
                participants,
                currentParticipant,
                isLoading,
                error,
                timeRemaining,
                formattedTime: formatTime(timeRemaining),
                isTimeUp: timeRemaining === 0,
                joinTest,
                updateCode,
                submitTest,
                leaveTest,
                changeParticipantStatus,
                gradeParticipant,
                addParticipantFile,
                deleteTest,
                getCurrentParticipantFiles,
                getCurrentParticipantQuestions,
            }}
        >
            {children}
        </TestContext.Provider>
    );
};

export const useTest = () => {
    const context = useContext(TestContext);
    if (!context) {
        return {
            test: null,
            participants: [],
            currentParticipant: null,
            isLoading: false,
            error: "TestProvider missing",
            timeRemaining: null,
            formattedTime: null,
            isTimeUp: false,
            joinTest: () => Promise.reject("Provider missing"),
            updateCode: () => Promise.resolve(),
            submitTest: () => Promise.resolve(),
            leaveTest: () => Promise.resolve(),
            changeParticipantStatus: () => Promise.reject("Provider missing"),
            gradeParticipant: () => Promise.resolve(),
            addParticipantFile: () => Promise.resolve(),
            getCurrentParticipantFiles: () => [],
            getCurrentParticipantQuestions: () => [],
        };
    }
    return context;
};
