import { auth, db } from "./firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

// Login function
export const login = async (email, password) => {
  try {
    // 1️⃣ Log in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    console.log("Firebase Auth UID:", user.uid);

    // 2️⃣ Fetch Firestore data using Document ID (we use email prefix for simplicity)
    let docId;
    if (email.startsWith("sean")) docId = "sean";
    else if (email.startsWith("ragini")) docId = "ragini";
    else if (email.startsWith("bernie")) docId = "bernie";
    else throw new Error("Unknown user");

    const userDoc = await getDoc(doc(db, "users", docId));

    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log("Logged in as:", userData.name, "Role:", userData.role);
      return userData;
    } else {
      console.log("No Firestore data found for this user");
    }
  } catch (error) {
    console.error("Login failed:", error.message);
  }
};
