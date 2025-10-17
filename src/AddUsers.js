// src/AddUsers.js
import { db } from "./firebase"; // your firebase.js
import { collection, setDoc, doc } from "firebase/firestore";

const users = [
  { name: "Sean Vet", email: "sean@example.com", role: "Vet" },
  { name: "Ragini Admin", email: "ragini@example.com", role: "Admin" },
  { name: "Bernie Pet Owner", email: "bernie@example.com", role: "Pet Owner" },
];

const addUsers = async () => {
  try {
    for (const user of users) {
      await setDoc(doc(collection(db, "users"), user.email), user);
      console.log(`✅ Added user: ${user.name}`);
    }
    console.log("🎉 All users added to Firestore!");
  } catch (error) {
    console.error("❌ Error adding users:", error);
  }
};

addUsers();
