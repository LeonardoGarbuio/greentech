import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDvhs5shuF0FdT_DUMNikyd5U3-NqkjZkk",
  authDomain: "greentech-727d5.firebaseapp.com",
  projectId: "greentech-727d5",
  storageBucket: "greentech-727d5.firebasestorage.app",
  messagingSenderId: "593402821069",
  appId: "1:593402821069:web:38231f7b8514049380ec84",
  measurementId: "G-EZSC41G36M"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  return {
    name: user.displayName,
    email: user.email,
    photoUrl: user.photoURL,
    uid: user.uid
  };
};

export { auth };
export default app;
