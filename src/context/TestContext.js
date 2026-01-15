"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { doc, getDoc, collection, onSnapshot, setDoc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/config/firebase";

const TestContext = createContext();

export const TestProvider = ({ children, testId, participantId }) => {
    const [test, setTest] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [currentParticipant, setCurrentParticipant] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeRemaining, setTimeRemaining] = useState(null);

    // Fetch test data
    useEffect(() => {
        if (!testId) return;

        const fetchTest = async () => {
            try {
                const testRef = doc(db, "tests", testId);
                const testSnap = await getDoc(testRef);

                if (testSnap.exists()) {
                    const testData = { id: testSnap.id, ...testSnap.data() };
                    setTest(testData);

                    // Calculate time remaining if duration is set
                    if (testData.duration && testData.status === "active") {
                        const startTime = testData.startTime?.toDate() || new Date();
                        const endTime = new Date(startTime.getTime() + testData.duration * 60 * 1000);
                        const remaining = Math.max(0, endTime.getTime() - Date.now());
                        setTimeRemaining(Math.floor(remaining / 1000));
                    }
                } else {
                    setError("Test not found");
                }
            } catch (err) {
                console.error("Error fetching test:", err);
                setError("Failed to load test");
            } finally {
                setIsLoading(false);
            }
        };

        fetchTest();
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

    // Join test as participant
    const joinTest = async (name, email = "") => {
        if (!testId) throw new Error("No test ID");

        const participantRef = doc(collection(db, `tests/${testId}/participants`));
        const participantData = {
            name,
            email,
            joinedAt: Timestamp.now(),
            lastActive: Timestamp.now(),
            status: "active",
            submittedAt: null,
            files: {},
        };

        await setDoc(participantRef, participantData);
        return participantRef.id;
    };

    // Update participant's code
    const updateCode = async (fileName, code) => {
        if (!testId || !participantId) return;

        const participantRef = doc(db, `tests/${testId}/participants`, participantId);
        await updateDoc(participantRef, {
            [`files.${fileName}`]: code,
            lastActive: Timestamp.now(),
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

    // Format time remaining
    const formatTime = (seconds) => {
        if (seconds === null) return null;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
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
        };
    }
    return context;
};
