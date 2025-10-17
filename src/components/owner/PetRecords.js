import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { auth, db } from '../../api/firebase';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc } from 'firebase/firestore';
import { logoutUser } from '../../api/authService';
import { uploadFile } from '../../api/storageService';

export default function PetRecords() {
  const navigate = useNavigate();
  const { petId } = useParams();
  const [pet, setPet] = useState(null);
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddMedical, setShowAddMedical] = useState(false);
  const [showUploadDoc, setShowUploadDoc] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [medicalForm, setMedicalForm] = useState({
    title: '',
    doctor: '',
    date: '',
    description: '',
    type: 'checkup'
  });

  const user = auth?.currentUser || null;

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
      
      const [petDoc, medicalSnap, docsSnap] = await Promise.all([
        getDoc(doc(db, 'pets', petId)),
        getDocs(collection(db, 'medical_history')),
        getDocs(collection(db, 'documents'))
      ]);

      if (petDoc.exists()) {
        setPet({ id: petDoc.id, ...petDoc.data() });
      }

      const petMedicalHistory = medicalSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(m => m.petId === petId)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      const petDocuments = docsSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(d => d.petId === petId)
        .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

      setMedicalHistory(petMedicalHistory);
      setDocuments(petDocuments);
    } catch (err) {
      setError(err.message || 'Failed to load pet records');
    } finally {
      setLoading(false);
    }
  };

  const handleMedicalSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      await addDoc(collection(db, 'medical_history'), {
        ...medicalForm,
        petId,
        ownerID: user.uid,
        createdAt: new Date().toISOString()
      });
      setShowAddMedical(false);
      setMedicalForm({
        title: '',
        doctor: '',
        date: '',
        description: '',
        type: 'checkup'
      });
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to add medical record');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      setError(null);
      
      const fileUrl = await uploadFile(file, 'pet-documents');
      
      await addDoc(collection(db, 'documents'), {
        petId,
        ownerID: user.uid,
        fileName: file.name,
        fileUrl,
        fileSize: file.size,
        fileType: file.type,
        uploadedAt: new Date().toISOString()
      });
      
      setShowUploadDoc(false);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to upload document');
    } finally {
      setUploading(false);
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
        <div className="screen-content">
          <div className="page-header">
            <button className="back-button" onClick={() => navigate('/mypets')}>← Back</button>
            <h1 className="page-title">Pet Records</h1>
            <button className="logout-button" onClick={handleLogout}>Logout</button>
          </div>
          <div style={{ padding: 20 }}>
            <p>Loading pet records...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="screen-container">
        <div className="screen-content">
          <div className="page-header">
            <button className="back-button" onClick={() => navigate('/mypets')}>← Back</button>
            <h1 className="page-title">Pet Records</h1>
            <button className="logout-button" onClick={handleLogout}>Logout</button>
          </div>
          <div style={{ padding: 20 }}>
            <p>Pet not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-container">
      <div className="screen-content">
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
              <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
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
              style={{ 
                color: '#F7931E', 
                background: 'none', 
                border: 'none', 
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              + Add New
            </button>
          </div>

          {medicalHistory.length === 0 ? (
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '12px', 
              padding: '20px',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <p style={{ color: '#6B7280', margin: 0 }}>No medical history recorded yet</p>
            </div>
          ) : (
            medicalHistory.map(record => (
              <div key={record.id} style={{ 
                backgroundColor: 'white', 
                borderRadius: '12px', 
                padding: '16px',
                marginBottom: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: '8px'
                }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1F2937', margin: 0 }}>
                    {record.title}
                  </h4>
                  <span style={{ 
                    fontSize: '12px', 
                    color: '#6B7280',
                    backgroundColor: '#f0f0f0',
                    padding: '4px 8px',
                    borderRadius: '4px'
                  }}>
                    {record.type}
                  </span>
                </div>
                <p style={{ fontSize: '14px', color: '#6B7280', margin: '4px 0' }}>
                  Dr. {record.doctor} • {new Date(record.date).toLocaleDateString()}
                </p>
                <p style={{ fontSize: '14px', color: '#1F2937', margin: 0 }}>
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
              backgroundColor: 'white', 
              borderRadius: '12px', 
              padding: '20px',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <p style={{ color: '#6B7280', margin: 0 }}>No documents uploaded yet</p>
            </div>
          ) : (
            documents.map(doc => (
              <div key={doc.id} style={{ 
                backgroundColor: 'white', 
                borderRadius: '12px', 
                padding: '16px',
                marginBottom: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
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
                  <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1F2937', margin: 0 }}>
                    {doc.fileName}
                  </h4>
                  <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>
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
            onClick={() => document.getElementById('file-upload').click()}
            style={{ 
              backgroundColor: 'white', 
              borderRadius: '12px', 
              padding: '40px 20px',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '2px dashed #F7931E',
              cursor: 'pointer'
            }}
          >
            <div style={{ fontSize: '48px', color: '#F7931E', marginBottom: '16px' }}>
              ☁️
            </div>
            <p style={{ fontSize: '16px', color: '#1F2937', margin: '0 0 8px 0' }}>
              Drag & drop files or <span style={{ color: '#F7931E', fontWeight: 'bold' }}>Browse</span>
            </p>
            <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>
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
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <p style={{ color: '#F7931E' }}>Uploading document...</p>
            </div>
          )}
        </div>

        {/* Add Medical Record Modal */}
        {showAddMedical && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '400px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                  Add Medical Record
                </h3>
                <button
                  onClick={() => setShowAddMedical(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: '#666'
                  }}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleMedicalSubmit}>
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input
                    type="text"
                    className="form-input"
                    value={medicalForm.title}
                    onChange={(e) => setMedicalForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Annual Check-up"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Doctor</label>
                  <input
                    type="text"
                    className="form-input"
                    value={medicalForm.doctor}
                    onChange={(e) => setMedicalForm(prev => ({ ...prev, doctor: e.target.value }))}
                    placeholder="e.g. Dr. Emily Carter"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={medicalForm.date}
                    onChange={(e) => setMedicalForm(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select
                    className="form-input"
                    value={medicalForm.type}
                    onChange={(e) => setMedicalForm(prev => ({ ...prev, type: e.target.value }))}
                    required
                  >
                    <option value="checkup">Check-up</option>
                    <option value="vaccination">Vaccination</option>
                    <option value="surgery">Surgery</option>
                    <option value="emergency">Emergency</option>
                    <option value="dental">Dental</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-input"
                    value={medicalForm.description}
                    onChange={(e) => setMedicalForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the visit, treatment, or findings..."
                    rows="4"
                    style={{ resize: 'vertical' }}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddMedical(false)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #ccc',
                      backgroundColor: '#f0f0f0',
                      color: '#333',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#F7931E',
                      color: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    Add Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
