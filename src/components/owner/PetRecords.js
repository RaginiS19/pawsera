import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { auth, db, storage } from '../../api/firebase';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc } from 'firebase/firestore';
import { logoutUser } from '../../api/authService';
import { uploadFile } from '../../api/storageService';
import { getDummyPets, getDummyMedicalHistoryByPetId } from '../../api/dummyData';
import BottomNavigation from '../common/BottomNavigation';

export default function PetRecords() {
  const navigate = useNavigate();
  const { petId } = useParams();
  const [pet, setPet] = useState(null);
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [documents, setDocuments] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showAddMedical, setShowAddMedical] = useState(false);
  const [showUploadDoc, setShowUploadDoc] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [medicalForm, setMedicalForm] = useState({
    title: '',
    doctor: '',
    date: '',
    description: '',
    type: 'checkup'
  });

  const user = auth?.currentUser || null;

  // Helper functions for localStorage
  const saveMedicalHistoryToLocalStorage = (records) => {
    try {
      const userId = user?.uid || 'default';
      localStorage.setItem(`pawsera_medical_${petId}_${userId}`, JSON.stringify(records));
      console.log('✅ Medical records saved to localStorage');
    } catch (err) {
      console.warn('Could not save medical records to localStorage:', err);
    }
  };

  const loadMedicalHistoryFromLocalStorage = () => {
    try {
      const userId = user?.uid || 'default';
      const saved = localStorage.getItem(`pawsera_medical_${petId}_${userId}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (err) {
      console.warn('Could not load medical records from localStorage:', err);
    }
    return [];
  };

  const saveDocumentsToLocalStorage = (docs) => {
    try {
      const userId = user?.uid || 'default';
      localStorage.setItem(`pawsera_documents_${petId}_${userId}`, JSON.stringify(docs));
      console.log('✅ Documents saved to localStorage');
    } catch (err) {
      console.warn('Could not save documents to localStorage:', err);
    }
  };

  const loadDocumentsFromLocalStorage = () => {
    try {
      const userId = user?.uid || 'default';
      const saved = localStorage.getItem(`pawsera_documents_${petId}_${userId}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (err) {
      console.warn('Could not load documents from localStorage:', err);
    }
    return [];
  };

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    if (petId) {
      loadData();
    }
  }, [navigate, user, petId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let petData = null;
      let medicalHistoryData = [];
      let documentsData = [];

      try {
        const [petDoc, medicalSnap, docsSnap] = await Promise.all([
          getDoc(doc(db, 'pets', petId)),
          getDocs(collection(db, 'medical_history')),
          getDocs(collection(db, 'documents'))
        ]);

        if (petDoc.exists()) {
          petData = { id: petDoc.id, ...petDoc.data() };
        }

        medicalHistoryData = medicalSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(m => m.petId === petId)
          .sort((a, b) => new Date(b.date) - new Date(a.date));

        documentsData = docsSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(d => d.petId === petId)
          .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
      } catch (firebaseErr) {
        console.warn('Firebase error, using dummy data:', firebaseErr.message);
      }

      // Use dummy data as fallback if Firebase data is empty or unavailable
      if (!petData) {
        const dummyPets = getDummyPets();
        petData = dummyPets.find(p => p.id === petId) || dummyPets[0];
        if (petData) {
          // Map dummy pet data to match expected structure
          petData = {
            id: petData.id,
            name: petData.name,
            breed: petData.breed,
            age: petData.age?.toString() || 'N/A',
            type: petData.species || petData.type || 'Dog',
            gender: petData.gender || 'N/A',
            weight: petData.weight || '',
            color: petData.color || '',
            notes: petData.medicalHistory?.join(', ') || ''
          };
        }
      }

      // Use dummy medical history if no Firebase data
      if (medicalHistoryData.length === 0) {
        // Try to find dummy data for this petId
        medicalHistoryData = getDummyMedicalHistoryByPetId(petId);
        // If no dummy data for this pet, use first pet's data for demo purposes
        if (medicalHistoryData.length === 0) {
          // Check if petId might be a Firebase ID - use first available dummy records
          const allDummyRecords = getDummyMedicalHistoryByPetId('pet1');
          if (allDummyRecords.length > 0) {
            medicalHistoryData = allDummyRecords;
          }
        }
      }

      // Load from localStorage
      const localMedical = loadMedicalHistoryFromLocalStorage();
      const localDocs = loadDocumentsFromLocalStorage();
      
      // Merge Firebase data with localStorage data
      const localMedicalNotInFirebase = localMedical.filter(localRecord => 
        !medicalHistoryData.some(fbRecord => 
          fbRecord.id === localRecord.id || 
          (fbRecord.title === localRecord.title && 
           fbRecord.date === localRecord.date && 
           fbRecord.petId === localRecord.petId)
        )
      );
      
      const localDocsNotInFirebase = localDocs.filter(localDoc => 
        !documentsData.some(fbDoc => 
          fbDoc.id === localDoc.id || 
          (fbDoc.fileName === localDoc.fileName && 
           fbDoc.petId === localDoc.petId)
        )
      );
      
      const allMedical = [...medicalHistoryData, ...localMedicalNotInFirebase];
      const allDocs = [...documentsData, ...localDocsNotInFirebase];
      
      setPet(petData);
      setMedicalHistory(allMedical);
      setDocuments(allDocs);
      
      // Save merged data to localStorage
      saveMedicalHistoryToLocalStorage(allMedical);
      saveDocumentsToLocalStorage(allDocs);
      
      // Debug logging
      console.log('Pet Records Loaded:', {
        pet: petData,
        medicalHistoryCount: medicalHistoryData.length,
        documentsCount: documentsData.length,
        petId
      });
    } catch (err) {
      console.error('Error loading pet records:', err);
      setError(err.message || 'Failed to load pet records');
      // Still try to load dummy data on error
      try {
        const dummyPets = getDummyPets();
        const petData = dummyPets.find(p => p.id === petId) || dummyPets[0];
        if (petData) {
          setPet({
            id: petData.id,
            name: petData.name,
            breed: petData.breed,
            age: petData.age?.toString() || 'N/A',
            type: petData.species || petData.type || 'Dog',
            gender: petData.gender || 'N/A',
            weight: petData.weight || '',
            color: petData.color || '',
            notes: petData.medicalHistory?.join(', ') || ''
          });
        }
        const dummyMedHistory = getDummyMedicalHistoryByPetId(petId);
        setMedicalHistory(dummyMedHistory.length > 0 ? dummyMedHistory : getDummyMedicalHistoryByPetId('pet1'));
      } catch (dummyErr) {
        console.error('Error loading dummy data:', dummyErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMedicalSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setError(null);
    setSuccessMessage(null);
    
    // Validate required fields
    if (!medicalForm.title || !medicalForm.doctor || !medicalForm.date || !medicalForm.description) {
      setError('Please fill in all required fields');
      return;
    }
    
    const newRecord = {
      ...medicalForm,
      petId,
      ownerID: user?.uid || 'unknown',
      createdAt: new Date().toISOString()
    };

    console.log('Saving medical record:', newRecord);

    let savedToFirebase = false;
    
    // Try to save to Firestore if available
    if (db) {
      try {
        const docRef = await addDoc(collection(db, 'medical_history'), newRecord);
        console.log('✅ Medical record saved to Firestore with ID:', docRef.id);
        savedToFirebase = true;
        setSuccessMessage('Medical record added successfully!');
      } catch (firestoreErr) {
        console.warn('Firestore save failed, using local storage:', firestoreErr);
        savedToFirebase = false;
      }
    }
    
    // Always add to local state (for immediate display and as fallback)
    const localRecord = {
      id: savedToFirebase ? undefined : `local_med_${Date.now()}`,
      ...newRecord
    };
    
    setMedicalHistory(prev => {
      const updated = [localRecord, ...prev];
      console.log('✅ Medical record added to local state. Total records:', updated.length);
      saveMedicalHistoryToLocalStorage(updated);
      return updated;
    });
    
    // Close modal and reset form
    setShowAddMedical(false);
    setMedicalForm({
      title: '',
      doctor: '',
      date: '',
      description: '',
      type: 'checkup'
    });
    
    // If saved to Firebase, reload data to get the Firebase ID
    if (savedToFirebase) {
      try {
        await loadData();
      } catch (loadErr) {
        console.warn('Could not reload data:', loadErr.message);
        // Keep the local state we just set
      }
    }
    
    // Show success message
    if (!savedToFirebase) {
      setSuccessMessage('Medical record added successfully! (Saved locally)');
    }
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0] || e.dataTransfer?.files?.[0];
    if (!file) {
      setUploading(false);
      return;
    }
    
    console.log('File selected:', file.name, file.type, file.size);
    await processFileUpload(file, e.target || e);
  };

  const processFileUpload = async (file, inputElement) => {
    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please upload PDF, JPG, or PNG files only.');
      setUploading(false);
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError('File size too large. Maximum size is 10MB.');
      setUploading(false);
      return;
    }

    setUploading(true);
    setError(null);
    setSuccessMessage(null);
    
    console.log('Starting file upload process...');
    
    // Create local URL immediately for fallback
    const localFileUrl = URL.createObjectURL(file);
    console.log('Local file URL created:', localFileUrl);
    
    let fileUrl = localFileUrl;
    let savedToFirebase = false;

    // Try Firebase Storage with a short timeout (3 seconds for faster fallback)
    if (storage) {
      try {
        console.log('Attempting Firebase Storage upload...');
        const uploadPromise = uploadFile(file, 'pet-documents');
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Upload timeout')), 3000)
        );
        fileUrl = await Promise.race([uploadPromise, timeoutPromise]);
        savedToFirebase = true;
        console.log('✅ File uploaded to Firebase Storage:', fileUrl);
      } catch (storageErr) {
        console.warn('⚠️ Firebase Storage upload failed, using local URL:', storageErr.message);
        fileUrl = localFileUrl;
      }
    } else {
      console.warn('⚠️ Firebase Storage not available, using local URL');
    }
    
    // Try to save to Firestore, but fallback to local state if it fails
    const newDoc = {
      id: savedToFirebase ? undefined : `local_${Date.now()}`,
      petId,
      ownerID: user.uid,
      fileName: file.name,
      fileUrl,
      fileSize: file.size,
      fileType: file.type,
      uploadedAt: new Date().toISOString()
    };

    // Always add to local state first (for immediate display)
    setDocuments(prev => {
      const updated = [newDoc, ...prev];
      console.log('✅ Document added to local state. Total documents:', updated.length);
      saveDocumentsToLocalStorage(updated);
      return updated;
    });
    
    // Try to save to Firestore if Firebase is available
    if (db && savedToFirebase) {
      try {
        const docRef = await addDoc(collection(db, 'documents'), newDoc);
        console.log('✅ Document saved to Firestore with ID:', docRef.id);
        // Reload to get Firebase ID
        try {
          await loadData();
        } catch (loadErr) {
          console.warn('Could not reload data:', loadErr.message);
          // Keep the local state we just set
        }
        setSuccessMessage('Document uploaded successfully!');
      } catch (firestoreErr) {
        console.warn('Firestore save failed, keeping local state:', firestoreErr);
        setSuccessMessage('Document uploaded successfully! (Saved locally)');
      }
    } else {
      // No Firebase or upload failed, using local state only
      console.log('Document saved to local state (no Firebase)');
      setSuccessMessage('Document uploaded successfully! (Saved locally)');
    }
    
    // Reset file input
    if (inputElement && inputElement.value !== undefined) {
      inputElement.value = '';
    }
    
    setTimeout(() => setSuccessMessage(null), 3000);
    
    console.log('✅ Upload process completed');
    setUploading(false);
    setDragActive(false);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFileUpload(e.dataTransfer.files[0], null);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/');
    } catch (e) {
      setError(e.message || 'Logout failed');
    }
  };

  if (loading) {
    return (
      <div className="screen-container">
        <div className="mobile-phone-frame">
          <div className="mobile-screen">
            <div className="screen-content with-bottom-nav">
              <div className="page-header">
                <button className="back-button" onClick={() => navigate('/mypets')}>← Back</button>
                <h1 className="page-title">Pet Records</h1>
                <button className="logout-button" onClick={handleLogout}>Logout</button>
              </div>
              <div style={{ padding: 20, textAlign: 'center' }}>
                <p>Loading pet records...</p>
              </div>
            </div>
            <BottomNavigation userType="owner" />
          </div>
        </div>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="screen-container">
        <div className="mobile-phone-frame">
          <div className="mobile-screen">
            <div className="screen-content with-bottom-nav">
              <div className="page-header">
                <button className="back-button" onClick={() => navigate('/mypets')}>← Back</button>
                <h1 className="page-title">Pet Records</h1>
                <button className="logout-button" onClick={handleLogout}>Logout</button>
              </div>
              <div style={{ padding: 20, textAlign: 'center' }}>
                <p>Pet not found</p>
              </div>
            </div>
            <BottomNavigation userType="owner" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-container">
      <div className="mobile-phone-frame">
        <div className="mobile-screen">
          <div className="screen-content with-bottom-nav">
        <div className="page-header">
          <button className="back-button" onClick={() => navigate('/mypets')}>← Back</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '50%', 
              backgroundColor: '#F7931E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '18px'
            }}>
              {pet.imageUrl ? (
                <img 
                  src={pet.imageUrl} 
                  alt={pet.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                />
              ) : (
                '🐾'
              )}
            </div>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#F7931E', margin: 0 }}>
                {pet.name}'s Records
              </h1>
              <p style={{ fontSize: '14px', color: '#FFFFFF', margin: 0, fontWeight: '500' }}>
                {pet.breed}
              </p>
            </div>
          </div>
          <button className="logout-button" onClick={handleLogout}>Logout</button>
        </div>

        {error && (
          <div className="error-message" style={{ margin: '16px' }}>
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {successMessage && (
          <div style={{ 
            margin: '16px', 
            padding: '12px 16px',
            backgroundColor: '#10B981',
            color: '#FFFFFF',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            <span>✅</span>
            {successMessage}
          </div>
        )}

        {/* Pet Information Summary */}
        <div style={{ padding: '0 16px', marginTop: '16px', marginBottom: '16px' }}>
          <div className="enhanced-card" style={{ padding: '16px', backgroundColor: '#374151' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#FFFFFF', margin: '0 0 12px 0' }}>
              Pet Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <p style={{ fontSize: '12px', color: '#FFFFFF', margin: '0 0 4px 0', fontWeight: '500', opacity: '0.8' }}>Type</p>
                <p style={{ fontSize: '14px', color: '#FFFFFF', margin: 0, fontWeight: '600' }}>{pet.type || 'N/A'}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#FFFFFF', margin: '0 0 4px 0', fontWeight: '500', opacity: '0.8' }}>Age</p>
                <p style={{ fontSize: '14px', color: '#FFFFFF', margin: 0, fontWeight: '600' }}>{pet.age || 'N/A'}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#FFFFFF', margin: '0 0 4px 0', fontWeight: '500', opacity: '0.8' }}>Gender</p>
                <p style={{ fontSize: '14px', color: '#FFFFFF', margin: 0, fontWeight: '600' }}>{pet.gender || 'N/A'}</p>
              </div>
              {pet.weight && (
                <div>
                  <p style={{ fontSize: '12px', color: '#FFFFFF', margin: '0 0 4px 0', fontWeight: '500', opacity: '0.8' }}>Weight</p>
                  <p style={{ fontSize: '14px', color: '#FFFFFF', margin: 0, fontWeight: '600' }}>{pet.weight}</p>
                </div>
              )}
            </div>
            {pet.notes && (
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                <p style={{ fontSize: '12px', color: '#FFFFFF', margin: '0 0 4px 0', fontWeight: '500', opacity: '0.8' }}>Notes</p>
                <p style={{ fontSize: '14px', color: '#FFFFFF', margin: 0, lineHeight: '1.5' }}>{pet.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Medical History Section */}
        <div style={{ padding: '0 16px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#F7931E', margin: 0 }}>
              Medical History
            </h3>
            <button 
              onClick={() => setShowAddMedical(true)}
              className="action-button primary"
              style={{ 
                fontSize: '14px',
                padding: '6px 12px'
              }}
            >
              + Add New
            </button>
          </div>

          {medicalHistory.length === 0 ? (
            <div style={{ 
              backgroundColor: '#374151', 
              borderRadius: '12px', 
              padding: '20px',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
              <p style={{ color: '#FFFFFF', margin: 0, fontSize: '14px', fontWeight: '500' }}>No medical history recorded yet</p>
            </div>
          ) : (
            medicalHistory.map(record => (
              <div key={record.id} className="enhanced-card" style={{ marginBottom: '12px', backgroundColor: '#374151' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: '8px'
                }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#FFFFFF', margin: 0 }}>
                    {record.title}
                  </h4>
                  <span style={{ 
                    fontSize: '12px', 
                    color: '#FFFFFF',
                    backgroundColor: '#6B7280',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontWeight: '500'
                  }}>
                    {record.type}
                  </span>
                </div>
                <p style={{ fontSize: '14px', color: '#FFFFFF', margin: '4px 0', fontWeight: '500', opacity: '0.9' }}>
                  Dr. {record.doctor} • {new Date(record.date).toLocaleDateString()}
                </p>
                <p style={{ fontSize: '14px', color: '#FFFFFF', margin: '8px 0 0 0', lineHeight: '1.5' }}>
                  {record.description}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Documents Section */}
        <div style={{ padding: '0 16px', marginTop: '24px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#F7931E', marginBottom: '16px' }}>
            Documents
          </h3>

          {documents.length === 0 ? (
            <div style={{ 
              backgroundColor: '#374151', 
              borderRadius: '12px', 
              padding: '20px',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📄</div>
              <p style={{ color: '#FFFFFF', margin: 0, fontSize: '14px', fontWeight: '500' }}>No documents uploaded yet</p>
            </div>
          ) : (
            documents.map(doc => (
              <div key={doc.id} className="enhanced-card" style={{ 
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: '#374151'
              }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '8px', 
                  backgroundColor: '#F7931E',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '18px'
                }}>
                  📄
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#FFFFFF', margin: 0 }}>
                    {doc.fileName}
                  </h4>
                  <p style={{ fontSize: '12px', color: '#FFFFFF', margin: '4px 0 0 0', fontWeight: '500', opacity: '0.9' }}>
                    Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => window.open(doc.fileUrl, '_blank')}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#F7931E',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ⬇️
                </button>
              </div>
            ))
          )}
        </div>

        {/* Upload New Document Section */}
        <div style={{ padding: '0 16px', marginTop: '24px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#F7931E', marginBottom: '16px' }}>
            Upload New Document
          </h3>
          
          <div 
            onClick={() => !uploading && document.getElementById('file-upload').click()}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            style={{ 
              backgroundColor: dragActive ? '#4B5563' : '#374151', 
              borderRadius: '12px', 
              padding: '40px 20px',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: `2px dashed ${dragActive ? '#F7931E' : '#F7931E'}`,
              cursor: uploading ? 'not-allowed' : 'pointer',
              opacity: uploading ? 0.6 : 1,
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{ fontSize: '48px', color: '#F7931E', marginBottom: '16px' }}>
              ☁️
            </div>
            <p style={{ fontSize: '16px', color: '#FFFFFF', margin: '0 0 8px 0', fontWeight: '500' }}>
              Drag & drop files or <span style={{ color: '#F7931E', fontWeight: 'bold' }}>Browse</span>
            </p>
            <p style={{ fontSize: '12px', color: '#FFFFFF', margin: 0, fontWeight: '500', opacity: '0.9' }}>
              Supported formats: PDF, JPG, PNG
            </p>
            <input
              id="file-upload"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              disabled={uploading}
            />
          </div>
          
          {uploading && (
            <div style={{ 
              textAlign: 'center', 
              marginTop: '16px',
              padding: '16px',
              backgroundColor: '#374151',
              borderRadius: '12px'
            }}>
              <div style={{ 
                display: 'inline-block',
                width: '20px',
                height: '20px',
                border: '3px solid #F7931E',
                borderTop: '3px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: '8px'
              }}></div>
              <p style={{ color: '#FFFFFF', margin: 0, fontSize: '14px', fontWeight: '500' }}>
                Uploading document...
              </p>
            </div>
          )}
        </div>

        {/* Add Medical Record Modal */}
        {showAddMedical && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '10px',
            overflowY: 'auto',
            boxSizing: 'border-box',
            borderRadius: '32px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddMedical(false);
              setMedicalForm({
                title: '',
                doctor: '',
                date: '',
                description: '',
                type: 'checkup'
              });
            }
          }}
          >
            <div style={{
              backgroundColor: '#374151',
              borderRadius: '12px',
              padding: '14px',
              width: '100%',
              maxWidth: '355px',
              maxHeight: 'calc(100% - 20px)',
              overflowY: 'auto',
              boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
              boxSizing: 'border-box',
              position: 'relative',
              WebkitOverflowScrolling: 'touch',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '10px',
                paddingBottom: '8px',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                flexShrink: 0
              }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#FFFFFF' }}>
                  Add Medical Record
                </h3>
                <button
                  onClick={() => {
                    setShowAddMedical(false);
                    setMedicalForm({
                      title: '',
                      doctor: '',
                      date: '',
                      description: '',
                      type: 'checkup'
                    });
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: '#FFFFFF',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleMedicalSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label className="form-label" style={{ color: '#FFFFFF', display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '13px' }}>Title</label>
                    <input
                      type="text"
                      className="form-input"
                      value={medicalForm.title}
                      onChange={(e) => setMedicalForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g. Annual Check-up"
                      required
                      style={{ 
                        width: '100%', 
                        padding: '8px 10px', 
                        borderRadius: '6px', 
                        border: '1px solid #6B7280',
                        backgroundColor: '#1F2937',
                        color: '#FFFFFF',
                        fontSize: '13px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label className="form-label" style={{ color: '#FFFFFF', display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '13px' }}>Doctor</label>
                    <input
                      type="text"
                      className="form-input"
                      value={medicalForm.doctor}
                      onChange={(e) => setMedicalForm(prev => ({ ...prev, doctor: e.target.value }))}
                      placeholder="e.g. Dr. Emily Carter"
                      required
                      style={{ 
                        width: '100%', 
                        padding: '8px 10px', 
                        borderRadius: '6px', 
                        border: '1px solid #6B7280',
                        backgroundColor: '#1F2937',
                        color: '#FFFFFF',
                        fontSize: '13px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label className="form-label" style={{ color: '#FFFFFF', display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '13px' }}>Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={medicalForm.date}
                      onChange={(e) => setMedicalForm(prev => ({ ...prev, date: e.target.value }))}
                      required
                      style={{ 
                        width: '100%', 
                        padding: '8px 10px', 
                        borderRadius: '6px', 
                        border: '1px solid #6B7280',
                        backgroundColor: '#1F2937',
                        color: '#FFFFFF',
                        fontSize: '13px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label className="form-label" style={{ color: '#FFFFFF', display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '13px' }}>Type</label>
                    <select
                      className="form-input"
                      value={medicalForm.type}
                      onChange={(e) => setMedicalForm(prev => ({ ...prev, type: e.target.value }))}
                      required
                      style={{ 
                        width: '100%', 
                        padding: '8px 10px', 
                        borderRadius: '6px', 
                        border: '1px solid #6B7280',
                        backgroundColor: '#1F2937',
                        color: '#FFFFFF',
                        fontSize: '13px',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="checkup">Check-up</option>
                      <option value="vaccination">Vaccination</option>
                      <option value="surgery">Surgery</option>
                      <option value="emergency">Emergency</option>
                      <option value="dental">Dental</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label className="form-label" style={{ color: '#FFFFFF', display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '13px' }}>Description</label>
                    <textarea
                      className="form-input"
                      value={medicalForm.description}
                      onChange={(e) => setMedicalForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe the visit, treatment, or findings..."
                      rows="3"
                      required
                      style={{ 
                        width: '100%', 
                        padding: '8px 10px', 
                        borderRadius: '6px', 
                        border: '1px solid #6B7280',
                        backgroundColor: '#1F2937',
                        color: '#FFFFFF',
                        fontSize: '13px',
                        resize: 'vertical',
                        fontFamily: 'inherit',
                        minHeight: '60px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => setShowAddMedical(false)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid #6B7280',
                      backgroundColor: '#6B7280',
                      color: '#FFFFFF',
                      cursor: 'pointer',
                      fontWeight: '500',
                      fontSize: '13px'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: '#F7931E',
                      color: '#FFFFFF',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '13px',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#E67E22'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#F7931E'}
                  >
                    Add Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
          </div>
          <BottomNavigation userType="owner" />
        </div>
      </div>
    </div>
  );
}
