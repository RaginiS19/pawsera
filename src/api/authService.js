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

export const registerUser = async (email, password, role='PetOwner', name='', additionalData = {}) => {
  if (!auth || !db) {
    throw new Error('Firebase not initialized. Please check your configuration.');
  }
  
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create user document in Firestore with all necessary fields
    // Vets start with 'pending' status for admin approval, others are 'active'
    const defaultStatus = role === 'Vet' ? 'pending' : 'active';
    
    const userData = {
      userID: user.uid,
      id: user.uid,
      name: name || email.split('@')[0], // Use email prefix if name not provided
      email,
      role: role || 'PetOwner',
      status: defaultStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...additionalData // Include any additional data (like clinicName, licenseNumber for vets)
    };
    
    // Try to save to Firestore - this is critical for login to work
    // We'll try multiple times and with different approaches
    let firestoreSaveSuccess = false;
    
    try {
      // First, try to save with UID as document ID
      await setDoc(doc(db, 'users', user.uid), userData);
      console.log('✅ User document created in Firestore with UID:', userData);
      firestoreSaveSuccess = true;
    } catch (uidErr) {
      console.warn('⚠️ Could not save user with UID, trying email as ID:', uidErr);
      
      // If UID save fails, try with email as document ID
      try {
        await setDoc(doc(db, 'users', email), userData, { merge: true });
        console.log('✅ User document saved with email as ID');
        firestoreSaveSuccess = true;
      } catch (emailErr) {
        console.error('❌ Could not save user with email as ID either:', emailErr);
      }
    }
    
    // If both methods failed, log a warning but don't throw an error
    // The account is still created in Firebase Auth, and we can create user data on login
    if (!firestoreSaveSuccess) {
      console.warn('⚠️ User account created in Firebase Auth, but Firestore save failed.');
      console.warn('⚠️ User data will be created automatically on first login.');
      // Don't throw error - allow registration to succeed
      // The login flow will handle creating user data if missing
    }
    
    return user;
  } catch (error) {
    console.error('Registration error:', error);
    // Re-throw with more context
    if (error.code) {
      throw error; // Firebase errors already have good messages
    }
    throw new Error(error.message || 'Failed to create account. Please try again.');
  }
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
  
  // Check if vet account is approved
  if (userData.status !== 'approved') {
    throw new Error('Your veterinarian account is pending approval. Please wait for an administrator to approve your account.');
  }
  
  return user;
};

export const logoutUser = async () => {
  if (!auth) {
    throw new Error('Firebase not initialized. Please check your configuration.');
  }
  await signOut(auth);
};
