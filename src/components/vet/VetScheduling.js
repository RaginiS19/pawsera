import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../api/firebase';
import { collection, doc, getDocs, getDoc, addDoc, updateDoc } from 'firebase/firestore';
import { logoutUser } from '../../api/authService';
import BottomNavigation from '../common/BottomNavigation';

export default function VetScheduling() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [pets, setPets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [newAppointment, setNewAppointment] = useState(null);
  const [formData, setFormData] = useState({
    petId: '',
    ownerId: '',
    date: '',
    time: '',
    purpose: '',
    notes: '',
    status: 'confirmed'
  });
  const [vetProfile, setVetProfile] = useState(null);

  const user = auth?.currentUser || null;

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
      
      const [userDoc, appointmentsSnap, petsSnap, usersSnap] = await Promise.all([
        getDoc(doc(db, 'users', user.uid)),
        getDocs(collection(db, 'appointments')),
        getDocs(collection(db, 'pets')),
        getDocs(collection(db, 'users'))
      ]);

      const vetData = userDoc.exists() ? userDoc.data() : {
        name: user.displayName || user.email?.split('@')[0] || 'Dr. Unknown'
      };

      // Get appointments for this vet
      const vetAppointments = appointmentsSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(a => a.vetName === vetData.name || a.vetId === user.uid)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      const allPets = petsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const allUsers = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      setVetProfile(vetData);
      setAppointments(vetAppointments);
      setPets(allPets);
      setUsers(allUsers);
    } catch (err) {
      setError(err.message || 'Failed to load scheduling data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePetChange = (e) => {
    const petId = e.target.value;
    const selectedPet = pets.find(p => p.id === petId);
    setFormData(prev => ({
      ...prev,
      petId,
      ownerId: selectedPet ? selectedPet.ownerID : ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      
      const selectedPet = pets.find(p => p.id === formData.petId);
      const selectedOwner = users.find(u => u.id === formData.ownerId);
      
      if (!selectedPet || !selectedOwner) {
        setError('Please select a valid pet and owner');
        return;
      }

      const appointmentData = {
        ...formData,
        vetId: user.uid,
        vetName: vetProfile?.name || 'Dr. Unknown',
        petName: selectedPet.name,
        ownerName: selectedOwner.name || selectedOwner.email?.split('@')[0],
        ownerEmail: selectedOwner.email,
        createdAt: new Date().toISOString(),
        createdBy: user.uid
      };

      const docRef = await addDoc(collection(db, 'appointments'), appointmentData);
      setNewAppointment({ id: docRef.id, ...appointmentData });
      setShowNewForm(false);
      setShowConfirmation(true);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to schedule appointment');
    }
  };

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    try {
      setError(null);
      await updateDoc(doc(db, 'appointments', appointmentId), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
        updatedBy: user.uid
      });
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to update appointment status');
    }
  };

  const resetForm = () => {
    setFormData({
      petId: '',
      ownerId: '',
      date: '',
      time: '',
      purpose: '',
      notes: '',
      status: 'confirmed'
    });
    setShowNewForm(false);
    setShowConfirmation(false);
    setNewAppointment(null);
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
      case 'cancelled': return '#E53E3E';
      case 'completed': return '#4A5568';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed': return 'Confirmed';
      case 'pending': return 'Pending';
      case 'cancelled': return 'Cancelled';
      case 'completed': return 'Completed';
      default: return 'Unknown';
    }
  };

  const getPetName = (petId) => pets.find(p => p.id === petId)?.name || 'N/A';
  const getOwnerName = (ownerID) => users.find(u => u.id === ownerID)?.name || users.find(u => u.id === ownerID)?.email?.split('@')[0] || 'N/A';

  if (loading) {
    return (
      <div className="screen-container">
        <div className="mobile-phone-frame">
          <div className="mobile-screen">
            <div className="screen-content with-bottom-nav">
              <div className="page-header">
                <button className="back-button" onClick={() => navigate('/vet/dashboard')}>← Back</button>
                <h1 className="page-title">Vet Scheduling</h1>
                <button className="logout-button" onClick={handleLogout}>Logout</button>
              </div>
              <div style={{ padding: 20, textAlign: 'center' }}>
                <p>Loading appointments...</p>
              </div>
            </div>
            <BottomNavigation userType="vet" />
          </div>
        </div>
      </div>
    );
  }

  if (showConfirmation && newAppointment) {
    return (
      <div className="screen-container">
        <div className="mobile-phone-frame">
          <div className="mobile-screen">
            <div className="screen-content with-bottom-nav">
              <div className="page-header">
                <button className="back-button" onClick={resetForm}>← Back</button>
                <h1 className="page-title">Appointment Scheduled</h1>
                <button className="logout-button" onClick={handleLogout}>Logout</button>
              </div>
          
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ 
              fontSize: '64px', 
              marginBottom: '20px',
              color: '#38A169'
            }}>
              ✅
            </div>
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              color: '#1F2937', 
              marginBottom: '16px' 
            }}>
              Appointment Scheduled Successfully!
            </h2>
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '12px', 
              padding: '20px',
              marginBottom: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              textAlign: 'left'
            }}>
              <p><strong>Pet:</strong> {newAppointment.petName}</p>
              <p><strong>Owner:</strong> {newAppointment.ownerName}</p>
              <p><strong>Date:</strong> {new Date(newAppointment.date).toLocaleDateString()}</p>
              <p><strong>Time:</strong> {newAppointment.time}</p>
              <p><strong>Purpose:</strong> {newAppointment.purpose}</p>
              <p><strong>Status:</strong> <span style={{ color: getStatusColor(newAppointment.status), fontWeight: 'bold' }}>{getStatusText(newAppointment.status)}</span></p>
            </div>
            <button
              onClick={resetForm}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#F7931E',
                color: 'white',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Schedule Another Appointment
            </button>
          </div>
            </div>
            <BottomNavigation userType="vet" />
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
          <button className="back-button" onClick={() => navigate('/vet/dashboard')}>← Back</button>
          <h1 className="page-title">Vet Scheduling</h1>
          <button className="logout-button" onClick={handleLogout}>Logout</button>
        </div>


        {!showNewForm ? (
          <>
            {/* Schedule New Appointment Button */}
            <div style={{ padding: '16px' }}>
              <button
                onClick={() => setShowNewForm(true)}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: '#F7931E',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <span>+</span>
                Schedule New Appointment
              </button>
            </div>

            {/* Appointments List */}
            <div className="appointments-list" style={{ padding: '0 16px' }}>
              {appointments.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📅</div>
                  <div className="empty-title">No appointments scheduled</div>
                  <p className="empty-description">Start by scheduling your first appointment.</p>
                </div>
              ) : (
                appointments.map(appointment => (
                  <div key={appointment.id} className="appointment-card" style={{ marginBottom: '12px' }}>
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
                          {appointment.petName} ({getOwnerName(appointment.ownerID)})
                        </div>
                        <p className="appointment-vet">{appointment.vetName}</p>
                        <p className="appointment-time">
                          {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                        </p>
                        <p className="appointment-purpose">{appointment.purpose}</p>
                        <div style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor: getStatusColor(appointment.status),
                          color: 'white'
                        }}>
                          {getStatusText(appointment.status)}
                        </div>
                      </div>
                    </div>
                    <div className="appointment-actions" style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                      {appointment.status === 'pending' && (
                        <>
                          <button
                            className="action-button"
                            onClick={() => handleStatusUpdate(appointment.id, 'confirmed')}
                            style={{ flex: 1, backgroundColor: '#38A169', color: 'white' }}
                          >
                            ✓ Confirm
                          </button>
                          <button
                            className="action-button secondary"
                            onClick={() => handleStatusUpdate(appointment.id, 'cancelled')}
                            style={{ flex: 1, backgroundColor: '#E53E3E', color: 'white' }}
                          >
                            ✗ Cancel
                          </button>
                        </>
                      )}
                      {appointment.status === 'confirmed' && (
                        <button
                          className="action-button"
                          onClick={() => handleStatusUpdate(appointment.id, 'completed')}
                          style={{ flex: 1, backgroundColor: '#4A5568', color: 'white' }}
                        >
                          ✓ Complete
                        </button>
                      )}
                      {appointment.status === 'completed' && (
                        <div style={{ flex: 1, textAlign: 'center', color: '#4A5568', fontSize: '14px', fontWeight: '500' }}>
                          Appointment Completed
                        </div>
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
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                  Schedule New Appointment
                </h3>
                <button
                  onClick={() => setShowNewForm(false)}
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

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Select Pet</label>
                  <select
                    className="form-input"
                    name="petId"
                    value={formData.petId}
                    onChange={handlePetChange}
                    required
                  >
                    <option value="">Choose a pet...</option>
                    {pets.map(pet => (
                      <option key={pet.id} value={pet.id}>
                        {pet.name} ({pet.breed}) - {users.find(u => u.id === pet.ownerID)?.name || 'Unknown Owner'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-input"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Time</label>
                  <select
                    className="form-input"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select time...</option>
                    <option value="09:00">9:00 AM</option>
                    <option value="09:30">9:30 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="10:30">10:30 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="11:30">11:30 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="12:30">12:30 PM</option>
                    <option value="13:00">1:00 PM</option>
                    <option value="13:30">1:30 PM</option>
                    <option value="14:00">2:00 PM</option>
                    <option value="14:30">2:30 PM</option>
                    <option value="15:00">3:00 PM</option>
                    <option value="15:30">3:30 PM</option>
                    <option value="16:00">4:00 PM</option>
                    <option value="16:30">4:30 PM</option>
                    <option value="17:00">5:00 PM</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Purpose</label>
                  <select
                    className="form-input"
                    name="purpose"
                    value={formData.purpose}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select purpose...</option>
                    <option value="Checkup">Checkup</option>
                    <option value="Vaccination">Vaccination</option>
                    <option value="Surgery">Surgery</option>
                    <option value="Dental">Dental Care</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Grooming">Grooming</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-input"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="confirmed">Confirmed</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Notes (Optional)</label>
                  <textarea
                    className="form-input"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Add any additional notes..."
                    rows="3"
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button
                    type="button"
                    onClick={() => setShowNewForm(false)}
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
                    Schedule Appointment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

          </div>
          <BottomNavigation userType="vet" />
        </div>
      </div>
    </div>
  );
}
