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

  const user = auth?.currentUser || null;

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    loadPets();
  }, [navigate, user]);

  const loadPets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to fetch pets with proper error handling
      const petsSnap = await getDocs(collection(db, 'pets'));
      const userPets = petsSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(p => p.ownerID === user.uid);
      setPets(userPets);
    } catch (err) {
      console.warn('Could not fetch pets, using dummy data:', err.message);
      // Use dummy data as fallback
      setPets(getDummyPets());
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
    try {
      setError(null);
      
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadFile(imageFile, 'pet-images');
      }

      const petData = {
        ...formData,
        ownerID: user.uid,
        imageUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingPet) {
        await updateDoc(doc(db, 'pets', editingPet.id), {
          ...petData,
          updatedAt: new Date().toISOString()
        });
        setEditingPet(null);
      } else {
        await addDoc(collection(db, 'pets'), petData);
      }

      resetForm();
      await loadPets();
    } catch (err) {
      console.warn('Could not save pet:', err.message);
      // If permissions error, show user-friendly message
      if (err.message.includes('permission') || err.message.includes('insufficient')) {
        setError('Unable to save pet. Please check your connection and try again.');
      } else {
        setError(err.message || 'Failed to save pet');
      }
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
      await deleteDoc(doc(db, 'pets', petId));
      await loadPets();
    } catch (err) {
      console.warn('Could not delete pet:', err.message);
      // If permissions error, show user-friendly message
      if (err.message.includes('permission') || err.message.includes('insufficient')) {
        setError('Unable to delete pet. Please check your connection and try again.');
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


        {!showAddForm ? (
          <>
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
          </>
        ) : (
          <div style={{ padding: '16px' }}>
            <div className="form-container">
              <div className="form-header">
                <h2 className="form-title">
                  {editingPet ? 'Edit Pet' : 'Add New Pet'}
                </h2>
                <p className="form-subtitle">
                  {editingPet ? 'Update your pet\'s information' : 'Tell us about your furry friend'}
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Pet Photo</label>
                  <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <div 
                      style={{ 
                        width: '100px', 
                        height: '100px', 
                        borderRadius: '50%', 
                        backgroundColor: '#f0f0f0',
                        margin: '0 auto 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        border: '2px dashed #ccc'
                      }}
                    >
                      {imagePreview ? (
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span style={{ fontSize: '24px' }}>📷</span>
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
                      className="action-button"
                      style={{ cursor: 'pointer' }}
                    >
                      {imagePreview ? 'Change Photo' : 'Upload Photo'}
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Pet's Name</label>
                  <input
                    type="text"
                    name="name"
                    className="form-input"
                    placeholder="e.g. Buddy"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Breed</label>
                  <input
                    type="text"
                    name="breed"
                    className="form-input"
                    placeholder="e.g. Golden Retriever"
                    value={formData.breed}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input
                    type="text"
                    name="age"
                    className="form-input"
                    placeholder="e.g. 2 years"
                    value={formData.age}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Type of Pet</label>
                  <select
                    name="type"
                    className="form-input"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="Dog">Dog</option>
                    <option value="Cat">Cat</option>
                    <option value="Bird">Bird</option>
                    <option value="Fish">Fish</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select
                    name="gender"
                    className="form-input"
                    value={formData.gender}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Weight (optional)</label>
                  <input
                    type="text"
                    name="weight"
                    className="form-input"
                    placeholder="e.g. 25 lbs"
                    value={formData.weight}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Color (optional)</label>
                  <input
                    type="text"
                    name="color"
                    className="form-input"
                    placeholder="e.g. Golden"
                    value={formData.color}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Notes (optional)</label>
                  <textarea
                    name="notes"
                    className="form-input"
                    placeholder="Any additional notes about your pet..."
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows="3"
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button
                    type="button"
                    className="btn"
                    onClick={resetForm}
                    style={{ 
                      flex: 1, 
                      backgroundColor: '#f0f0f0', 
                      color: '#333',
                      border: '1px solid #ccc'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                  >
                    {editingPet ? 'Update Pet' : 'Save Pet'}
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