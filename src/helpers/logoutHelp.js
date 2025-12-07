import { getAuth, signOut } from "firebase/auth";


const logout = async () => {
  const auth = getAuth();
  try {
    await signOut(auth);

    // Redirect to login page after logout
    window.location.href = "/login";
  } catch (error) {
    console.error("Error logging out:", error.message);
  }
};

export default logout;
