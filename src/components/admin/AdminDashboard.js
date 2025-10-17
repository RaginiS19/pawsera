import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../api/firebase';
import { collection, doc, getDocs, getDoc, updateDoc, addDoc } from 'firebase/firestore';
import { logoutUser } from '../../api/authService';
import { getDummyUsers, getDummySystemActivity } from '../../api/dummyData';
import BottomNavigation from '../common/BottomNavigation';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [pendingVets, setPendingVets] = useState([]);
  const [systemActivity, setSystemActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState('admin');

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
      
      // Load pending vet approvals
      const usersSnap = await getDocs(collection(db, 'users'));
      const pendingVetsList = usersSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(u => u.role === 'Vet' && u.status === 'pending');

      // Mock system activity data
      const mockActivity = [
        {
          id: '1',
          type: 'approval',
          message: 'Vet account for Dr. Lee approved',
          user: 'Admin_JohnDoe',
          timestamp: '2 hours ago',
          icon: '🛡️'
        },
        {
          id: '2',
          type: 'registration',
          message: 'New user \'sarah_p\' registered',
          user: 'System',
          timestamp: '5 hours ago',
          icon: '👤'
        },
        {
          id: '3',
          type: 'security',
          message: 'Failed login attempt for \'admin\'',
          user: 'IP: 192.168.1.10',
          timestamp: '1 day ago',
          icon: '⚠️'
        }
      ];

      setPendingVets(pendingVetsList);
      setSystemActivity(mockActivity);
    } catch (err) {
      console.warn('Could not load admin data, using dummy data:', err.message);
      // Use dummy data as fallback
      const dummyUsers = getDummyUsers();
      const pendingVetsList = dummyUsers.filter(u => u.role === 'Vet' && u.status === 'pending');
      setPendingVets(pendingVetsList);
      setSystemActivity(getDummySystemActivity());
    } finally {
      setLoading(false);
    }
  };

  const handleVetApproval = async (vetId, approved) => {
    try {
      await updateDoc(doc(db, 'users', vetId), {
        status: approved ? 'approved' : 'rejected',
        updatedAt: new Date().toISOString(),
        reviewedBy: user.uid
      });
      
      // Add to system activity
      await addDoc(collection(db, 'system_activity'), {
        type: 'approval',
        message: `Vet account ${approved ? 'approved' : 'rejected'}`,
        user: user.displayName || user.email,
        timestamp: new Date().toISOString(),
        vetId: vetId
      });
      
      await loadData();
    } catch (err) {
      console.warn('Could not update vet status:', err.message);
      if (err.message.includes('permission') || err.message.includes('insufficient')) {
        setError('Unable to update vet status. Please check your connection and try again.');
      } else {
        setError(err.message || 'Failed to update vet status');
      }
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

        {/* User Management Section */}
        <div style={{ padding: '0 16px', marginTop: '24px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1F2937', marginBottom: '16px' }}>
            User Management
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
                cursor: 'pointer'
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>👥</div>
              <div style={{ fontSize: '14px', fontWeight: '500', color: '#1F2937' }}>
                Manage Users
              </div>
            </div>
            
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '12px', 
              padding: '20px',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              cursor: 'pointer'
            }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>👨‍⚕️⚙️</div>
              <div style={{ fontSize: '14px', fontWeight: '500', color: '#1F2937' }}>
                Manage Vets
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
                cursor: 'pointer'
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>📅</div>
              <div style={{ fontSize: '14px', fontWeight: '500', color: '#1F2937' }}>
                Appointments
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
                cursor: 'pointer'
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚙️</div>
              <div style={{ fontSize: '14px', fontWeight: '500', color: '#1F2937' }}>
                Settings
              </div>
            </div>
            
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '12px', 
              padding: '20px',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              cursor: 'pointer'
            }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>🛡️👤</div>
              <div style={{ fontSize: '14px', fontWeight: '500', color: '#1F2937' }}>
                Roles & Permissions
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