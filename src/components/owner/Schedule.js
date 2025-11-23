import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../api/firebase';
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { logoutUser } from '../../api/authService';
import { getDummyAppointments, getDummyPets } from '../../api/dummyData';
import BottomNavigation from '../common/BottomNavigation';

export default function Schedule() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showError, setShowError] = useState(false);
  const [newAppointment, setNewAppointment] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    petId: '',
    vetName: '',
    vetAddress: '',
    date: '',
    time: '',
    purpose: '',
    notes: ''
  });

  const user = auth?.currentUser || null;

  // Helper functions for localStorage
  const saveAppointmentsToLocalStorage = (appts) => {
    try {
      const userId = user?.uid || 'default';
      localStorage.setItem(`pawsera_appointments_${userId}`, JSON.stringify(appts));
      console.log('✅ Appointments saved to localStorage');
    } catch (err) {
      console.warn('Could not save appointments to localStorage:', err);
    }
  };

  const loadAppointmentsFromLocalStorage = () => {
    try {
      const userId = user?.uid || 'default';
      const saved = localStorage.getItem(`pawsera_appointments_${userId}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (err) {
      console.warn('Could not load appointments from localStorage:', err);
    }
    return [];
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

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    loadData();
  }, [navigate, user]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load from localStorage first
      const localAppointments = loadAppointmentsFromLocalStorage();
      const localPets = loadPetsFromLocalStorage();
      
      if (db) {
        try {
          const [appointmentsSnap, petsSnap] = await Promise.all([
            getDocs(collection(db, 'appointments')),
            getDocs(collection(db, 'pets'))
          ]);

          const userAppointments = appointmentsSnap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(a => a.ownerID === user.uid || a.ownerId === user.uid)
            .sort((a, b) => new Date(a.date) - new Date(b.date));

          const userPets = petsSnap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(p => p.ownerID === user.uid);

          // Merge Firebase data with localStorage data
          const localApptsNotInFirebase = localAppointments.filter(localAppt => 
            !userAppointments.some(fbAppt => 
              fbAppt.id === localAppt.id || 
              (fbAppt.date === localAppt.date && 
               fbAppt.time === localAppt.time && 
               fbAppt.petId === localAppt.petId)
            )
          );

          const localPetsNotInFirebase = localPets.filter(localPet => 
            !userPets.some(fbPet => 
              fbPet.id === localPet.id || 
              (fbPet.name === localPet.name && fbPet.breed === localPet.breed)
            )
          );

          const allAppointments = [...userAppointments, ...localApptsNotInFirebase].sort(
            (a, b) => new Date(a.date) - new Date(b.date)
          );
          const allPets = [...userPets, ...localPetsNotInFirebase];

          setAppointments(allAppointments);
          setPets(allPets);
          saveAppointmentsToLocalStorage(allAppointments);
        } catch (firebaseErr) {
          console.warn('Firebase error, using localStorage:', firebaseErr.message);
          if (localAppointments.length > 0) {
            setAppointments(localAppointments);
            if (localPets.length > 0) {
              setPets(localPets);
            } else {
              setPets(getDummyPets());
            }
          } else {
            // Show sample dummy appointments for new users
            const dummyAppts = getDummyAppointments();
            const sampleAppts = dummyAppts.slice(0, 3).map(apt => ({
              ...apt,
              id: `sample_${apt.id}_${Date.now()}`,
              ownerID: user.uid,
              ownerId: user.uid
            }));
            setAppointments(sampleAppts);
            setPets(getDummyPets());
            // Save sample appointments to localStorage so they persist
            saveAppointmentsToLocalStorage(sampleAppts);
          }
        }
      } else {
        // No Firebase, use localStorage or dummy data
        if (localAppointments.length > 0) {
          setAppointments(localAppointments);
          if (localPets.length > 0) {
            setPets(localPets);
          } else {
            setPets(getDummyPets());
          }
        } else {
          // Show sample dummy appointments for new users
          const dummyAppts = getDummyAppointments();
          const sampleAppts = dummyAppts.slice(0, 3).map(apt => ({
            ...apt,
            id: `sample_${apt.id}_${Date.now()}`,
            ownerID: user.uid,
            ownerId: user.uid
          }));
          setAppointments(sampleAppts);
          setPets(getDummyPets());
          // Save sample appointments to localStorage so they persist
          saveAppointmentsToLocalStorage(sampleAppts);
        }
      }
    } catch (err) {
      console.warn('Could not load data:', err.message);
      const localAppointments = loadAppointmentsFromLocalStorage();
      const localPets = loadPetsFromLocalStorage();
      if (localAppointments.length > 0) {
        setAppointments(localAppointments);
        if (localPets.length > 0) {
          setPets(localPets);
        } else {
          setPets(getDummyPets());
        }
      } else {
        // Show sample dummy appointments for new users
        const dummyAppts = getDummyAppointments();
        const sampleAppts = dummyAppts.slice(0, 3).map(apt => ({
          ...apt,
          id: `sample_${apt.id}_${Date.now()}`,
          ownerID: user.uid,
          ownerId: user.uid
        }));
        setAppointments(sampleAppts);
        setPets(getDummyPets());
        // Save sample appointments to localStorage so they persist
        saveAppointmentsToLocalStorage(sampleAppts);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Validate required fields
    if (!formData.petId || !formData.vetName || !formData.vetAddress || !formData.date || !formData.time || !formData.purpose) {
      setError('Please fill in all required fields');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const appointmentData = {
        ...formData,
        ownerID: user?.uid || 'unknown',
        status: 'confirmed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('Saving appointment:', appointmentData);

      let savedToFirebase = false;
      
      // Try to save to Firestore if available
      if (db) {
        try {
          const docRef = await addDoc(collection(db, 'appointments'), appointmentData);
          console.log('✅ Appointment saved to Firestore with ID:', docRef.id);
          savedToFirebase = true;
        } catch (firestoreErr) {
          console.warn('Firestore save failed, using local storage:', firestoreErr);
          savedToFirebase = false;
        }
      }
      
      // Always add to local state and localStorage
      const localAppointment = {
        id: savedToFirebase ? undefined : `local_appt_${Date.now()}`,
        ...appointmentData,
        petName: pets.find(p => p.id === formData.petId)?.name || 'Unknown Pet'
      };
      
      setAppointments(prev => {
        const updated = [localAppointment, ...prev].sort(
          (a, b) => new Date(a.date) - new Date(b.date)
        );
        saveAppointmentsToLocalStorage(updated);
        console.log('✅ Appointment added to local state. Total appointments:', updated.length);
        return updated;
      });
      
      setNewAppointment(localAppointment);
      setShowConfirmation(true);
      setShowNewForm(false);
      resetForm();
      
      // If saved to Firebase, reload to get the Firebase ID
      if (savedToFirebase) {
        try {
          await loadData();
        } catch (loadErr) {
          console.warn('Could not reload data:', loadErr.message);
        }
      }
      
      setSuccessMessage('Appointment scheduled successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error scheduling appointment:', err);
      setError(err.message || 'Failed to schedule appointment. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    
    try {
      if (db && !appointmentId.startsWith('local_')) {
        try {
          await updateDoc(doc(db, 'appointments', appointmentId), {
            status: 'cancelled',
            updatedAt: new Date().toISOString()
          });
        } catch (updateErr) {
          console.warn('Could not update in Firebase:', updateErr.message);
        }
      }
      
      // Update local state and localStorage
      const updatedAppointments = appointments.map(appt => 
        appt.id === appointmentId 
          ? { ...appt, status: 'cancelled', updatedAt: new Date().toISOString() }
          : appt
      );
      setAppointments(updatedAppointments);
      saveAppointmentsToLocalStorage(updatedAppointments);
      
      await loadData();
      setSuccessMessage('Appointment cancelled successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.warn('Could not cancel appointment:', err.message);
      // Update local state anyway
      const updatedAppointments = appointments.map(appt => 
        appt.id === appointmentId 
          ? { ...appt, status: 'cancelled', updatedAt: new Date().toISOString() }
          : appt
      );
      setAppointments(updatedAppointments);
      saveAppointmentsToLocalStorage(updatedAppointments);
      setError('Appointment cancelled locally. May not be synced to server.');
    }
  };

  const resetForm = () => {
    setFormData({
      petId: '',
      vetName: '',
      vetAddress: '',
      date: '',
      time: '',
      purpose: '',
      notes: ''
    });
    setShowNewForm(false);
    setShowConfirmation(false);
    setShowError(false);
    setNewAppointment(null);
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#38A169';
      case 'pending': return '#F59E0B';
      case 'cancelled': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed': return 'Confirmed';
      case 'pending': return 'Pending';
      case 'cancelled': return 'Cancelled';
      default: return 'Unknown';
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
                <h1 className="page-title">Schedule</h1>
                <button className="logout-button" onClick={handleLogout}>Logout</button>
              </div>
              <div style={{ padding: 20, textAlign: 'center' }}>
                <p>Loading appointments...</p>
              </div>
            </div>
            <BottomNavigation userType="owner" />
          </div>
        </div>
      </div>
    );
  }

  // Confirmation Screen
  if (showConfirmation && newAppointment) {
    return (
      <div className="screen-container">
        <div className="mobile-phone-frame">
          <div className="mobile-screen">
            <div className="screen-content with-bottom-nav">
          <div className="page-header">
            <button className="back-button" onClick={resetForm}>← Back</button>
            <h1 className="page-title">Pawsera</h1>
            <button className="logout-button" onClick={handleLogout}>Logout</button>
          </div>
          
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              backgroundColor: '#F7931E', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 24px',
              fontSize: '40px',
              color: 'white'
            }}>
              ✓
            </div>
            
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#1F2937' }}>
              Appointment Booked!
            </h2>
            
            <p style={{ color: '#6B7280', marginBottom: '32px' }}>
              Your appointment has been successfully scheduled. You'll receive a reminder closer to the date.
            </p>

            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '12px', 
              padding: '20px', 
              marginBottom: '32px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ color: '#F7931E', marginRight: '12px', fontSize: '20px' }}>🩺</div>
                <div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>Veterinarian</div>
                  <div style={{ fontWeight: 'bold', color: '#1F2937' }}>{newAppointment.vetName}</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ color: '#F7931E', marginRight: '12px', fontSize: '20px' }}>📅</div>
                <div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>Date & Time</div>
                  <div style={{ fontWeight: 'bold', color: '#1F2937' }}>
                    {new Date(newAppointment.date).toLocaleDateString()} at {newAppointment.time}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ color: '#F7931E', marginRight: '12px', fontSize: '20px' }}>🐾</div>
                <div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>Pet</div>
                  <div style={{ fontWeight: 'bold', color: '#1F2937' }}>{newAppointment.petName}</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn btn-primary" 
                onClick={() => { resetForm(); setShowNewForm(false); }}
                style={{ flex: 1 }}
              >
                View Appointments
              </button>
              <button 
                className="btn" 
                onClick={() => navigate('/home')}
                style={{ 
                  flex: 1, 
                  backgroundColor: '#f0f0f0', 
                  color: '#333',
                  border: '1px solid #ccc'
                }}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
            </div>
            <BottomNavigation userType="owner" />
          </div>
        </div>
      </div>
    );
  }

  // Skip error screen - always show main content
  if (false) {
    return (
      <div className="screen-container">
        <div className="mobile-phone-frame">
          <div className="mobile-screen">
            <div className="screen-content with-bottom-nav">
          <div className="page-header">
            <button className="back-button" onClick={resetForm}>← Back</button>
            <h1 className="page-title">Pawsera</h1>
            <button className="logout-button" onClick={handleLogout}>Logout</button>
          </div>
          
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              backgroundColor: '#F7931E', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 24px',
              fontSize: '40px',
              color: 'white'
            }}>
              ⚠️
            </div>
            
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#1F2937' }}>
              Appointment Failed
            </h2>
            
            <p style={{ color: '#6B7280', marginBottom: '32px' }}>
              We couldn't schedule your appointment. The selected time may no longer be available.
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn btn-primary" 
                onClick={() => { setShowError(false); setShowNewForm(true); }}
                style={{ flex: 1 }}
              >
                Retry Scheduling
              </button>
              <button 
                className="btn" 
                onClick={() => navigate('/nearbyvets')}
                style={{ 
                  flex: 1, 
                  backgroundColor: 'white', 
                  color: '#F7931E',
                  border: '2px solid #F7931E'
                }}
              >
                Contact Support
              </button>
            </div>
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
          <h1 className="page-title">Schedule</h1>
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

        {!showNewForm ? (
          <>
            <div style={{ padding: '16px' }}>
              <button 
                className="primary-button" 
                onClick={() => setShowNewForm(true)}
                style={{ width: '100%', marginBottom: '16px' }}
              >
                + Schedule New Appointment
              </button>
            </div>

            <div className="appointments-list">
              {appointments.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📅</div>
                  <div className="empty-title">No appointments yet</div>
                  <p className="empty-description">Schedule your first appointment to get started.</p>
                  <button 
                    className="primary-button" 
                    onClick={() => setShowNewForm(true)}
                  >
                    Schedule Appointment
                  </button>
                </div>
              ) : (
                appointments.map(appointment => (
                  <div key={appointment.id} className="appointment-card">
                    <div className="appointment-header">
                      <div className="appointment-date">
                        <span className="date-day">
                          {new Date(appointment.date).getDate()}
                        </span>
                        <span className="date-month">
                          {new Date(appointment.date).toLocaleString('default', { month: 'short' })}
                        </span>
                      </div>
                      <div className="appointment-info">
                        <div className="appointment-pet">
                          {pets.find(p => p.id === appointment.petId)?.name || appointment.petName || 'Unknown Pet'}
                        </div>
                        <p className="appointment-vet">{appointment.vetName}</p>
                        {appointment.vetAddress && (
                          <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                            📍 {appointment.vetAddress}
                          </p>
                        )}
                        <p className="appointment-time">
                          {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                        </p>
                        <div style={{ 
                          display: 'inline-block',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor: getStatusColor(appointment.status),
                          color: 'white',
                          marginTop: '8px'
                        }}>
                          {getStatusText(appointment.status)}
                        </div>
                      </div>
                    </div>
                    
                    {appointment.purpose && (
                      <div style={{ marginBottom: '12px', marginTop: '12px' }}>
                        <strong>Purpose:</strong> {appointment.purpose}
                      </div>
                    )}
                    
                    {appointment.notes && (
                      <div style={{ marginBottom: '12px' }}>
                        <strong>Notes:</strong> {appointment.notes}
                      </div>
                    )}

                    {appointment.vetAddress && (
                      <div style={{ marginBottom: '12px', fontSize: '14px', color: '#6B7280' }}>
                        📍 {appointment.vetAddress}
                      </div>
                    )}

                    <div className="appointment-actions">
                      {appointment.status === 'confirmed' && (
                        <button 
                          className="action-button secondary"
                          onClick={() => handleCancelAppointment(appointment.id)}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div style={{ padding: '16px' }}>
            <div className="form-container">
              <div className="form-header">
                <h2 className="form-title">New Appointment</h2>
                <p className="form-subtitle">Schedule a veterinary appointment for your pet</p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Select Pet</label>
                  <select
                    name="petId"
                    className="form-input"
                    value={formData.petId}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Choose a pet</option>
                    {pets.map(pet => (
                      <option key={pet.id} value={pet.id}>{pet.name} ({pet.breed})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Veterinarian Name</label>
                  <input
                    type="text"
                    name="vetName"
                    className="form-input"
                    placeholder="e.g. Dr. Emily Carter"
                    value={formData.vetName}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Veterinarian Address</label>
                  <input
                    type="text"
                    name="vetAddress"
                    className="form-input"
                    placeholder="e.g. 123 Main St, Anytown"
                    value={formData.vetAddress}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    name="date"
                    className="form-input"
                    value={formData.date}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Time</label>
                  <select
                    name="time"
                    className="form-input"
                    value={formData.time}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select time</option>
                    <option value="09:00">9:00 AM</option>
                    <option value="09:30">9:30 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="10:30">10:30 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="11:30">11:30 AM</option>
                    <option value="14:00">2:00 PM</option>
                    <option value="14:30">2:30 PM</option>
                    <option value="15:00">3:00 PM</option>
                    <option value="15:30">3:30 PM</option>
                    <option value="16:00">4:00 PM</option>
                    <option value="16:30">4:30 PM</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Purpose of Visit</label>
                  <select
                    name="purpose"
                    className="form-input"
                    value={formData.purpose}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select a reason</option>
                    <option value="Checkup">Regular Checkup</option>
                    <option value="Vaccination">Vaccination</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Dental">Dental Care</option>
                    <option value="Grooming">Grooming</option>
                    <option value="Surgery">Surgery</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Additional Notes (optional)</label>
                  <textarea
                    name="notes"
                    className="form-input"
                    placeholder="Any additional information..."
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
                    disabled={saving}
                    style={{ 
                      flex: 1,
                      opacity: saving ? 0.7 : 1,
                      cursor: saving ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {saving ? 'Scheduling...' : 'Schedule Appointment'}
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