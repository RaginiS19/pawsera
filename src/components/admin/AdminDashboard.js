import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../api/firebase';
import { collection, doc, getDocs, getDoc, updateDoc, addDoc } from 'firebase/firestore';
import { logoutUser } from '../../api/authService';
import { getDummyUsers, getDummySystemActivity, getDummyAppointments, getDummyPets } from '../../api/dummyData';
import BottomNavigation from '../common/BottomNavigation';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [pendingVets, setPendingVets] = useState([]);
  const [systemActivity, setSystemActivity] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]);
  const [allPets, setAllPets] = useState([]);
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
      
      // Always use sample data for consistent experience across all admins
      const dummyUsers = getDummyUsers();
      const dummyAppointments = getDummyAppointments();
      const dummyPets = getDummyPets();
      const systemActivityData = getDummySystemActivity();
      
      // Filter pending vets from dummy data
      const pendingVetsList = dummyUsers.filter(u => u.role === 'Vet' && u.status === 'pending');
      
      console.log('Admin Dashboard Data Loaded:', {
        usersCount: dummyUsers.length,
        appointmentsCount: dummyAppointments.length,
        petsCount: dummyPets.length,
        pendingVetsCount: pendingVetsList.length,
        systemActivityCount: systemActivityData.length
      });
      
      setPendingVets(pendingVetsList);
      setAllUsers(dummyUsers);
      setAllAppointments(dummyAppointments);
      setAllPets(dummyPets);
      setSystemActivity(systemActivityData);
    } catch (err) {
      console.error('Could not load admin data:', err);
      setError('Unable to load admin data. Please check your connection.');
      // Use dummy data as fallback
      const dummyUsers = getDummyUsers();
      const pendingVetsList = dummyUsers.filter(u => u.role === 'Vet' && u.status === 'pending');
      setPendingVets(pendingVetsList);
      setAllUsers(dummyUsers);
      setAllAppointments(getDummyAppointments());
      setAllPets(getDummyPets());
      setSystemActivity(getDummySystemActivity());
    } finally {
      setLoading(false);
    }
  };

  const handleVetApproval = async (vetId, approved) => {
    try {
      if (db) {
        try {
          await updateDoc(doc(db, 'users', vetId), {
            status: approved ? 'approved' : 'rejected',
            updatedAt: new Date().toISOString(),
            reviewedBy: user.uid
          });
          
          // Add to system activity
          try {
            await addDoc(collection(db, 'system_activity'), {
              type: 'approval',
              message: `Vet account ${approved ? 'approved' : 'rejected'}`,
              user: user.displayName || user.email,
              timestamp: new Date().toISOString(),
              vetId: vetId
            });
          } catch (activityErr) {
            console.warn('Could not add to system activity:', activityErr);
            // Continue even if activity log fails
          }
        } catch (updateErr) {
          console.warn('Could not update vet status in Firebase:', updateErr);
          // Continue to update local state even if Firebase fails
        }
      }
      
      // Update local state immediately for better UX
      setPendingVets(prev => prev.filter(vet => vet.id !== vetId));
      
      // Reload data to refresh the view
      await loadData();
    } catch (err) {
      console.error('Error in vet approval:', err);
      setError('Unable to update vet status. Please try again.');
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
                <p>Loading admin data...</p>
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

        {/* Welcome Section */}
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '18px', color: '#6B7280', margin: '0 0 8px 0' }}>
            Admin Dashboard
          </h2>
          {/* Debug info - remove in production */}
          {process.env.NODE_ENV === 'development' && (
            <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '8px' }}>
              Users: {allUsers.length} | Appointments: {allAppointments.length} | Pets: {allPets.length} | Pending: {pendingVets.length}
            </div>
          )}
        </div>

        {/* Stats Overview */}
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
                {allUsers.length}
              </div>
              <div style={{ fontSize: '13px', color: '#6B7280', fontWeight: '500' }}>
                Total Users
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
                {allPets.length}
              </div>
              <div style={{ fontSize: '13px', color: '#6B7280', fontWeight: '500' }}>
                Total Pets
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
                {allAppointments.length}
              </div>
              <div style={{ fontSize: '13px', color: '#6B7280', fontWeight: '500' }}>
                Total Appointments
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
                {pendingVets.length}
              </div>
              <div style={{ fontSize: '13px', color: '#6B7280', fontWeight: '500' }}>
                Pending Approvals
              </div>
            </div>
          </div>
        </div>


        {/* Pending Approvals Section */}
        <div style={{ padding: '0 16px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1F2937', margin: 0 }}>
              Pending Approvals
            </h3>
            <button 
              style={{ 
                color: '#F7931E', 
                background: 'none', 
                border: 'none', 
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              View All
            </button>
          </div>

          {pendingVets.length === 0 ? (
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '12px', 
              padding: '20px',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <p style={{ color: '#6B7280', margin: 0 }}>No pending vet approvals</p>
            </div>
          ) : (
            pendingVets.map(vet => (
              <div key={vet.id} style={{ 
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
                  borderRadius: '50%', 
                  backgroundColor: '#10B981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '18px'
                }}>
                  👨‍⚕️
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1F2937' }}>
                    {vet.name || 'Dr. ' + (vet.email?.split('@')[0] || 'Unknown')}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6B7280' }}>
                    {vet.specialization || 'Veterinarian'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleVetApproval(vet.id, false)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: '#EF4444',
                      border: 'none',
                      color: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ✕
                  </button>
                  <button
                    onClick={() => handleVetApproval(vet.id, true)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: '#10B981',
                      border: 'none',
                      color: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ✓
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Quick Actions Section */}
        <div style={{ padding: '0 16px', marginTop: '24px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1F2937', marginBottom: '16px' }}>
            Quick Actions
          </h3>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '12px' 
          }}>
            <div 
              onClick={() => navigate('/admin/users')}
              style={{ 
                backgroundColor: 'white', 
                borderRadius: '12px', 
                padding: '20px',
                textAlign: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                border: '1px solid #F3F4F6'
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>👥</div>
              <div style={{ fontSize: '14px', fontWeight: '500', color: '#1F2937' }}>
                Manage Users
              </div>
            </div>
            
            <div 
              onClick={() => navigate('/admin/appointments')}
              style={{ 
                backgroundColor: 'white', 
                borderRadius: '12px', 
                padding: '20px',
                textAlign: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                border: '1px solid #F3F4F6'
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>📅</div>
              <div style={{ fontSize: '14px', fontWeight: '500', color: '#1F2937' }}>
                All Appointments
              </div>
            </div>
            
            <div 
              onClick={() => navigate('/admin/settings')}
              style={{ 
                backgroundColor: 'white', 
                borderRadius: '12px', 
                padding: '20px',
                textAlign: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                border: '1px solid #F3F4F6'
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚙️</div>
              <div style={{ fontSize: '14px', fontWeight: '500', color: '#1F2937' }}>
                Settings
              </div>
            </div>
          </div>
        </div>

        {/* System Activity Section */}
        <div style={{ padding: '0 16px', marginTop: '24px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1F2937', marginBottom: '16px' }}>
            System Activity
          </h3>
          
          {systemActivity.map(activity => (
            <div key={activity.id} style={{ 
              backgroundColor: '#F9FAFB', 
              borderRadius: '12px', 
              padding: '16px',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '50%', 
                backgroundColor: '#F7931E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '16px'
              }}>
                {activity.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#1F2937' }}>
                  {activity.message}
                </div>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>
                  {activity.user} - {activity.timestamp}
                </div>
              </div>
            </div>
          ))}
        </div>
          </div>
          <BottomNavigation userType="admin" />
        </div>
      </div>
    </div>
  );
}