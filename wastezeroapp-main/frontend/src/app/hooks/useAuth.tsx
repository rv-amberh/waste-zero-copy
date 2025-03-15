import { useEffect, useState, createContext, useContext } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from '../../lib/firebase'; // Import the auth object from the firebase config
import { useRouter } from "next/navigation";

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState<string | null>(null); // Initialize with null
  const router = useRouter(); // Now this works because we're on the client

  // Update userId when the user logs in
  const login = (userId: string) => {
    setUserId(userId); // Set userId directly in state
    console.log(userId, "User logged in:");
  };

  useEffect(() => {
    // Start listener and store user data when auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);  // Update user state based on authentication status
        setUserId(user.uid); // Set the userId directly from user object
        console.log(user, "user")
      } else {
        setUser(null);  // Reset if no user is logged in
        setUserId(null);
      }
    });

    return () => unsubscribe();  // Cleanup listener when component unmounts
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      router.push("/landing");
      console.log("User is signed out");
      setUser(null);
      setUserId(null);
    } catch (error) {
      console.error(error);
    }
  };

  return { user, logout, login, userId };
};

export default useAuth;
