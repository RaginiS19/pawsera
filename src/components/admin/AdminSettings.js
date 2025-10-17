import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../api/firebase';
import { collection, doc, getDocs, getDoc, updateDoc } from 'firebase/firestore';
import { logoutUser } from '../../api/authService';
import BottomNavigation from '../common/BottomNavigation';

export default function AdminSettings() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [pets, setPets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notifications: {
      systemAlerts: true,
      userRegistrations: true,
      vetApprovals: true,
      appointmentUpdates: true,
      systemReports: false
    }
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
      
      const [userDoc, appointmentsSnap, petsSnap, usersSnap] = await Promise.all([
        getDoc(doc(db, 'users', user.uid)),
        getDocs(collection(db, 'appointments')),
        getDocs(collection(db, 'pets')),
        getDocs(collection(db, 'users'))
      ]);

      const userData = userDoc.exists() ? userDoc.data() : {
        name: user.displayName || user.email?.split('@')[0] || 'Admin',
        email: user.email,
        phone: '',
        address: '',
        notifications: {
          systemAlerts: true,
          userRegistrations: true,
          vetApprovals: true,
          appointmentUpdates: true,
          systemReports: false
        }
      };

      const allAppointments = appointmentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const allPets = petsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const allUsers = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      setProfile(userData);
      setAppointments(allAppointments);
      setPets(allPets);
      setUsers(allUsers);
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        address: userData.address || '',
        notifications: userData.notifications || formData.notifications
      });
    } catch (err) {
      console.warn('Could not load admin settings:', err.message);
      if (err.message.includes('permission') || err.message.includes('insufficient')) {
        setError('Unable to load admin settings. Please check your connection and try again.');
      } else {
        setError(err.message || 'Failed to load admin settings');
      }
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

  const handleNotificationChange = (key) => {
    setFormData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key]
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      await updateDoc(doc(db, 'users', user.uid), {
        ...formData,
        updatedAt: new Date().toISOString()
      });
      setShowProfileForm(false);
      await loadData();
    } catch (err) {
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

  const getAppointmentFrequency = () => {
    const last6Months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleString('default', { month: 'short' });
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate >= monthStart && aptDate <= monthEnd;
      });
      
      last6Months.push({
        month: monthName,
        count: monthAppointments.length
      });
    }
    
    return last6Months;
  };

  const getPopularServices = () => {
    const serviceCounts = {};
    appointments.forEach(apt => {
      const service = apt.purpose || 'General Checkup';
      serviceCounts[service] = (serviceCounts[service] || 0) + 1;
    });
    
    const total = appointments.length;
    return Object.entries(serviceCounts)
      .map(([service, count]) => ({
        service,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  };

  const getPetDemographics = () => {
    const typeCounts = {};
    pets.forEach(pet => {
      const type = pet.type || 'Other';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    
    const total = pets.length;
    return Object.entries(typeCounts)
      .map(([type, count]) => ({
        type,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);
  };

  const appointmentData = getAppointmentFrequency();
  const popularServices = getPopularServices();
  const petDemographics = getPetDemographics();
  const totalAppointments = appointments.length;
  const currentMonthCount = appointmentData[appointmentData.length - 1]?.count || 0;
  const previousMonthCount = appointmentData[appointmentData.length - 2]?.count || 0;
  const growthPercentage = previousMonthCount > 0 ? 
    Math.round(((currentMonthCount - previousMonthCount) / previousMonthCount) * 100) : 0;

  if (loading) {
    return (
      <div className="screen-container">
        <div className="mobile-phone-frame">
          <div className="mobile-screen">
            <div className="screen-content with-bottom-nav">
              <div className="page-header">
                <button className="back-button" onClick={() => navigate('/admin/dashboard')}>← Back</button>
                <h1 className="page-title">Settings & Analytics</h1>
                <button className="logout-button" onClick={handleLogout}>Logout</button>
              </div>
              <div style={{ padding: 20, textAlign: 'center' }}>
                <p>Loading settings...</p>
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
          <h1 className="page-title">Settings & Analytics</h1>
          <button className="logout-button" onClick={handleLogout}>Logout</button>
        </div>


        {!showProfileForm && !showNotifications ? (
          <>
            {/* Settings Section */}
            <div style={{ padding: '0 16px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1F2937', marginBottom: '16px' }}>
                Settings
              </h3>
              
              <div style={{ 
                backgroundColor: 'white', 
                borderRadius: '12px', 
                padding: '16px',
                marginBottom: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer'
              }}
              onClick={() => setShowProfileForm(true)}
              >
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
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1F2937' }}>
                    Profile Management
                  </div>
                  <div style={{ fontSize: '14px', color: '#6B7280' }}>
                    {profile?.name || 'Admin User'}
                  </div>
                </div>
                <div style={{ color: '#6B7280' }}>›</div>
              </div>

              <div style={{ 
                backgroundColor: 'white', 
                borderRadius: '12px', 
                padding: '16px',
                marginBottom: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer'
              }}
              onClick={() => setShowNotifications(true)}
              >
                <div style={{ position: 'relative' }}>
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
                    🔔
                  </div>
                  <div style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: '#F7931E'
                  }}></div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1F2937' }}>
                    Notification Preferences
                  </div>
                </div>
                <div style={{ color: '#6B7280' }}>›</div>
              </div>
            </div>

            {/* Analytics Section */}
            <div style={{ padding: '0 16px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1F2937', marginBottom: '16px' }}>
                Analytics
              </h3>

              {/* Appointment Frequency */}
              <div style={{ 
                backgroundColor: 'white', 
                borderRadius: '12px', 
                padding: '20px',
                marginBottom: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1F2937', margin: '0 0 4px 0' }}>
                  Appointment Frequency
                </h4>
                <p style={{ fontSize: '14px', color: '#6B7280', margin: '0 0 16px 0' }}>
                  Last 6 Months
                </p>
                
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1F2937', marginRight: '12px' }}>
                    {totalAppointments}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', color: '#F7931E' }}>
                    <span style={{ marginRight: '4px' }}>
                      {growthPercentage >= 0 ? '↗️' : '↘️'}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>
                      {Math.abs(growthPercentage)}% vs last period
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', height: '60px' }}>
                  {appointmentData.map((data, index) => (
                    <div key={data.month} style={{ textAlign: 'center', flex: 1 }}>
                      <div style={{ 
                        height: `${Math.max(20, (data.count / Math.max(...appointmentData.map(d => d.count), 1)) * 40)}px`,
                        backgroundColor: index === appointmentData.length - 1 ? '#F7931E' : '#E5E7EB',
                        borderRadius: '4px 4px 0 0',
                        marginBottom: '8px',
                        minHeight: '4px'
                      }}></div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: index === appointmentData.length - 1 ? '#1F2937' : '#6B7280',
                        fontWeight: index === appointmentData.length - 1 ? 'bold' : 'normal'
                      }}>
                        {data.month}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Popular Services */}
              <div style={{ 
                backgroundColor: 'white', 
                borderRadius: '12px', 
                padding: '20px',
                marginBottom: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1F2937', margin: '0 0 4px 0' }}>
                  Popular Services
                </h4>
                <p style={{ fontSize: '14px', color: '#6B7280', margin: '0 0 16px 0' }}>
                  By appointment count
                </p>
                
                {popularServices.map((service, index) => (
                  <div key={service.service} style={{ marginBottom: '12px' }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '4px'
                    }}>
                      <span style={{ fontSize: '14px', color: '#1F2937' }}>
                        {service.service}
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1F2937' }}>
                        {service.percentage}%
                      </span>
                    </div>
                    <div style={{ 
                      height: '8px', 
                      backgroundColor: '#E5E7EB', 
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${service.percentage}%`, 
                        backgroundColor: '#F7931E',
                        borderRadius: '4px'
                      }}></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pet Demographics */}
              <div style={{ 
                backgroundColor: 'white', 
                borderRadius: '12px', 
                padding: '20px',
                marginBottom: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1F2937', margin: '0 0 4px 0' }}>
                  Pet Demographics
                </h4>
                <p style={{ fontSize: '14px', color: '#6B7280', margin: '0 0 16px 0' }}>
                  Species Distribution
                </p>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                    <div style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '50%',
                      background: `conic-gradient(
                        #F7931E 0deg ${petDemographics[0]?.percentage * 3.6 || 0}deg,
                        #FCD34D ${petDemographics[0]?.percentage * 3.6 || 0}deg ${(petDemographics[0]?.percentage + petDemographics[1]?.percentage) * 3.6 || 0}deg,
                        #3B82F6 ${(petDemographics[0]?.percentage + petDemographics[1]?.percentage) * 3.6 || 0}deg ${(petDemographics[0]?.percentage + petDemographics[1]?.percentage + petDemographics[2]?.percentage) * 3.6 || 0}deg,
                        #FBBF24 ${(petDemographics[0]?.percentage + petDemographics[1]?.percentage + petDemographics[2]?.percentage) * 3.6 || 0}deg 360deg
                      )`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        backgroundColor: 'white',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1F2937' }}>
                          {pets.length}
                        </div>
                        <div style={{ fontSize: '10px', color: '#6B7280' }}>
                          Total Pets
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    {petDemographics.map((demo, index) => {
                      const colors = ['#F7931E', '#FCD34D', '#3B82F6', '#FBBF24'];
                      return (
                        <div key={demo.type} style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          marginBottom: '8px' 
                        }}>
                          <div style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: colors[index] || '#6B7280',
                            marginRight: '8px'
                          }}></div>
                          <span style={{ fontSize: '14px', color: '#1F2937', marginRight: '8px' }}>
                            {demo.type}s:
                          </span>
                          <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1F2937' }}>
                            {demo.percentage}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : showProfileForm ? (
          <div style={{ padding: '16px' }}>
            <div className="form-container">
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                  Profile Management
                </h3>
                <button
                  onClick={() => setShowProfileForm(false)}
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
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-input"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    type="tel"
                    className="form-input"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Address</label>
                  <textarea
                    className="form-input"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter your address"
                    rows="3"
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button
                    type="button"
                    onClick={() => setShowProfileForm(false)}
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
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
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
                  Notification Preferences
                </h3>
                <button
                  onClick={() => setShowNotifications(false)}
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
                {Object.entries(formData.notifications).map(([key, value]) => (
                  <div key={key} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '12px',
                    backgroundColor: '#f9f9f9',
                    borderRadius: '8px'
                  }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#1F2937' }}>
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>
                        {key === 'systemAlerts' && 'Critical system notifications'}
                        {key === 'userRegistrations' && 'New user registrations'}
                        {key === 'vetApprovals' && 'Vet approval requests'}
                        {key === 'appointmentUpdates' && 'Appointment status changes'}
                        {key === 'systemReports' && 'Weekly system reports'}
                      </div>
                    </div>
                    <button
                      onClick={() => handleNotificationChange(key)}
                      style={{
                        width: '44px',
                        height: '24px',
                        borderRadius: '12px',
                        border: 'none',
                        backgroundColor: value ? '#F7931E' : '#E5E7EB',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: 'white',
                        position: 'absolute',
                        top: '2px',
                        left: value ? '22px' : '2px',
                        transition: 'all 0.2s',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}></div>
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowNotifications(false)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#F7931E',
                  color: 'white',
                  cursor: 'pointer',
                  marginTop: '20px'
                }}
              >
                Save Preferences
              </button>
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
