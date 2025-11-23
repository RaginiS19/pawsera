import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../api/firebase';
import { collection, doc, getDocs, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { logoutUser, findUserByEmail } from '../../api/authService';
import BottomNavigation from '../common/BottomNavigation';

export default function Settings() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    notifications: {
      appointmentReminders: true,
      medicationReminders: true,
      weatherAlerts: true,
      promotionalEmails: false
    }
  });

  const user = auth?.currentUser || null;

  // Helper functions for localStorage
  const saveSettingsToLocalStorage = (settings) => {
    try {
      const userId = user?.uid || 'default';
      localStorage.setItem(`pawsera_settings_${userId}`, JSON.stringify(settings));
      console.log('✅ Settings saved to localStorage');
    } catch (err) {
      console.warn('Could not save settings to localStorage:', err);
    }
  };

  const loadSettingsFromLocalStorage = () => {
    try {
      const userId = user?.uid || 'default';
      const saved = localStorage.getItem(`pawsera_settings_${userId}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (err) {
      console.warn('Could not load settings from localStorage:', err);
    }
    return null;
  };

  // Helper functions for appointments (same as Schedule page)
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

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    loadData();
  }, [navigate, user]);

  // Listen for appointment changes and reload data when page becomes visible
  useEffect(() => {
    if (!user) return;
    
    // Reload data when page becomes visible (user navigates back to this page)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadData();
      }
    };
    
    // Listen for storage events to update when appointments change in other tabs
    const handleStorageChange = (e) => {
      if (e.key && e.key.startsWith('pawsera_appointments_')) {
        loadData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load from localStorage first
      const localSettings = loadSettingsFromLocalStorage();
      const localAppointments = loadAppointmentsFromLocalStorage();
      
      let userData = {};
      let userAppointments = [];
      
      if (db) {
        try {
          // Try multiple methods to find user data (same as Login.js)
          let userDoc = null;
          try {
            userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              userData = { id: userDoc.id, ...userDoc.data() };
              console.log('✅ Found user data by UID');
            }
          } catch (uidError) {
            // Check if it's a permission error
            if (uidError.code === 'permission-denied' || uidError.message?.includes('permission') || uidError.message?.includes('insufficient')) {
              console.warn('Permission denied accessing user data by UID, will use localStorage:', uidError);
            } else {
              console.warn('Could not get user by UID:', uidError);
            }
          }
          
          // If UID lookup failed, try by email query
          if (!userData && user.email) {
            try {
              const emailUserData = await findUserByEmail(user.email);
              if (emailUserData) {
                userData = emailUserData;
                console.log('✅ Found user data by email query');
              }
            } catch (emailError) {
              // Check if it's a permission error
              if (emailError.code === 'permission-denied' || emailError.message?.includes('permission') || emailError.message?.includes('insufficient')) {
                console.warn('Permission denied accessing user data by email query, will use localStorage:', emailError);
              } else {
                console.warn('Could not get user by email query:', emailError);
              }
            }
          }
          
          // If still not found, try by email as document ID
          if (!userData && user.email) {
            try {
              const emailDoc = await getDoc(doc(db, 'users', user.email));
              if (emailDoc.exists()) {
                userData = { id: emailDoc.id, ...emailDoc.data() };
                console.log('✅ Found user data by email as document ID');
              }
            } catch (emailDocError) {
              // Check if it's a permission error
              if (emailDocError.code === 'permission-denied' || emailDocError.message?.includes('permission') || emailDocError.message?.includes('insufficient')) {
                console.warn('Permission denied accessing user data by email as document ID, will use localStorage:', emailDocError);
              } else {
                console.warn('Could not get user by email as document ID:', emailDocError);
              }
            }
          }
          
          // If still not found, use defaults
          if (!userData) {
            userData = {
              name: user.displayName || user.email?.split('@')[0] || '',
              email: user.email || '',
              city: 'Toronto',
              notifications: {
                appointmentReminders: true,
                medicationReminders: true,
                weatherAlerts: true,
                promotionalEmails: false
              }
            };
          }
          
          // Try to get appointments, but handle permission errors gracefully
          let firebaseAppointments = [];
          try {
            const appointmentsSnap = await getDocs(collection(db, 'appointments'));
            firebaseAppointments = appointmentsSnap.docs
              .map(d => ({ id: d.id, ...d.data() }))
              .filter(a => a.ownerID === user.uid);
          } catch (appointmentsErr) {
            console.warn('Could not load appointments from Firestore (permissions issue):', appointmentsErr);
            // Continue with empty array - will use localStorage appointments
            firebaseAppointments = [];
          }

          // Merge Firebase appointments with localStorage appointments (same logic as Schedule page)
          // First filter by ownerID to ensure user-specific data isolation
          const userLocalAppointments = localAppointments.filter(a => a.ownerID === user.uid);
          const localApptsNotInFirebase = userLocalAppointments.filter(localAppt => 
            !firebaseAppointments.some(fbAppt => 
              fbAppt.id === localAppt.id || 
              (fbAppt.date === localAppt.date && 
               fbAppt.time === localAppt.time && 
               fbAppt.petId === localAppt.petId)
            )
          );

          userAppointments = [...firebaseAppointments, ...localApptsNotInFirebase].sort(
            (a, b) => new Date(a.date) - new Date(b.date)
          );

          // Merge with localStorage settings if available
          if (localSettings) {
            userData = { ...userData, ...localSettings };
          }
        } catch (firestoreErr) {
          // Check if it's a permission error
          const isPermissionError = firestoreErr.code === 'permission-denied' || 
                                   firestoreErr.message?.includes('permission') || 
                                   firestoreErr.message?.includes('insufficient');
          
          if (isPermissionError) {
            console.warn('Firestore permission denied, using localStorage only:', firestoreErr);
            // Don't show error to user for permission issues - just use localStorage
            setError(null);
          } else {
            console.warn('Could not load from Firestore, using localStorage:', firestoreErr);
          }
          
          // Use localStorage appointments if Firebase fails
          userAppointments = localAppointments.filter(a => a.ownerID === user.uid);
          
          if (localSettings) {
            userData = localSettings;
          } else {
            // Default data
            userData = {
              name: user.displayName || user.email?.split('@')[0] || '',
              email: user.email || '',
              city: 'Toronto',
              notifications: {
                appointmentReminders: true,
                medicationReminders: true,
                weatherAlerts: true,
                promotionalEmails: false
              }
            };
          }
        }
      } else {
        // No Firebase, use localStorage or defaults
        userAppointments = localAppointments.filter(a => a.ownerID === user.uid);
        
        if (localSettings) {
          userData = localSettings;
        } else {
          userData = {
            name: user.displayName || user.email?.split('@')[0] || '',
            email: user.email || '',
            city: 'Toronto',
            notifications: {
              appointmentReminders: true,
              medicationReminders: true,
              weatherAlerts: true,
              promotionalEmails: false
            }
          };
        }
      }

      setProfile(userData);
      setAppointments(userAppointments);
      setFormData({
        name: userData.name || user.email?.split('@')[0] || '',
        email: userData.email || user.email || '',
        phone: userData.phone || '',
        address: userData.address || '',
        city: userData.city || 'Toronto',
        notifications: userData.notifications || {
          appointmentReminders: true,
          medicationReminders: true,
          weatherAlerts: true,
          promotionalEmails: false
        }
      });
    } catch (err) {
      console.error('Error loading settings:', err);
      setError('Unable to load settings. Using default values.');
      // Set default data
      setFormData({
        name: user?.displayName || user?.email?.split('@')[0] || '',
        email: user?.email || '',
        phone: '',
        address: '',
        city: 'Toronto',
        notifications: {
          appointmentReminders: true,
          medicationReminders: true,
          weatherAlerts: true,
          promotionalEmails: false
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('notifications.')) {
      const notificationKey = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        notifications: {
          ...prev.notifications,
          [notificationKey]: checked
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccessMessage(null);
      
      const updateData = {
        ...formData,
        updatedAt: new Date().toISOString()
      };
      
      // Try to save to Firestore (with both UID and email as document ID for redundancy)
      if (db) {
        try {
          // Try with UID first
          try {
            await updateDoc(doc(db, 'users', user.uid), updateData);
            console.log('✅ Profile updated in Firestore with UID');
          } catch (uidErr) {
            // Check if it's a permission error
            if (uidErr.code === 'permission-denied' || uidErr.message?.includes('permission') || uidErr.message?.includes('insufficient')) {
              console.warn('Permission denied saving to Firestore, saving to localStorage only:', uidErr);
              // Don't throw error - just save to localStorage
            } else {
              // If update fails for other reasons, try setDoc with merge
              try {
                await setDoc(doc(db, 'users', user.uid), updateData, { merge: true });
                console.log('✅ Profile saved in Firestore with UID (setDoc)');
              } catch (setDocErr) {
                if (setDocErr.code === 'permission-denied' || setDocErr.message?.includes('permission') || setDocErr.message?.includes('insufficient')) {
                  console.warn('Permission denied saving to Firestore, saving to localStorage only:', setDocErr);
                } else {
                  console.warn('Could not save with UID:', setDocErr);
                }
              }
            }
          }
          
          // Also try with email as document ID (for redundancy)
          if (user.email) {
            try {
              await setDoc(doc(db, 'users', user.email), updateData, { merge: true });
              console.log('✅ Profile also saved with email as document ID');
            } catch (emailErr) {
              if (emailErr.code === 'permission-denied' || emailErr.message?.includes('permission') || emailErr.message?.includes('insufficient')) {
                console.warn('Permission denied saving with email, using localStorage only:', emailErr);
              } else {
                console.warn('Could not save with email as document ID:', emailErr);
              }
            }
          }
        } catch (firestoreErr) {
          // Check if it's a permission error
          if (firestoreErr.code === 'permission-denied' || firestoreErr.message?.includes('permission') || firestoreErr.message?.includes('insufficient')) {
            console.warn('Permission denied accessing Firestore, using localStorage only:', firestoreErr);
            // Don't show error to user - localStorage will handle it
          } else {
            console.warn('Could not update in Firestore, saving locally:', firestoreErr);
          }
        }
      }
      
      // Always save to localStorage
      saveSettingsToLocalStorage(updateData);
      
      // Update local state
      setProfile(updateData);
      setShowProfileForm(false);
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
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

  // Generate appointment frequency data for analytics
  const getAppointmentFrequency = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const frequency = months.map((month, index) => {
      const monthAppointments = appointments.filter(apt => {
        try {
          const aptDate = new Date(apt.date);
          return aptDate.getMonth() === index && aptDate.getFullYear() === currentYear;
        } catch {
          return false;
        }
      });
      return {
        month,
        count: monthAppointments.length,
        isCurrent: index === currentMonth,
        appointments: monthAppointments
      };
    });
    
    // Get last 6 months for display
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      last6Months.push(frequency[monthIndex]);
    }
    
    return last6Months;
  };

  const appointmentData = getAppointmentFrequency();
  const maxCount = Math.max(...appointmentData.map(d => d.count), 1) || 1;
  const totalAppointments = appointments.length;
  const upcomingAppointments = appointments.filter(apt => {
    try {
      return new Date(apt.date) >= new Date() && (apt.status === 'confirmed' || apt.status === 'pending');
    } catch {
      return false;
    }
  }).length;
  const averagePerMonth = appointmentData.length > 0 
    ? (appointmentData.reduce((sum, d) => sum + d.count, 0) / appointmentData.length).toFixed(1)
    : 0;

  if (loading) {
    return (
      <div className="screen-container">
        <div className="mobile-phone-frame">
          <div className="mobile-screen">
            <div className="screen-content with-bottom-nav">
              <div className="page-header">
                <button className="back-button" onClick={() => navigate('/home')}>← Back</button>
                <h1 className="page-title">Settings</h1>
                <button className="logout-button" onClick={handleLogout}>Logout</button>
              </div>
              <div style={{ padding: 20, textAlign: 'center' }}>
                <p style={{ color: '#6B7280', fontSize: '14px' }}>Loading settings...</p>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="paw-logo">🐾</div>
            <h1 className="page-title">Pawsera</h1>
          </div>
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
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>⚠️</span>
            <span>{error}</span>
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
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>✅</span>
            <span>{successMessage}</span>
          </div>
        )}

        {!showProfileForm && !showNotifications ? (
          <>
            {/* Analytics Section */}
            <div style={{ 
              backgroundColor: 'white', 
              margin: '16px', 
              borderRadius: '12px', 
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1F2937', margin: 0 }}>
                  Appointment Analytics
                </h3>
                <button
                  onClick={loadData}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '20px',
                    cursor: 'pointer',
                    color: '#6B7280',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#F3F4F6'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  title="Refresh data"
                >
                  🔄
                </button>
              </div>
              
              {/* Summary Stats */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '12px',
                marginBottom: '20px'
              }}>
                <div style={{
                  backgroundColor: '#FFF7ED',
                  borderRadius: '8px',
                  padding: '12px',
                  textAlign: 'center',
                  border: '1px solid #FED7AA'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#F7931E', marginBottom: '4px' }}>
                    {totalAppointments}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: '500' }}>
                    Total Appointments
                  </div>
                </div>
                <div style={{
                  backgroundColor: '#ECFDF5',
                  borderRadius: '8px',
                  padding: '12px',
                  textAlign: 'center',
                  border: '1px solid #A7F3D0'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#059669', marginBottom: '4px' }}>
                    {upcomingAppointments}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: '500' }}>
                    Upcoming
                  </div>
                </div>
              </div>

              {/* Chart Section */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ 
                  fontSize: '14px', 
                  color: '#6B7280', 
                  marginBottom: '12px',
                  fontWeight: '500'
                }}>
                  Last 6 Months
                </div>
                <div style={{ height: '180px', position: 'relative', paddingTop: '20px' }}>
                  {/* Y-axis labels */}
                  <div style={{ 
                    position: 'absolute', 
                    left: '0', 
                    top: '20px', 
                    bottom: '40px',
                    width: '30px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    fontSize: '10px',
                    color: '#9CA3AF'
                  }}>
                    <span>{maxCount}</span>
                    <span>{Math.ceil(maxCount * 0.75)}</span>
                    <span>{Math.ceil(maxCount * 0.5)}</span>
                    <span>{Math.ceil(maxCount * 0.25)}</span>
                    <span>0</span>
                  </div>

                  {/* Chart bars */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'end', 
                    height: '140px', 
                    gap: '6px',
                    marginLeft: '35px',
                    position: 'relative'
                  }}>
                    {appointmentData.map((data, index) => (
                      <div 
                        key={`${data.month}-${index}`} 
                        style={{ 
                          flex: 1, 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center',
                          position: 'relative'
                        }}
                      >
                        {/* Value label on top */}
                        {data.count > 0 && (
                          <div style={{
                            position: 'absolute',
                            top: '-20px',
                            fontSize: '11px',
                            fontWeight: '600',
                            color: data.isCurrent ? '#F7931E' : '#6B7280'
                          }}>
                            {data.count}
                          </div>
                        )}
                        
                        {/* Bar */}
                        <div style={{ 
                          height: `${maxCount > 0 ? (data.count / maxCount) * 120 : 0}px`,
                          minHeight: data.count > 0 ? '4px' : '0px',
                          backgroundColor: data.isCurrent ? '#F7931E' : '#FED7AA',
                          width: '100%',
                          borderRadius: '4px 4px 0 0',
                          position: 'relative',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer'
                        }}
                        title={`${data.month}: ${data.count} appointment${data.count !== 1 ? 's' : ''}`}
                        >
                        </div>
                        
                        {/* Month label */}
                        <div style={{ 
                          marginTop: '8px', 
                          fontSize: '11px', 
                          color: data.isCurrent ? '#F7931E' : '#6B7280',
                          fontWeight: data.isCurrent ? '600' : '400'
                        }}>
                          {data.month}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Average per month */}
              <div style={{
                padding: '12px',
                backgroundColor: '#F9FAFB',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ fontSize: '13px', color: '#6B7280', fontWeight: '500' }}>
                  Average per month
                </div>
                <div style={{ fontSize: '16px', color: '#1F2937', fontWeight: '600' }}>
                  {averagePerMonth}
                </div>
              </div>
            </div>

            {/* Settings Section */}
            <div style={{ padding: '0 16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#1F2937' }}>
                Settings
              </h3>

              {/* Profile Management */}
              <div 
                className="settings-item"
                onClick={() => setShowProfileForm(true)}
                style={{ cursor: 'pointer' }}
              >
                <div className="settings-content">
                  <div className="settings-icon">
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
                      👤
                    </div>
                  </div>
                  <div className="settings-text">
                    <div className="settings-title" style={{ color: '#1F2937', fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>Profile Management</div>
                    <p className="settings-subtitle" style={{ color: '#6B7280', fontSize: '13px', margin: 0 }}>Manage your profile details</p>
                  </div>
                </div>
                <div className="settings-action">
                  <div className="chevron-icon" style={{ color: '#6B7280', fontSize: '24px' }}>›</div>
                </div>
              </div>

              {/* Notification Preferences */}
              <div 
                className="settings-item"
                onClick={() => setShowNotifications(true)}
                style={{ cursor: 'pointer' }}
              >
                <div className="settings-content">
                  <div className="settings-icon">
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
                      🔔
                    </div>
                  </div>
                  <div className="settings-text">
                    <div className="settings-title" style={{ color: '#1F2937', fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>Notification Preferences</div>
                    <p className="settings-subtitle" style={{ color: '#6B7280', fontSize: '13px', margin: 0 }}>Set your notification settings</p>
                  </div>
                </div>
                <div className="settings-action">
                  <div className="chevron-icon" style={{ color: '#6B7280', fontSize: '24px' }}>›</div>
                </div>
              </div>
            </div>
          </>
        ) : showProfileForm ? (
          <div style={{ padding: '16px' }}>
            <div style={{ marginBottom: '16px' }}>
              <button
                onClick={() => setShowProfileForm(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '18px',
                  cursor: 'pointer',
                  color: '#1F2937',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                ← Back
              </button>
            </div>
            <div className="form-container">
              <div className="form-header">
                <h2 className="form-title" style={{ color: '#1F2937', fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>Profile Management</h2>
                <p className="form-subtitle" style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>Update your personal information</p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#1F2937', fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block' }}>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    className="form-input"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    style={{ color: '#1F2937' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ color: '#1F2937', fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block' }}>Email</label>
                  <input
                    type="email"
                    name="email"
                    className="form-input"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    style={{ color: '#1F2937' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ color: '#1F2937', fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block' }}>Phone (optional)</label>
                  <input
                    type="tel"
                    name="phone"
                    className="form-input"
                    value={formData.phone}
                    onChange={handleInputChange}
                    style={{ color: '#1F2937' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ color: '#1F2937', fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block' }}>Address (optional)</label>
                  <input
                    type="text"
                    name="address"
                    className="form-input"
                    value={formData.address}
                    onChange={handleInputChange}
                    style={{ color: '#1F2937' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ color: '#1F2937', fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block' }}>City</label>
                  <input
                    type="text"
                    name="city"
                    className="form-input"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    style={{ color: '#1F2937' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setShowProfileForm(false)}
                    style={{ 
                      flex: 1, 
                      backgroundColor: '#f0f0f0', 
                      color: '#1F2937',
                      border: '1px solid #ccc',
                      fontWeight: '500'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 1, color: '#FFFFFF', fontWeight: '500' }}
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div style={{ padding: '16px' }}>
            <div style={{ marginBottom: '16px' }}>
              <button
                onClick={() => setShowNotifications(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '18px',
                  cursor: 'pointer',
                  color: '#1F2937',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                ← Back
              </button>
            </div>
            <div className="form-container">
              <div className="form-header">
                <h2 className="form-title" style={{ color: '#1F2937', fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>Notification Preferences</h2>
                <p className="form-subtitle" style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>Choose what notifications you'd like to receive</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                <div style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#1F2937', fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>Appointment Reminders</div>
                    <p style={{ color: '#6B7280', fontSize: '13px', margin: 0 }}>Get reminded about upcoming appointments</p>
                  </div>
                  <label style={{
                    position: 'relative',
                    width: '48px',
                    height: '28px',
                    backgroundColor: formData.notifications.appointmentReminders ? '#F7931E' : '#D1D5DB',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    flexShrink: 0,
                    marginLeft: '16px'
                  }}>
                    <input
                      type="checkbox"
                      name="notifications.appointmentReminders"
                      checked={formData.notifications.appointmentReminders}
                      onChange={handleInputChange}
                      style={{ display: 'none' }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: '2px',
                      left: formData.notifications.appointmentReminders ? '22px' : '2px',
                      width: '24px',
                      height: '24px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '50%',
                      transition: 'left 0.2s',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }} />
                  </label>
                </div>

                <div style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#1F2937', fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>Medication Reminders</div>
                    <p style={{ color: '#6B7280', fontSize: '13px', margin: 0 }}>Reminders for pet medications</p>
                  </div>
                  <label style={{
                    position: 'relative',
                    width: '48px',
                    height: '28px',
                    backgroundColor: formData.notifications.medicationReminders ? '#F7931E' : '#D1D5DB',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    flexShrink: 0,
                    marginLeft: '16px'
                  }}>
                    <input
                      type="checkbox"
                      name="notifications.medicationReminders"
                      checked={formData.notifications.medicationReminders}
                      onChange={handleInputChange}
                      style={{ display: 'none' }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: '2px',
                      left: formData.notifications.medicationReminders ? '22px' : '2px',
                      width: '24px',
                      height: '24px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '50%',
                      transition: 'left 0.2s',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }} />
                  </label>
                </div>

                <div style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#1F2937', fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>Weather Alerts</div>
                    <p style={{ color: '#6B7280', fontSize: '13px', margin: 0 }}>Weather-based pet care reminders</p>
                  </div>
                  <label style={{
                    position: 'relative',
                    width: '48px',
                    height: '28px',
                    backgroundColor: formData.notifications.weatherAlerts ? '#F7931E' : '#D1D5DB',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    flexShrink: 0,
                    marginLeft: '16px'
                  }}>
                    <input
                      type="checkbox"
                      name="notifications.weatherAlerts"
                      checked={formData.notifications.weatherAlerts}
                      onChange={handleInputChange}
                      style={{ display: 'none' }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: '2px',
                      left: formData.notifications.weatherAlerts ? '22px' : '2px',
                      width: '24px',
                      height: '24px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '50%',
                      transition: 'left 0.2s',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }} />
                  </label>
                </div>

                <div style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#1F2937', fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>Promotional Emails</div>
                    <p style={{ color: '#6B7280', fontSize: '13px', margin: 0 }}>Receive updates about new features and offers</p>
                  </div>
                  <label style={{
                    position: 'relative',
                    width: '48px',
                    height: '28px',
                    backgroundColor: formData.notifications.promotionalEmails ? '#F7931E' : '#D1D5DB',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    flexShrink: 0,
                    marginLeft: '16px'
                  }}>
                    <input
                      type="checkbox"
                      name="notifications.promotionalEmails"
                      checked={formData.notifications.promotionalEmails}
                      onChange={handleInputChange}
                      style={{ display: 'none' }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: '2px',
                      left: formData.notifications.promotionalEmails ? '22px' : '2px',
                      width: '24px',
                      height: '24px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '50%',
                      transition: 'left 0.2s',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }} />
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setShowNotifications(false)}
                  style={{ 
                    flex: 1, 
                    backgroundColor: '#f0f0f0', 
                    color: '#1F2937',
                    border: '1px solid #ccc',
                    fontWeight: '500'
                  }}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ flex: 1, color: '#FFFFFF', fontWeight: '500' }}
                  onClick={async () => {
                    try {
                      setError(null);
                      setSuccessMessage(null);
                      
                      const updateData = {
                        notifications: formData.notifications,
                        updatedAt: new Date().toISOString()
                      };
                      
                      // Try to save to Firestore
                      if (db) {
                        try {
                          await updateDoc(doc(db, 'users', user.uid), updateData);
                          console.log('✅ Notifications updated in Firestore');
                        } catch (firestoreErr) {
                          // Check if it's a permission error
                          if (firestoreErr.code === 'permission-denied' || firestoreErr.message?.includes('permission') || firestoreErr.message?.includes('insufficient')) {
                            console.warn('Permission denied saving to Firestore, saving to localStorage only:', firestoreErr);
                            // Don't show error to user - localStorage will handle it
                          } else {
                            console.warn('Could not update in Firestore, saving locally:', firestoreErr);
                          }
                        }
                      }
                      
                      // Always save to localStorage
                      const currentSettings = loadSettingsFromLocalStorage() || {};
                      saveSettingsToLocalStorage({ ...currentSettings, ...updateData });
                      
                      // Update local state
                      setProfile(prev => ({ ...prev, notifications: formData.notifications }));
                      setShowNotifications(false);
                      setSuccessMessage('Notification settings saved successfully!');
                      setTimeout(() => setSuccessMessage(null), 3000);
                    } catch (err) {
                      console.error('Error updating notifications:', err);
                      setError(err.message || 'Failed to update notifications');
                    }
                  }}
                  style={{ flex: 1 }}
                >
                  Save Settings
                </button>
              </div>
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