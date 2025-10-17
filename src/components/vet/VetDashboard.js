import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../api/firebase';
import { collection, doc, getDocs, getDoc } from 'firebase/firestore';
import { logoutUser } from '../../api/authService';
import BottomNavigation from '../common/BottomNavigation';

export default function VetDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState('vet');

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

      const userData = userDoc.exists() ? userDoc.data() : {
        name: user.displayName || user.email?.split('@')[0] || 'Dr. Unknown'
      };

      // Get appointments for this vet
      const vetAppointments = appointmentsSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(a => a.vetName === userData.name || a.vetId === user.uid)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 3); // Show only next 3 appointments

      // Get unique patients from appointments
      const patientIds = [...new Set(vetAppointments.map(a => a.petId))];
      const vetPatients = petsSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(p => patientIds.includes(p.id))
        .slice(0, 3); // Show only 3 patients

      const allUsers = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      setProfile(userData);
      setAppointments(vetAppointments);
      setPatients(vetPatients);
      setUsers(allUsers);
    } catch (err) {
      console.warn('Could not load vet dashboard:', err.message);
      if (err.message.includes('permission') || err.message.includes('insufficient')) {
        setError('Unable to load vet dashboard. Please check your connection and try again.');
      } else {
        setError(err.message || 'Failed to load vet dashboard');
      }
    } finally {
      setLoading(false);
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="paw-logo">🐾</div>
                  <h1 className="page-title">Pawsera</h1>
                </div>
                <button className="logout-button" onClick={handleLogout}>Logout</button>
              </div>
              <div style={{ padding: 20, textAlign: 'center' }}>
                <p>Loading dashboard...</p>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="paw-logo">🐾</div>
            <h1 className="page-title">Pawsera</h1>
          </div>
          <button className="logout-button" onClick={handleLogout}>Logout</button>
        </div>

        {/* View Toggle */}
        <div style={{ 
          display: 'flex', 
          margin: '16px', 
          backgroundColor: '#f0f0f0', 
          borderRadius: '8px',
          padding: '4px'
        }}>
          <button
            onClick={() => setCurrentView('vet')}
            style={{
              flex: 1,
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: currentView === 'vet' ? '#F7931E' : 'transparent',
              color: currentView === 'vet' ? 'white' : '#666',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Vet View
          </button>
          <button
            onClick={() => setCurrentView('admin')}
            style={{
              flex: 1,
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: currentView === 'admin' ? '#F7931E' : 'transparent',
              color: currentView === 'admin' ? 'white' : '#666',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Admin View
          </button>
        </div>


        {/* Content based on current view */}
        {currentView === 'vet' ? (
          <>
            {/* Upcoming Appointments Section */}
            <div style={{ padding: '0 16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1F2937', marginBottom: '12px' }}>
                Upcoming Appointments
              </h3>

              {appointments.length === 0 ? (
                <div style={{ 
                  backgroundColor: '#F9FAFB', 
                  borderRadius: '12px', 
                  padding: '16px',
                  textAlign: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <p style={{ color: '#6B7280', margin: 0, fontSize: '14px' }}>No upcoming appointments</p>
                </div>
              ) : (
                appointments.map(appointment => (
                  <div key={appointment.id} style={{ 
                    backgroundColor: '#F9FAFB', 
                    borderRadius: '12px', 
                    padding: '12px',
                    marginBottom: '8px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{ 
                      width: '36px', 
                      height: '36px', 
                      borderRadius: '50%', 
                      backgroundColor: '#F7931E',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '16px'
                    }}>
                      👩‍⚕️
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1F2937' }}>
                        {appointment.time} - {appointment.purpose} for {appointment.petName || 'Pet'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6B7280' }}>
                        {appointment.vetName || profile?.name}
                      </div>
                    </div>
                    <div style={{ color: '#6B7280', fontSize: '14px' }}>›</div>
                  </div>
                ))
              )}
            </div>

            {/* Patient Records Section */}
            <div style={{ padding: '0 16px', marginTop: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1F2937', marginBottom: '12px' }}>
                Patient Records
              </h3>

              {patients.length === 0 ? (
                <div style={{ 
                  backgroundColor: '#F9FAFB', 
                  borderRadius: '12px', 
                  padding: '16px',
                  textAlign: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <p style={{ color: '#6B7280', margin: 0, fontSize: '14px' }}>No patient records</p>
                </div>
              ) : (
                patients.map(patient => (
                  <div key={patient.id} style={{ 
                    backgroundColor: '#F9FAFB', 
                    borderRadius: '12px', 
                    padding: '12px',
                    marginBottom: '8px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{ 
                      width: '36px', 
                      height: '36px', 
                      borderRadius: '50%', 
                      backgroundColor: '#F7931E',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '16px',
                      overflow: 'hidden'
                    }}>
                      {patient.imageUrl ? (
                        <img 
                          src={patient.imageUrl} 
                          alt={patient.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        '🐾'
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1F2937' }}>
                        {patient.name} - {patient.breed}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6B7280' }}>
                        Owner: {patient.ownerName || 'Unknown'}
                      </div>
                    </div>
                    <div style={{ color: '#6B7280', fontSize: '14px' }}>›</div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            {/* Admin View Content */}
            <div style={{ padding: '0 16px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1F2937', marginBottom: '16px' }}>
                System Overview
              </h3>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '12px',
                marginBottom: '24px'
              }}>
                <div style={{ 
                  backgroundColor: 'white', 
                  borderRadius: '12px', 
                  padding: '20px',
                  textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>👥</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1F2937', marginBottom: '4px' }}>
                    {users.length}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6B7280' }}>
                    Total Users
                  </div>
                </div>
                
                <div style={{ 
                  backgroundColor: 'white', 
                  borderRadius: '12px', 
                  padding: '20px',
                  textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>🐾</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1F2937', marginBottom: '4px' }}>
                    {pets.length}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6B7280' }}>
                    Total Pets
                  </div>
                </div>
                
                <div style={{ 
                  backgroundColor: 'white', 
                  borderRadius: '12px', 
                  padding: '20px',
                  textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>📅</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1F2937', marginBottom: '4px' }}>
                    {appointments.length}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6B7280' }}>
                    Total Appointments
                  </div>
                </div>
                
                <div style={{ 
                  backgroundColor: 'white', 
                  borderRadius: '12px', 
                  padding: '20px',
                  textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>👨‍⚕️</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1F2937', marginBottom: '4px' }}>
                    {users.filter(u => u.role === 'Vet').length}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6B7280' }}>
                    Veterinarians
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Quick Actions */}
            <div style={{ padding: '0 16px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1F2937', marginBottom: '16px' }}>
                Admin Actions
              </h3>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '12px' 
              }}>
                <button
                  onClick={() => navigate('/admin/dashboard')}
                  style={{ 
                    backgroundColor: 'white', 
                    borderRadius: '12px', 
                    padding: '20px',
                    textAlign: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>🛡️</div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#1F2937' }}>
                    Admin Dashboard
                  </div>
                </button>
                
                <button
                  onClick={() => navigate('/admin/appointments')}
                  style={{ 
                    backgroundColor: 'white', 
                    borderRadius: '12px', 
                    padding: '20px',
                    textAlign: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>📊</div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#1F2937' }}>
                    All Appointments
                  </div>
                </button>
                
                <button
                  onClick={() => navigate('/admin/settings')}
                  style={{ 
                    backgroundColor: 'white', 
                    borderRadius: '12px', 
                    padding: '20px',
                    textAlign: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚙️</div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#1F2937' }}>
                    System Settings
                  </div>
                </button>
                
                <button
                  onClick={() => navigate('/admin/dashboard')}
                  style={{ 
                    backgroundColor: 'white', 
                    borderRadius: '12px', 
                    padding: '20px',
                    textAlign: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>👥</div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#1F2937' }}>
                    User Management
                  </div>
                </button>
              </div>
            </div>
          </>
        )}

          </div>
          <BottomNavigation userType="vet" />
        </div>
      </div>
    </div>
  );
}