import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/config/firebase";

/**
 * Get onboarding status for a user
 */
export const getOnboardingStatus = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, `users/${userId}`));
    if (userDoc.exists()) {
      return userDoc.data().onboarding || {
        hasSeenWelcome: false,
        dashboardTourComplete: false,
        workspaceTourComplete: false,
        isSkipped: false,
      };
    }
    return {
      hasSeenWelcome: false,
      dashboardTourComplete: false,
      workspaceTourComplete: false,
      isSkipped: false,
    };
  } catch (error) {
    console.error("Error fetching onboarding status:", error);
    return null;
  }
};

/**
 * Update onboarding status for a user
 */
export const updateOnboardingStatus = async (userId, updates) => {
  try {
    const userRef = doc(db, `users/${userId}`);
    await setDoc(
      userRef,
      {
        onboarding: updates,
      },
      { merge: true }
    );
    return true;
  } catch (error) {
    console.error("Error updating onboarding status:", error);
    return false;
  }
};

/**
 * Mark onboarding as skipped
 */
export const skipOnboarding = async (userId) => {
  return updateOnboardingStatus(userId, {
    hasSeenWelcome: true,
    isSkipped: true,
    // We do NOT mark tours as complete so user can be asked again later
  });
};

/**
 * Mark welcome as seen
 */
export const markWelcomeSeen = async (userId) => {
  const current = await getOnboardingStatus(userId);
  return updateOnboardingStatus(userId, {
    ...current,
    hasSeenWelcome: true,
  });
};

/**
 * Mark dashboard tour as complete
 */
export const markDashboardTourComplete = async (userId) => {
  const current = await getOnboardingStatus(userId);
  return updateOnboardingStatus(userId, {
    ...current,
    dashboardTourComplete: true,
  });
};

/**
 * Mark workspace tour as complete
 */
export const markWorkspaceTourComplete = async (userId) => {
  const current = await getOnboardingStatus(userId);
  return updateOnboardingStatus(userId, {
    ...current,
    workspaceTourComplete: true,
  });
};
