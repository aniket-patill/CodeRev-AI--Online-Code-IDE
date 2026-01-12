import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence, GithubAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);  // Single Firestore instance
const rtdb = getDatabase(app);

// Set Auth Persistence
setPersistence(auth, browserLocalPersistence)
  .then(() => { })
  .catch((error) => console.error("Firebase Auth Persistence Error:", error));

// Providers
const githubProvider = new GithubAuthProvider();
githubProvider.addScope('repo'); // Request access to repositories

// Export db and firestore as same instance (backward compatibility)
export { auth, db, rtdb, db as firestore, githubProvider };
export default app;

