import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../api/firebase';
import { collection, doc, getDocs, getDoc } from 'firebase/firestore';
import { logoutUser } from '../../api/authService';
import { getDummyAppointments, getDummyPets } from '../../api/dummyData';
import BottomNavigation from '../common/BottomNavigation';

export default function VetDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      
      // Always use sample data for consistent experience across all vets
      const userData = {
        name: user.displayName || user.email?.split('@')[0] || 'Dr. Unknown'
      };
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const vetName = userData.name;
      
      // Create sample appointments with current/future dates for ALL vets
      const dummyAppts = getDummyAppointments();
      const sampleAppts = dummyAppts.slice(0, 5).map((apt, index) => {
        // Create dates: first one today, rest in future
        const appointmentDate = new Date(today);
        appointmentDate.setDate(today.getDate() + index); // Today, tomorrow, day after, etc.
        const dateStr = appointmentDate.toISOString().split('T')[0];
        
        return {
          ...apt,
          id: `sample_${apt.id}_${user.uid}_${index}`,
          vetId: user.uid,
          vetID: user.uid,
          vetName: vetName,
          date: dateStr, // Update to current/future date
          status: index === 0 ? 'confirmed' : (index < 3 ? 'pending' : 'confirmed'), // Mix of statuses
          time: apt.time || ['10:00 AM', '2:00 PM', '11:30 AM', '3:30 PM', '9:00 AM'][index] // Ensure times are set
        };
      });
      
      // Filter appointments for today
      const todayAppointments = sampleAppts
        .filter(a => {
          const appointmentDate = new Date(a.date);
          appointmentDate.setHours(0, 0, 0, 0);
          return appointmentDate.getTime() === today.getTime();
        })
        .sort((a, b) => {
          // Sort by time
          const timeA = a.time || '00:00';
          const timeB = b.time || '00:00';
          return timeA.localeCompare(timeB);
        });

      // Get upcoming appointments (future dates)
      const upcomingAppointments = sampleAppts
        .filter(a => {
          const appointmentDate = new Date(a.date);
          appointmentDate.setHours(0, 0, 0, 0);
          return appointmentDate > today && (a.status === 'confirmed' || a.status === 'pending');
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 5);

      // Combine today's and upcoming appointments
      const vetAppointments = [...todayAppointments, ...upcomingAppointments];
      
      // Create sample patients that match the appointments
      const dummyPets = getDummyPets();
      const vetPatients = dummyPets.slice(0, Math.min(5, vetAppointments.length)).map((pet, index) => {
        const matchingAppt = vetAppointments[index] || sampleAppts[index];
        return {
          ...pet,
          id: `sample_${pet.id}_${user.uid}_${index}`,
          ownerName: matchingAppt?.ownerName || pet.ownerName || 'Unknown Owner'
        };
      });
      
      const allUsers = [];

      console.log('Vet Dashboard Data Loaded:', {
        profile: userData,
        appointmentsCount: vetAppointments.length,
        patientsCount: vetPatients.length,
        usersCount: allUsers.length,
        todayAppointments: todayAppointments.length,
        upcomingAppointments: upcomingAppointments.length,
        sampleAppts: sampleAppts
      });
      
      setProfile(userData);
      setAppointments(vetAppointments);
      setPatients(vetPatients);
      setUsers(allUsers);
    } catch (err) {
      console.error('Could not load vet dashboard:', err);
      setError(err.message || 'Failed to load vet dashboard');
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
          <div className="screen-content with-bottom-nav" style={{
            WebkitOverflowScrolling: 'touch',
            paddingBottom: '100px'
          }}>
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="paw-logo">🐾</div>
            <h1 className="page-title">Pawsera</h1>
          </div>
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

        {/* Vet Dashboard Content */}
        <>
            {/* Welcome Section */}
            <div style={{ padding: '16px', textAlign: 'center' }}>
              <h2 style={{ fontSize: '18px', color: '#6B7280', margin: '0 0 8px 0' }}>
                Hello{profile?.name ? `, ${profile.name}` : ''}!
              </h2>
              {/* Debug info - remove in production */}
              {process.env.NODE_ENV === 'development' && (
                <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '8px' }}>
                  Appointments: {appointments.length} | Patients: {patients.length}
                </div>
              )}
            </div>

            {/* Stats Widgets */}
            <div style={{ padding: '0 16px', marginBottom: '24px' }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '12px',
                maxWidth: '100%'
              }}>
                <div style={{ 
                  backgroundColor: '#FFF7ED', 
                  borderRadius: '12px', 
                  padding: '20px 16px',
                  textAlign: 'center',
                  border: '1px solid #FED7AA',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  minHeight: '80px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#F7931E', marginBottom: '4px' }}>
                    {appointments.filter(a => {
                      const appointmentDate = new Date(a.date);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      appointmentDate.setHours(0, 0, 0, 0);
                      return appointmentDate.getTime() === today.getTime();
                    }).length}
                  </div>
                  <div style={{ fontSize: '13px', color: '#6B7280', fontWeight: '500' }}>
                    Today's Appointments
                  </div>
                </div>
                
                <div style={{ 
                  backgroundColor: '#FFF7ED', 
                  borderRadius: '12px', 
                  padding: '20px 16px',
                  textAlign: 'center',
                  border: '1px solid #FED7AA',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  minHeight: '80px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#F7931E', marginBottom: '4px' }}>
                    {patients.length}
                  </div>
                  <div style={{ fontSize: '13px', color: '#6B7280', fontWeight: '500' }}>
                    Total Patients
                  </div>
                </div>
              </div>
            </div>

            {/* Today's Appointments Section */}
            <div style={{ padding: '0 16px', marginBottom: '24px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1F2937', margin: 0 }}>
                  Today's Appointments
                </h3>
                <button
                  onClick={() => navigate('/vet/scheduling')}
                  style={{
                    backgroundColor: '#F7931E',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  View All
                </button>
              </div>

              {appointments.filter(a => {
                const appointmentDate = new Date(a.date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                appointmentDate.setHours(0, 0, 0, 0);
                return appointmentDate.getTime() === today.getTime();
              }).length === 0 ? (
                <div style={{ 
                  backgroundColor: 'white', 
                  borderRadius: '12px', 
                  padding: '24px',
                  textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: '1px solid #F3F4F6'
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>📅</div>
                  <div style={{ fontSize: '15px', color: '#6B7280', marginBottom: '16px' }}>
                    No appointments scheduled for today
                  </div>
                </div>
              ) : (
                appointments
                  .filter(a => {
                    const appointmentDate = new Date(a.date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    appointmentDate.setHours(0, 0, 0, 0);
                    return appointmentDate.getTime() === today.getTime();
                  })
                  .map(appointment => (
                    <div key={appointment.id} style={{ 
                      backgroundColor: 'white', 
                      borderRadius: '12px', 
                      padding: '16px',
                      marginBottom: '12px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      border: '1px solid #F3F4F6'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1F2937', marginBottom: '4px' }}>
                            {appointment.petName || 'Pet'}
                          </div>
                          <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>
                            Owner: {appointment.ownerName || 'Unknown'}
                          </div>
                          <div style={{ fontSize: '13px', color: '#9CA3AF' }}>
                            {appointment.purpose || 'General Checkup'}
                          </div>
                        </div>
                        <div style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          backgroundColor: appointment.status === 'confirmed' ? '#D1FAE5' : '#FEF3C7',
                          color: appointment.status === 'confirmed' ? '#065F46' : '#92400E',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {appointment.status === 'confirmed' ? 'Confirmed' : appointment.status || 'Pending'}
                        </div>
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        paddingTop: '12px',
                        borderTop: '1px solid #F3F4F6'
                      }}>
                        <div style={{ fontSize: '14px', color: '#6B7280' }}>🕐</div>
                        <div style={{ fontSize: '14px', color: '#1F2937', fontWeight: '500' }}>
                          {appointment.time || '10:00 AM'}
                        </div>
                        {appointment.notes && (
                          <>
                            <div style={{ fontSize: '14px', color: '#6B7280', marginLeft: '8px' }}>📝</div>
                            <div style={{ fontSize: '13px', color: '#6B7280', flex: 1 }}>
                              {appointment.notes.length > 30 ? appointment.notes.substring(0, 30) + '...' : appointment.notes}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>

            {/* Upcoming Appointments Section */}
            <div style={{ padding: '0 16px', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1F2937', marginBottom: '12px' }}>
                Upcoming Appointments
              </h3>

              {appointments.filter(a => {
                const appointmentDate = new Date(a.date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                appointmentDate.setHours(0, 0, 0, 0);
                return appointmentDate > today;
              }).length === 0 ? (
                <div style={{ 
                  backgroundColor: 'white', 
                  borderRadius: '12px', 
                  padding: '16px',
                  textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: '1px solid #F3F4F6'
                }}>
                  <p style={{ color: '#6B7280', margin: 0, fontSize: '14px' }}>No upcoming appointments</p>
                </div>
              ) : (
                appointments
                  .filter(a => {
                    const appointmentDate = new Date(a.date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    appointmentDate.setHours(0, 0, 0, 0);
                    return appointmentDate > today;
                  })
                  .slice(0, 5)
                  .map(appointment => (
                    <div key={appointment.id} style={{ 
                      backgroundColor: 'white', 
                      borderRadius: '12px', 
                      padding: '12px',
                      marginBottom: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      border: '1px solid #F3F4F6',
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
                        🐾
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1F2937' }}>
                          {appointment.petName || 'Pet'} - {appointment.purpose || 'Checkup'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                          {new Date(appointment.date).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })} at {appointment.time || '10:00 AM'}
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

          </div>
          <BottomNavigation userType="vet" />
        </div>
      </div>
    </div>
  );
}