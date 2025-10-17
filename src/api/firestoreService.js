import { db } from './firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

export const addPet = async (petData) => {
  const ref = await addDoc(collection(db, 'pets'), petData);
  return ref.id;
};

export const getPetsByOwner = async (ownerID) => {
  const snap = await getDocs(collection(db, 'pets'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => p.ownerID === ownerID);
};

export const addAppointment = async (appt) => {
  const ref = await addDoc(collection(db, 'appointments'), appt);
  return ref.id;
};

export const updatePet = async (petID, data) => {
  const ref = doc(db, 'pets', petID);
  await updateDoc(ref, data);
};

export const deletePet = async (petID) => {
  await deleteDoc(doc(db, 'pets', petID));
};
