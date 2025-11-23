import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../../api/firebase';
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { logoutUser } from '../../api/authService';
import { uploadFile } from '../../api/storageService';
import { getDummyPets } from '../../api/dummyData';
import BottomNavigation from '../common/BottomNavigation';

export default function MyPets() {
  const navigate = useNavigate();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPet, setEditingPet] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    age: '',
    type: 'Dog',
    gender: 'Male',
    weight: '',
    color: '',
    notes: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  const user = auth?.currentUser || null;

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    loadPets();
  }, [navigate, user]);

  // Helper functions for localStorage
  const savePetsToLocalStorage = (petsToSave) => {
    try {
      const userId = user?.uid || 'default';
      localStorage.setItem(`pawsera_pets_${userId}`, JSON.stringify(petsToSave));
      console.log('✅ Pets saved to localStorage');
    } catch (err) {
      console.warn('Could not save pets to localStorage:', err);
    }
  };

  const loadPetsFromLocalStorage = () => {
    try {
      const userId = user?.uid || 'default';
      const saved = localStorage.getItem(`pawsera_pets_${userId}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (err) {
      console.warn('Could not load pets from localStorage:', err);
    }
    return [];
  };

  const loadPets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load from localStorage first
      const localPets = loadPetsFromLocalStorage();
      
      if (db) {
        // Try to fetch pets with proper error handling
        const petsSnap = await getDocs(collection(db, 'pets'));
        const userPets = petsSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(p => p.ownerID === user.uid);
        
        // Merge Firebase pets with localStorage pets
        const localPetsNotInFirebase = localPets.filter(localPet => 
          !userPets.some(fbPet => fbPet.id === localPet.id || 
            (fbPet.name === localPet.name && fbPet.breed === localPet.breed))
        );
        
        const allPets = [...userPets, ...localPetsNotInFirebase];
        setPets(allPets);
        savePetsToLocalStorage(allPets);
      } else {
        // No Firebase, use localStorage
        if (localPets.length > 0) {
          setPets(localPets);
        } else {
          // Fallback to dummy data
          setPets(getDummyPets());
        }
      }
    } catch (err) {
      console.warn('Could not fetch pets:', err.message);
      // Try localStorage as fallback
      const localPets = loadPetsFromLocalStorage();
      if (localPets.length > 0) {
        setPets(localPets);
      } else if (pets.length === 0) {
        setPets(getDummyPets());
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Form submitted!');
    console.log('Form data:', formData);
    
    // Validate required fields
    if (!formData.name || !formData.breed || !formData.age) {
      const missingFields = [];
      if (!formData.name) missingFields.push('Name');
      if (!formData.breed) missingFields.push('Breed');
      if (!formData.age) missingFields.push('Age');
      setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      console.log('Starting pet save process...');
      console.log('Form data:', formData);
      console.log('User:', user?.uid);
      console.log('DB available:', !!db);
      
      let imageUrl = null;
      
      // Try to upload image with timeout, but don't block pet save if it fails
      if (imageFile) {
        try {
          console.log('Attempting to upload pet image...');
          const uploadPromise = uploadFile(imageFile, 'pet-images');
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Image upload timeout')), 5000)
          );
          imageUrl = await Promise.race([uploadPromise, timeoutPromise]);
          console.log('✅ Image uploaded successfully:', imageUrl);
        } catch (uploadErr) {
          console.warn('⚠️ Image upload failed, saving pet without image:', uploadErr.message);
          // Create local URL as fallback
          imageUrl = imagePreview || null;
          // Don't throw error - allow pet to be saved without image
        }
      } else if (editingPet && editingPet.imageUrl) {
        // Keep existing image URL when editing
        imageUrl = editingPet.imageUrl;
      }

      const petData = {
        ...formData,
        ownerID: user?.uid || 'unknown',
        imageUrl: imageUrl || null,
        createdAt: editingPet ? editingPet.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('Pet data to save:', petData);

      let saveSuccess = false;
      let savedToFirebase = false;
      
      // Try to save to Firestore
      if (db) {
        if (editingPet) {
          try {
            console.log('Updating pet in Firestore...');
            await updateDoc(doc(db, 'pets', editingPet.id), {
              ...petData,
              updatedAt: new Date().toISOString()
            });
            console.log('✅ Pet updated in Firestore');
            saveSuccess = true;
            savedToFirebase = true;
            setSuccessMessage('Pet updated successfully!');
          } catch (firestoreErr) {
            console.warn('Firestore update failed:', firestoreErr.message);
            console.error('Full error:', firestoreErr);
            // Fallback: update local state
            const updatedPets = pets.map(p => 
              p.id === editingPet.id ? { ...p, ...petData } : p
            );
            setPets(updatedPets);
            saveSuccess = true;
            savedToFirebase = false;
            setSuccessMessage('Pet updated (saved locally)!');
          }
        } else {
          try {
            console.log('Adding pet to Firestore...');
            const docRef = await addDoc(collection(db, 'pets'), petData);
            console.log('✅ Pet added to Firestore with ID:', docRef.id);
            saveSuccess = true;
            savedToFirebase = true;
            setSuccessMessage('Pet added successfully!');
          } catch (firestoreErr) {
            console.warn('Firestore add failed:', firestoreErr.message);
            console.error('Full error:', firestoreErr);
            // Fallback: add to local state
            const newPet = {
              id: `local_${Date.now()}`,
              ...petData
            };
            const updatedPets = [...pets, newPet];
            setPets(updatedPets);
            savePetsToLocalStorage(updatedPets);
            console.log('✅ Pet added to local state. Total pets:', updatedPets.length);
            saveSuccess = true;
            savedToFirebase = false;
            setSuccessMessage('Pet added (saved locally)!');
          }
        }
      } else {
        // Firebase not available, save to local state only
        console.warn('Firebase not available, saving to local state');
        if (editingPet) {
          const updatedPets = pets.map(p => 
            p.id === editingPet.id ? { ...p, ...petData } : p
          );
          setPets(updatedPets);
          savePetsToLocalStorage(updatedPets);
          saveSuccess = true;
          savedToFirebase = false;
          setSuccessMessage('Pet updated (saved locally)!');
        } else {
          const newPet = {
            id: `local_${Date.now()}`,
            ...petData
          };
          const updatedPets = [...pets, newPet];
          setPets(updatedPets);
          savePetsToLocalStorage(updatedPets);
          console.log('✅ Pet added to local state (no Firebase). Total pets:', updatedPets.length);
          saveSuccess = true;
          savedToFirebase = false;
          setSuccessMessage('Pet added (saved locally)!');
        }
      }

      if (saveSuccess) {
        // Only reload if we successfully saved to Firebase
        // If saved locally, state is already updated, don't reload (it would overwrite local state)
        if (savedToFirebase) {
          // For Firebase saves, wait a moment for sync, then reload
          setTimeout(async () => {
            try {
              await loadPets();
            } catch (loadErr) {
              console.warn('Could not reload pets:', loadErr.message);
              // Keep the local state we just set
            }
          }, 500);
        } else {
          // Saved locally - state is already updated and saved to localStorage
          console.log('Pet saved locally, state already updated. Not reloading.');
        }
        
        // Wait a bit before closing modal to show success message
        setTimeout(() => {
          resetForm();
          // Clear success message after 3 seconds
          setTimeout(() => setSuccessMessage(null), 3000);
        }, 1000);
      }
      
    } catch (err) {
      console.error('Error saving pet:', err);
      setError(err.message || 'Failed to save pet. Please try again.');
      setSaving(false);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (pet) => {
    setEditingPet(pet);
    setFormData({
      name: pet.name || '',
      breed: pet.breed || '',
      age: pet.age || '',
      type: pet.type || 'Dog',
      gender: pet.gender || 'Male',
      weight: pet.weight || '',
      color: pet.color || '',
      notes: pet.notes || ''
    });
    setImagePreview(pet.imageUrl || null);
    setImageFile(null);
    setShowAddForm(true);
  };

  const handleDelete = async (petId) => {
    if (!window.confirm('Are you sure you want to delete this pet?')) return;
    
    try {
      if (db && !petId.startsWith('local_')) {
        await deleteDoc(doc(db, 'pets', petId));
      }
      // Remove from local state and localStorage
      const updatedPets = pets.filter(p => p.id !== petId);
      setPets(updatedPets);
      savePetsToLocalStorage(updatedPets);
      await loadPets();
    } catch (err) {
      console.warn('Could not delete pet:', err.message);
      // Remove from local state anyway
      const updatedPets = pets.filter(p => p.id !== petId);
      setPets(updatedPets);
      savePetsToLocalStorage(updatedPets);
      // If permissions error, show user-friendly message
      if (err.message.includes('permission') || err.message.includes('insufficient')) {
        setError('Unable to delete pet from server, but removed locally.');
      } else {
        setError(err.message || 'Failed to delete pet');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      breed: '',
      age: '',
      type: 'Dog',
      gender: 'Male',
      weight: '',
      color: '',
      notes: ''
    });
    setImageFile(null);
    setImagePreview(null);
    setShowAddForm(false);
    setEditingPet(null);
    setError(null);
    setSaving(false);
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
                <button className="back-button" onClick={() => navigate('/home')}>← Back</button>
                <h1 className="page-title">My Pets</h1>
                <button className="logout-button" onClick={handleLogout}>Logout</button>
              </div>
              <div style={{ padding: 20, textAlign: 'center' }}>
                <p>Loading pets...</p>
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
          <button className="back-button" onClick={() => navigate('/home')}>← Back</button>
          <h1 className="page-title">My Pets</h1>
          <button className="logout-button" onClick={handleLogout}>Logout</button>
        </div>


        {error && (
          <div style={{ 
            margin: '16px', 
            padding: '12px', 
            backgroundColor: '#FEE2E2', 
            border: '1px solid #FCA5A5', 
            borderRadius: '8px',
            color: '#991B1B',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {successMessage && (
          <div style={{ 
            margin: '16px', 
            padding: '12px', 
            backgroundColor: '#D1FAE5', 
            border: '1px solid #6EE7B7', 
            borderRadius: '8px',
            color: '#065F46',
            fontSize: '14px'
          }}>
            {successMessage}
          </div>
        )}

        <div className="pets-list">
          {pets.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🐾</div>
              <div className="empty-title">No pets yet</div>
              <p className="empty-description">Add your first pet to get started with personalized care.</p>
              <button 
                className="primary-button" 
                onClick={() => setShowAddForm(true)}
              >
                Add Your First Pet
              </button>
            </div>
          ) : (
            pets.map(pet => (
              <div key={pet.id} className="pet-card">
                <div className="pet-image">
                  <div className="pet-avatar">
                    {pet.imageUrl ? (
                      <img 
                        src={pet.imageUrl} 
                        alt={pet.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                      />
                    ) : (
                      <span style={{ fontSize: '24px' }}>🐾</span>
                    )}
                  </div>
                </div>
                <div className="pet-info">
                  <div className="pet-name">{pet.name}</div>
                  <p className="pet-details">{pet.breed} • {pet.age}</p>
                  <p className="pet-age">{pet.type} • {pet.gender}</p>
                </div>
                <div className="pet-actions">
                  <Link 
                    to={`/pet-records/${pet.id}`}
                    className="action-button primary"
                    style={{ textDecoration: 'none', textAlign: 'center' }}
                  >
                    Records
                  </Link>
                  <button 
                    className="action-button"
                    onClick={() => handleEdit(pet)}
                  >
                    Edit
                  </button>
                  <button 
                    className="action-button secondary"
                    onClick={() => handleDelete(pet.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {pets.length > 0 && (
          <div style={{ padding: '16px' }}>
            <button 
              className="primary-button" 
              onClick={() => setShowAddForm(true)}
              style={{ width: '100%' }}
            >
              + Add New Pet
            </button>
          </div>
        )}

        {/* Add/Edit Pet Modal */}
        {showAddForm && (
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
              resetForm();
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
                  {editingPet ? 'Edit Pet' : 'Add New Pet'}
                </h3>
                <button
                  onClick={resetForm}
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

              {error && (
                <div style={{ 
                  marginBottom: '12px', 
                  padding: '10px', 
                  backgroundColor: '#7F1D1D', 
                  border: '1px solid #991B1B', 
                  borderRadius: '6px',
                  color: '#FCA5A5',
                  fontSize: '12px',
                  flexShrink: 0
                }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
                  <div className="form-group" style={{ marginBottom: '12px', textAlign: 'center' }}>
                    <label className="form-label" style={{ color: '#FFFFFF', display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '13px' }}>Pet Photo</label>
                    <div 
                      style={{ 
                        width: '80px', 
                        height: '80px', 
                        borderRadius: '50%', 
                        backgroundColor: '#1F2937',
                        margin: '0 auto 8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        border: '2px dashed #6B7280'
                      }}
                    >
                      {imagePreview ? (
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span style={{ fontSize: '20px' }}>📷</span>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{ display: 'none' }}
                      id="image-upload"
                    />
                    <label 
                      htmlFor="image-upload" 
                      style={{
                        display: 'inline-block',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #6B7280',
                        backgroundColor: '#1F2937',
                        color: '#FFFFFF',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}
                    >
                      {imagePreview ? 'Change Photo' : 'Upload Photo'}
                    </label>
                  </div>

                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label className="form-label" style={{ color: '#FFFFFF', display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '13px' }}>Pet's Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. Buddy"
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
                    <label className="form-label" style={{ color: '#FFFFFF', display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '13px' }}>Breed</label>
                    <input
                      type="text"
                      name="breed"
                      value={formData.breed}
                      onChange={handleInputChange}
                      placeholder="e.g. Golden Retriever"
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
                    <label className="form-label" style={{ color: '#FFFFFF', display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '13px' }}>Age</label>
                    <input
                      type="text"
                      name="age"
                      value={formData.age}
                      onChange={handleInputChange}
                      placeholder="e.g. 2 years"
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
                    <label className="form-label" style={{ color: '#FFFFFF', display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '13px' }}>Type of Pet</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
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
                      <option value="Dog">Dog</option>
                      <option value="Cat">Cat</option>
                      <option value="Bird">Bird</option>
                      <option value="Fish">Fish</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label className="form-label" style={{ color: '#FFFFFF', display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '13px' }}>Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
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
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label className="form-label" style={{ color: '#FFFFFF', display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '13px' }}>Weight (optional)</label>
                    <input
                      type="text"
                      name="weight"
                      value={formData.weight}
                      onChange={handleInputChange}
                      placeholder="e.g. 25 lbs"
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
                    <label className="form-label" style={{ color: '#FFFFFF', display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '13px' }}>Color (optional)</label>
                    <input
                      type="text"
                      name="color"
                      value={formData.color}
                      onChange={handleInputChange}
                      placeholder="e.g. Golden"
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
                    <label className="form-label" style={{ color: '#FFFFFF', display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '13px' }}>Notes (optional)</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Any additional notes about your pet..."
                      rows="3"
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
                    onClick={resetForm}
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
                    disabled={saving}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: saving ? '#9CA3AF' : '#F7931E',
                      color: '#FFFFFF',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      fontWeight: '600',
                      fontSize: '13px',
                      transition: 'background 0.2s',
                      opacity: saving ? 0.7 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!saving) e.target.style.backgroundColor = '#E67E22';
                    }}
                    onMouseLeave={(e) => {
                      if (!saving) e.target.style.backgroundColor = '#F7931E';
                    }}
                  >
                    {saving ? 'Saving...' : (editingPet ? 'Update Pet' : 'Save Pet')}
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