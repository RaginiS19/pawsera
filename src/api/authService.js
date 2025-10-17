import { auth, db } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

// Helper function to find user data by email
export const findUserByEmail = async (email) => {
  try {
    const usersQuery = query(collection(db, 'users'), where('email', '==', email));
    const querySnapshot = await getDocs(usersQuery);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    // Return the first matching user
    const userDoc = querySnapshot.docs[0];
    return { id: userDoc.id, ...userDoc.data() };
  } catch (error) {
    console.error('Error finding user by email:', error);
    throw new Error('Unable to access user data. Please check your connection and try again.');
  }
};

export const registerUser = async (email, password, role='PetOwner', name='') => {
  if (!auth || !db) {
    throw new Error('Firebase not initialized. Please check your configuration.');
  }
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  await setDoc(doc(db, 'users', user.uid), {
    userID: user.uid,
    name,
    email,
    role,
    createdAt: new Date().toISOString(),
  });
  return user;
};

export const loginUser = async (email, password) => {
  if (!auth) {
    throw new Error('Firebase not initialized. Please check your configuration.');
  }
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const loginAdmin = async (email, password) => {
  if (!auth || !db) {
    throw new Error('Firebase not initialized. Please check your configuration.');
  }
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  // Find user data by email (since document ID might not match UID)
  const userData = await findUserByEmail(email);
  if (!userData) {
    throw new Error('User not found. Please contact administrator.');
  }
  
  console.log('Admin user data:', userData); // Debug log
  console.log('Admin user role:', userData.role); // Debug log
  
  if (userData.role !== 'Admin') {
    throw new Error(`Access denied. Admin privileges required. Current role: ${userData.role}`);
  }
  
  return user;
};

export const loginVet = async (email, password) => {
  if (!auth || !db) {
    throw new Error('Firebase not initialized. Please check your configuration.');
  }
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  // Find user data by email (since document ID might not match UID)
  const userData = await findUserByEmail(email);
  if (!userData) {
    throw new Error('User not found. Please contact administrator.');
  }
  
  console.log('Vet user data:', userData); // Debug log
  console.log('Vet user role:', userData.role); // Debug log
  
  if (userData.role !== 'Vet') {
    throw new Error(`Access denied. Veterinarian privileges required. Current role: ${userData.role}`);
  }
  
  return user;
};

export const logoutUser = async () => {
  if (!auth) {
    throw new Error('Firebase not initialized. Please check your configuration.');
  }
  await signOut(auth);
};
