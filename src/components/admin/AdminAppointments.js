import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../api/firebase';
import { collection, doc, getDocs, updateDoc, query, orderBy } from 'firebase/firestore';
import { logoutUser } from '../../api/authService';
import BottomNavigation from '../common/BottomNavigation';

export default function AdminAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [users, setUsers] = useState([]);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAppointment, setSelectedAppointment] = useState(null);

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
      
      const [appointmentsSnap, usersSnap, petsSnap] = await Promise.all([
        getDocs(query(collection(db, 'appointments'), orderBy('date', 'desc'))),
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'pets'))
      ]);

      const appointmentsList = appointmentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const usersList = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const petsList = petsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Enrich appointments with user and pet data
      const enrichedAppointments = appointmentsList.map(appointment => {
        const owner = usersList.find(u => u.userID === appointment.ownerID);
        const pet = petsList.find(p => p.id === appointment.petId);
        return {
          ...appointment,
          ownerName: owner?.name || 'Unknown Owner',
          ownerEmail: owner?.email || 'Unknown Email',
          petName: pet?.name || 'Unknown Pet',
          petBreed: pet?.breed || 'Unknown Breed'
        };
      });

      setAppointments(enrichedAppointments);
      setUsers(usersList);
      setPets(petsList);
    } catch (err) {
      setError(err.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    try {
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

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/');
    } catch (e) {
      setError(e.message || 'Logout failed');
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = 
      appointment.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.petName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.vetName.toLowerCase().includes(searchTerm.toLowerCase());
    
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
          <div className="screen-content with-bottom-nav">
        <div className="page-header">
          <button className="back-button" onClick={() => navigate('/admin/dashboard')}>← Back</button>
          <h1 className="page-title">Appointments</h1>
          <button className="logout-button" onClick={handleLogout}>Logout</button>
        </div>


        {/* Search and Filter Section */}
        <div style={{ padding: '16px' }}>
          <div className="search-section">
            <div className="search-container">
              <div className="search-icon">🔎</div>
              <input
                className="search-input"
                placeholder="Search appointments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
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

                <div className="appointment-actions">
                  {appointment.status === 'pending' && (
                    <>
                      <button 
                        className="action-button primary"
                        onClick={() => handleStatusUpdate(appointment.id, 'confirmed')}
                      >
                        ✓ Approve
                      </button>
                      <button 
                        className="action-button secondary"
                        onClick={() => handleStatusUpdate(appointment.id, 'cancelled')}
                      >
                        ✕ Cancel
                      </button>
                    </>
                  )}
                  
                  {appointment.status === 'confirmed' && (
                    <button 
                      className="action-button"
                      onClick={() => handleStatusUpdate(appointment.id, 'completed')}
                    >
                      Mark Complete
                    </button>
                  )}
                  
                  <button 
                    className="action-button"
                    onClick={() => setSelectedAppointment(appointment)}
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <strong>Pet:</strong> {selectedAppointment.petName} ({selectedAppointment.petBreed})
                </div>
                <div>
                  <strong>Owner:</strong> {selectedAppointment.ownerName}
                </div>
                <div>
                  <strong>Email:</strong> {selectedAppointment.ownerEmail}
                </div>
                <div>
                  <strong>Veterinarian:</strong> {selectedAppointment.vetName}
                </div>
                <div>
                  <strong>Address:</strong> {selectedAppointment.vetAddress}
                </div>
                <div>
                  <strong>Date & Time:</strong> {new Date(selectedAppointment.date).toLocaleDateString()} at {selectedAppointment.time}
                </div>
                <div>
                  <strong>Purpose:</strong> {selectedAppointment.purpose}
                </div>
                {selectedAppointment.notes && (
                  <div>
                    <strong>Notes:</strong> {selectedAppointment.notes}
                  </div>
                )}
                <div>
                  <strong>Status:</strong> 
                  <span style={{ 
                    marginLeft: '8px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: getStatusColor(selectedAppointment.status),
                    color: 'white'
                  }}>
                    {getStatusText(selectedAppointment.status)}
                  </span>
                </div>
                <div>
                  <strong>Created:</strong> {new Date(selectedAppointment.createdAt).toLocaleString()}
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
