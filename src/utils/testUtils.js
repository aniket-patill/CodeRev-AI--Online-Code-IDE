import { doc, getDoc, collection, setDoc, Timestamp } from "firebase/firestore";

/**
 * Encapsulates the logic for a user joining a test, including
 * password verification, status checks, and question/file randomization.
 * 
 * @param {Object} db - Firebase Firestore instance
 * @param {string} testId - ID of the test to join
 * @param {string} name - Participant's name
 * @param {string} password - Access password entered by the user
 * @param {string} email - Optional participant email
 * @returns {Promise<string>} - The ID of the newly created participant document
 */
export const joinTestSession = async (db, testId, name, password, email = "") => {
    if (!testId) throw new Error("No test ID provided");
    if (!name) throw new Error("Name is required");
    if (!password) throw new Error("Password is required");

    // 1. Fetch the test document
    const testRef = doc(db, "tests", testId);
    const testSnap = await getDoc(testRef);

    if (!testSnap.exists()) {
        throw new Error("Test not found");
    }

    const testData = testSnap.data();

    // 2. Verify password (simple string comparison as per current implementation)
    // In a real app, you might use a hashed comparison here if stored hashed.
    if (testData.password !== password) {
        throw new Error("Incorrect password");
    }

    // 3. Check test status
    if (testData.status === "ended") {
        throw new Error("This test has ended");
    }

    // 4. Prepare participant data
    const participantRef = doc(collection(db, `tests/${testId}/participants`));

    let participantData = {
        name: name.trim(),
        email: email || "",
        joinedAt: Timestamp.now(),
        lastActive: Timestamp.now(),
        status: "active",
        submittedAt: null,
        files: {},
        // We will populate assignedQuestions/assignedFiles below
    };

    // 5. Handle Randomization Logic
    // Randomize Questions
    if (testData.randomizeQuestions && testData.questions && testData.questionsCount) {
        const totalQuestions = testData.questions;
        // Ensure we don't try to take more than available
        const questionsCount = Math.min(testData.questionsCount, totalQuestions.length);

        // Fisher-Yates shuffle
        const shuffledQuestions = [...totalQuestions];
        for (let i = shuffledQuestions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledQuestions[i], shuffledQuestions[j]] = [shuffledQuestions[j], shuffledQuestions[i]];
        }

        // Assign the first N questions
        participantData.assignedQuestions = shuffledQuestions.slice(0, questionsCount);
    } else {
        // Fallback: Assign all questions
        participantData.assignedQuestions = testData.questions || [];
    }

    // Randomize Files (if questions are randomized, files usually correlate, 
    // but the current implementation treats them somewhat separately or as global resources.
    // If the schema implies files belong to questions, this logic might need adjustment,
    // but based on `TestCreationModal`, files seem to be a separate list of starter code.)
    // However, `TestContext` had logic to randomize files too. Let's preserve that.
    if (testData.randomizeQuestions && testData.files && testData.questionsCount) {
        const totalFiles = testData.files;
        // Logic: If I select 3 questions, do I select 3 files? 
        // The previous context logic did this. It assumes 1 file per question or similar ratio?
        // Or maybe strictly random subset of files. PROBABLY 1 file for the whole test in some cases?
        // Wait, `TestCreationModal` allows adding multiple files. 
        // If they are just helper files, maybe we shouldn't randomize them unless specifically asked.
        // But let's stick to the previous `TestContext` logic to be safe/consistent.
        const questionsCount = Math.min(testData.questionsCount, totalFiles.length);

        const shuffledFiles = [...totalFiles];
        for (let i = shuffledFiles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledFiles[i], shuffledFiles[j]] = [shuffledFiles[j], shuffledFiles[i]];
        }
        participantData.assignedFiles = shuffledFiles.slice(0, questionsCount);
    } else {
        participantData.assignedFiles = testData.files || [];
    }

    // 6. Write to Firestore
    await setDoc(participantRef, participantData);

    return participantRef.id;
};
