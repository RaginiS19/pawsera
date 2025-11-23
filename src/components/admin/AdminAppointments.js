import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../api/firebase';
import { collection, doc, getDocs, updateDoc, addDoc, query, orderBy } from 'firebase/firestore';
import { logoutUser } from '../../api/authService';
import { getDummyAppointments, getDummyUsers, getDummyPets } from '../../api/dummyData';
import BottomNavigation from '../common/BottomNavigation';

export default function AdminAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [users, setUsers] = useState([]);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showNewAppointmentForm, setShowNewAppointmentForm] = useState(false);
  const [formData, setFormData] = useState({
    petId: '',
    ownerId: '',
    vetId: '',
    date: '',
    time: '',
    purpose: '',
    notes: '',
    status: 'pending'
  });

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
      
      // Always use sample data for consistent experience across all admins
      const dummyAppointments = getDummyAppointments();
      const dummyUsers = getDummyUsers();
      const dummyPets = getDummyPets();
      
      // Enrich appointments with user and pet data
      const enrichedAppointments = dummyAppointments.map(appointment => {
        const owner = dummyUsers.find(u => u.id === appointment.ownerId || u.userID === appointment.ownerId);
        const pet = dummyPets.find(p => p.id === appointment.petId);
        const vet = dummyUsers.find(u => u.id === appointment.vetId && u.role === 'Vet');
        
        // Get clinic name
        const clinicName = appointment.clinic || vet?.clinic || vet?.clinicName || 'Unknown Clinic';
        
        // Create address from available data
        const vetAddress = vet?.clinicAddress || vet?.address || appointment.vetAddress || 
          (vet?.city ? `${clinicName}, ${vet.city}` : clinicName);
        
        return {
          ...appointment,
          ownerName: owner?.name || appointment.ownerName || 'Unknown Owner',
          ownerEmail: owner?.email || appointment.ownerEmail || 'Unknown Email',
          petName: pet?.name || appointment.petName || 'Unknown Pet',
          petBreed: pet?.breed || appointment.petBreed || 'Unknown Breed',
          vetName: vet?.name || appointment.vetName || 'Unknown Vet',
          vetAddress: vetAddress,
          clinic: clinicName
        };
      });

      // Sort by date (most recent first)
      enrichedAppointments.sort((a, b) => new Date(b.date) - new Date(a.date));

      console.log('Admin Appointments Data Loaded:', {
        appointmentsCount: enrichedAppointments.length,
        usersCount: dummyUsers.length,
        petsCount: dummyPets.length
      });

      setAppointments(enrichedAppointments);
      setUsers(dummyUsers);
      setPets(dummyPets);
    } catch (err) {
      console.error('Could not load admin appointments:', err);
      setError(err.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    try {
      setError(null);
      setSuccessMessage(null);
      
      // Update local state immediately
      setAppointments(prev => prev.map(apt => 
        apt.id === appointmentId 
          ? { ...apt, status: newStatus, updatedAt: new Date().toISOString() }
          : apt
      ));
      
      // Try to update in Firebase if available
      if (db) {
        try {
          await updateDoc(doc(db, 'appointments', appointmentId), {
            status: newStatus,
            updatedAt: new Date().toISOString(),
            updatedBy: user.uid
          });
        } catch (firebaseErr) {
          console.warn('Could not update in Firebase:', firebaseErr);
          // Continue with local update
        }
      }
      
      setSuccessMessage(`Appointment ${newStatus === 'confirmed' ? 'approved' : newStatus === 'cancelled' ? 'declined' : 'updated'} successfully!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error updating appointment status:', err);
      setError(err.message || 'Failed to update appointment status');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-fill owner when pet is selected
    if (name === 'petId' && value) {
      const selectedPet = pets.find(p => p.id === value);
      if (selectedPet && selectedPet.ownerID) {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          ownerId: selectedPet.ownerID
        }));
        return;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Validation
    if (!formData.petId || !formData.ownerId || !formData.vetId || !formData.date || !formData.time || !formData.purpose) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const selectedPet = pets.find(p => p.id === formData.petId);
      const selectedOwner = users.find(u => u.id === formData.ownerId);
      const selectedVet = users.find(u => u.id === formData.vetId);

      const newAppointment = {
        petId: formData.petId,
        petName: selectedPet?.name || 'Unknown Pet',
        ownerId: formData.ownerId,
        ownerID: formData.ownerId,
        ownerName: selectedOwner?.name || 'Unknown Owner',
        vetId: formData.vetId,
        vetID: formData.vetId,
        vetName: selectedVet?.name || 'Unknown Vet',
        clinic: selectedVet?.clinicName || 'Unknown Clinic',
        date: formData.date,
        time: formData.time,
        purpose: formData.purpose,
        notes: formData.notes || '',
        status: formData.status || 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Try to save to Firebase
      if (db) {
        try {
          await addDoc(collection(db, 'appointments'), newAppointment);
          console.log('✅ Appointment saved to Firebase');
        } catch (firebaseErr) {
          console.warn('Could not save to Firebase:', firebaseErr);
          // Continue with local state
        }
      }

      // Add to local state
      newAppointment.id = `new_apt_${Date.now()}`;
      setAppointments(prev => [newAppointment, ...prev]);
      
      // Reset form
      setFormData({
        petId: '',
        ownerId: '',
        vetId: '',
        date: '',
        time: '',
        purpose: '',
        notes: '',
        status: 'pending'
      });
      setShowNewAppointmentForm(false);
      
      setSuccessMessage('Appointment created successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error creating appointment:', err);
      setError(err.message || 'Failed to create appointment');
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

  const filteredAppointments = appointments.filter(appointment => {
    // If no search term, only filter by status
    if (!searchTerm || searchTerm.trim() === '') {
      const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
      return matchesStatus;
    }
    
    const searchLower = searchTerm.toLowerCase().trim();
    
    // Search across multiple fields
    const matchesSearch = 
      (appointment.ownerName && appointment.ownerName.toLowerCase().includes(searchLower)) ||
      (appointment.ownerEmail && appointment.ownerEmail.toLowerCase().includes(searchLower)) ||
      (appointment.petName && appointment.petName.toLowerCase().includes(searchLower)) ||
      (appointment.petBreed && appointment.petBreed.toLowerCase().includes(searchLower)) ||
      (appointment.vetName && appointment.vetName.toLowerCase().includes(searchLower)) ||
      (appointment.clinic && appointment.clinic.toLowerCase().includes(searchLower)) ||
      (appointment.purpose && appointment.purpose.toLowerCase().includes(searchLower)) ||
      (appointment.notes && appointment.notes.toLowerCase().includes(searchLower)) ||
      (appointment.time && appointment.time.toLowerCase().includes(searchLower)) ||
      (appointment.date && appointment.date.includes(searchLower)) ||
      (appointment.status && appointment.status.toLowerCase().includes(searchLower)) ||
      // Search formatted date
      (appointment.date && new Date(appointment.date).toLocaleDateString().toLowerCase().includes(searchLower));
    
    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'cancelled': return '#EF4444';
      case 'completed': return '#6B7280';
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

  if (loading) {
    return (
      <div className="screen-container">
        <div className="mobile-phone-frame">
          <div className="mobile-screen">
            <div className="screen-content with-bottom-nav">
              <div className="page-header">
                <button className="back-button" onClick={() => navigate('/admin/dashboard')}>← Back</button>
                <h1 className="page-title">Appointments</h1>
                <button className="logout-button" onClick={handleLogout}>Logout</button>
              </div>
              <div style={{ padding: 20, textAlign: 'center' }}>
                <p>Loading appointments...</p>
              </div>
            </div>
            <BottomNavigation userType="admin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-container">
      <div className="mobile-phone-frame">
        <div className="mobile-screen">
          <div className="screen-content with-bottom-nav" style={{
            WebkitOverflowScrolling: 'touch',
            paddingBottom: '100px'
          }}>
        <div className="page-header">
          <button className="back-button" onClick={() => navigate('/admin/dashboard')}>← Back</button>
          <h1 className="page-title">Appointments</h1>
          <button className="logout-button" onClick={handleLogout}>Logout</button>
        </div>

        {/* Error Message */}
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
            ⚠️ {error}
          </div>
        )}

        {/* Success Message */}
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
            ✅ {successMessage}
          </div>
        )}

        {/* Create New Appointment Button */}
        <div style={{ padding: '0 16px', marginBottom: '16px' }}>
          <button
            onClick={() => setShowNewAppointmentForm(!showNewAppointmentForm)}
            style={{
              width: '100%',
              padding: '14px 24px',
              backgroundColor: '#F7931E',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(247, 147, 30, 0.3)'
            }}
          >
            {showNewAppointmentForm ? '✕ Cancel' : '+ Create New Appointment'}
          </button>
        </div>

        {/* New Appointment Form */}
        {showNewAppointmentForm && (
          <div style={{
            margin: '0 16px 24px 16px',
            padding: '20px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #F3F4F6'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#1F2937' }}>
              Create New Appointment
            </h3>
            <form onSubmit={handleCreateAppointment}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  Pet *
                </label>
                <select
                  name="petId"
                  value={formData.petId}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="">Select a pet</option>
                  {pets.map(pet => (
                    <option key={pet.id} value={pet.id}>
                      {pet.name} ({pet.breed}) - Owner: {pet.ownerName || 'Unknown'}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  Owner *
                </label>
                <select
                  name="ownerId"
                  value={formData.ownerId}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="">Select an owner</option>
                  {users.filter(u => u.role === 'PetOwner' || u.role === 'Pet Owner').map(owner => (
                    <option key={owner.id} value={owner.id}>
                      {owner.name} ({owner.email})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  Veterinarian *
                </label>
                <select
                  name="vetId"
                  value={formData.vetId}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="">Select a veterinarian</option>
                  {users.filter(u => u.role === 'Vet' && u.status === 'approved').map(vet => (
                    <option key={vet.id} value={vet.id}>
                      {vet.name} {vet.clinicName ? `(${vet.clinicName})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  Date *
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  Time *
                </label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  Purpose *
                </label>
                <input
                  type="text"
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleInputChange}
                  placeholder="e.g., Annual Checkup, Vaccination"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Additional notes (optional)"
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  backgroundColor: '#F7931E',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(247, 147, 30, 0.3)'
                }}
              >
                Create Appointment
              </button>
            </form>
          </div>
        )}


        {/* Search and Filter Section */}
        <div style={{ padding: '16px' }}>
          <div className="search-section">
            <div className="search-container" style={{ position: 'relative' }}>
              <div className="search-icon">🔎</div>
              <input
                className="search-input"
                placeholder="Search appointments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingRight: searchTerm ? '40px' : '12px' }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    fontSize: '18px',
                    color: '#6B7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            marginTop: '12px',
            overflowX: 'auto',
            paddingBottom: '4px'
          }}>
            {['all', 'pending', 'confirmed', 'cancelled', 'completed'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  backgroundColor: statusFilter === status ? '#F7931E' : '#f0f0f0',
                  color: statusFilter === status ? 'white' : '#666',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  textTransform: 'capitalize'
                }}
              >
                {status === 'all' ? 'All' : getStatusText(status)}
              </button>
            ))}
          </div>
        </div>

        {/* Appointments List */}
        <div className="appointments-list">
          {filteredAppointments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <div className="empty-title">No appointments found</div>
              <p className="empty-description">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'No appointments have been scheduled yet.'}
              </p>
            </div>
          ) : (
            filteredAppointments.map(appointment => (
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
                      {appointment.petName} ({appointment.petBreed})
                    </div>
                    <p className="appointment-vet">{appointment.vetName}</p>
                    <p className="appointment-time">
                      {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                    </p>
                    <div style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginTop: '4px'
                    }}>
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
                      <span style={{ fontSize: '12px', color: '#6B7280' }}>
                        Owner: {appointment.ownerName}
                      </span>
                    </div>
                  </div>
                </div>
                
                {appointment.purpose && (
                  <div style={{ marginBottom: '12px' }}>
                    <strong>Purpose:</strong> {appointment.purpose}
                  </div>
                )}
                
                {appointment.notes && (
                  <div style={{ marginBottom: '12px' }}>
                    <strong>Notes:</strong> {appointment.notes}
                  </div>
                )}

                <div className="appointment-actions" style={{
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap',
                  marginTop: '12px'
                }}>
                  {appointment.status === 'pending' && (
                    <>
                      <button 
                        onClick={() => handleStatusUpdate(appointment.id, 'confirmed')}
                        style={{
                          flex: 1,
                          padding: '10px 16px',
                          backgroundColor: '#10B981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          minWidth: '100px'
                        }}
                      >
                        ✓ Approve
                      </button>
                      <button 
                        onClick={() => handleStatusUpdate(appointment.id, 'cancelled')}
                        style={{
                          flex: 1,
                          padding: '10px 16px',
                          backgroundColor: '#EF4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          minWidth: '100px'
                        }}
                      >
                        ✕ Decline
                      </button>
                    </>
                  )}
                  
                  {appointment.status === 'confirmed' && (
                    <>
                      <button 
                        onClick={() => handleStatusUpdate(appointment.id, 'completed')}
                        style={{
                          flex: 1,
                          padding: '10px 16px',
                          backgroundColor: '#6B7280',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          minWidth: '100px'
                        }}
                      >
                        Mark Complete
                      </button>
                      <button 
                        onClick={() => handleStatusUpdate(appointment.id, 'cancelled')}
                        style={{
                          flex: 1,
                          padding: '10px 16px',
                          backgroundColor: '#EF4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          minWidth: '100px'
                        }}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  
                  <button 
                    onClick={() => setSelectedAppointment(appointment)}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      backgroundColor: '#F7931E',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      minWidth: '100px'
                    }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Appointment Details Modal */}
        {selectedAppointment && (
          <div 
            onClick={() => setSelectedAppointment(null)}
            style={{
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
              padding: '16px'
            }}
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '20px',
                maxWidth: '355px',
                width: '100%',
                maxHeight: '85vh',
                overflowY: 'auto',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                  Appointment Details
                </h3>
                <button
                  onClick={() => setSelectedAppointment(null)}
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ 
                  padding: '12px', 
                  backgroundColor: '#F9FAFB', 
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB'
                }}>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px', fontWeight: '500' }}>PET INFORMATION</div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#1F2937' }}>
                    {selectedAppointment.petName || 'Unknown Pet'}
                  </div>
                  <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '2px' }}>
                    {selectedAppointment.petBreed || 'Breed not specified'}
                  </div>
                </div>

                <div style={{ 
                  padding: '12px', 
                  backgroundColor: '#F9FAFB', 
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB'
                }}>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px', fontWeight: '500' }}>OWNER INFORMATION</div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#1F2937' }}>
                    {selectedAppointment.ownerName || 'Unknown Owner'}
                  </div>
                  <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '2px' }}>
                    {selectedAppointment.ownerEmail || 'Email not available'}
                  </div>
                </div>

                <div style={{ 
                  padding: '12px', 
                  backgroundColor: '#F9FAFB', 
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB'
                }}>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px', fontWeight: '500' }}>VETERINARIAN</div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#1F2937' }}>
                    {selectedAppointment.vetName || 'Unknown Veterinarian'}
                  </div>
                  <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '2px' }}>
                    {selectedAppointment.clinic || 'Clinic not specified'}
                  </div>
                  {selectedAppointment.vetAddress && (
                    <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>
                      {selectedAppointment.vetAddress}
                    </div>
                  )}
                </div>

                <div style={{ 
                  padding: '12px', 
                  backgroundColor: '#F9FAFB', 
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB'
                }}>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px', fontWeight: '500' }}>APPOINTMENT DETAILS</div>
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '2px' }}>Date & Time</div>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#1F2937' }}>
                      {selectedAppointment.date ? new Date(selectedAppointment.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      }) : 'Date not set'} at {selectedAppointment.time || 'Time not set'}
                    </div>
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '2px' }}>Purpose</div>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#1F2937' }}>
                      {selectedAppointment.purpose || 'Not specified'}
                    </div>
                  </div>
                  {selectedAppointment.notes && (
                    <div>
                      <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '2px' }}>Notes</div>
                      <div style={{ fontSize: '14px', color: '#1F2937', lineHeight: '1.5' }}>
                        {selectedAppointment.notes}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ 
                  padding: '12px', 
                  backgroundColor: '#F9FAFB', 
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '2px', fontWeight: '500' }}>STATUS</div>
                    <span style={{ 
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '600',
                      backgroundColor: getStatusColor(selectedAppointment.status),
                      color: 'white',
                      display: 'inline-block'
                    }}>
                      {getStatusText(selectedAppointment.status)}
                    </span>
                  </div>
                  {selectedAppointment.createdAt && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '2px', fontWeight: '500' }}>CREATED</div>
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>
                        {new Date(selectedAppointment.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ 
                display: 'flex', 
                gap: '12px', 
                marginTop: '20px' 
              }}>
                <button
                  onClick={() => setSelectedAppointment(null)}
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
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
          </div>
          <BottomNavigation userType="admin" />
        </div>
      </div>
    </div>
  );
}
