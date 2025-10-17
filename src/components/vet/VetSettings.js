import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../api/firebase';
import { collection, doc, getDocs, getDoc, updateDoc } from 'firebase/firestore';
import { logoutUser } from '../../api/authService';
import BottomNavigation from '../common/BottomNavigation';

export default function VetSettings() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAvailability, setShowAvailability] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: '',
    clinicName: '',
    clinicAddress: '',
    licenseNumber: '',
    experience: '',
    bio: '',
    availability: {
      monday: { start: '09:00', end: '17:00', available: true },
      tuesday: { start: '09:00', end: '17:00', available: true },
      wednesday: { start: '09:00', end: '17:00', available: true },
      thursday: { start: '09:00', end: '17:00', available: true },
      friday: { start: '09:00', end: '17:00', available: true },
      saturday: { start: '10:00', end: '14:00', available: false },
      sunday: { start: '10:00', end: '14:00', available: false }
    },
    notifications: {
      newAppointments: true,
      appointmentReminders: true,
      patientUpdates: true,
      emergencyAlerts: true,
      promotionalEmails: false
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
      
      const [userDoc, appointmentsSnap] = await Promise.all([
        getDoc(doc(db, 'users', user.uid)),
        getDocs(collection(db, 'appointments'))
      ]);

      const userData = userDoc.exists() ? userDoc.data() : {
        name: user.displayName || user.email?.split('@')[0] || '',
        email: user.email || '',
        specialization: 'General Practice',
        clinicName: '',
        clinicAddress: '',
        licenseNumber: '',
        experience: '',
        bio: '',
        availability: {
          monday: { start: '09:00', end: '17:00', available: true },
          tuesday: { start: '09:00', end: '17:00', available: true },
          wednesday: { start: '09:00', end: '17:00', available: true },
          thursday: { start: '09:00', end: '17:00', available: true },
          friday: { start: '09:00', end: '17:00', available: true },
          saturday: { start: '10:00', end: '14:00', available: false },
          sunday: { start: '10:00', end: '14:00', available: false }
        },
        notifications: {
          newAppointments: true,
          appointmentReminders: true,
          patientUpdates: true,
          emergencyAlerts: true,
          promotionalEmails: false
        }
      };

      // Get appointments for this vet
      const vetAppointments = appointmentsSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(a => a.vetName === userData.name || a.vetId === user.uid);

      setProfile(userData);
      setAppointments(vetAppointments);
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        specialization: userData.specialization || 'General Practice',
        clinicName: userData.clinicName || '',
        clinicAddress: userData.clinicAddress || '',
        licenseNumber: userData.licenseNumber || '',
        experience: userData.experience || '',
        bio: userData.bio || '',
        availability: userData.availability || formData.availability,
        notifications: userData.notifications || formData.notifications
      });
    } catch (err) {
      setError(err.message || 'Failed to load vet settings');
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
    } else if (name.startsWith('availability.')) {
      const [day, field] = name.split('.').slice(1);
      setFormData(prev => ({
        ...prev,
        availability: {
          ...prev.availability,
          [day]: {
            ...prev.availability[day],
            [field]: field === 'available' ? checked : value
          }
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

  // Generate appointment frequency data for analytics
  const getAppointmentFrequency = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const currentMonth = new Date().getMonth();
    const frequency = months.map((month, index) => {
      const monthAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate.getMonth() === index;
      }).length;
      return {
        month,
        count: monthAppointments,
        isCurrent: index === currentMonth
      };
    });
    return frequency;
  };

  const appointmentData = getAppointmentFrequency();
  const maxCount = Math.max(...appointmentData.map(d => d.count), 1);

  if (loading) {
    return (
      <div className="screen-container">
        <div className="mobile-phone-frame">
          <div className="mobile-screen">
            <div className="screen-content with-bottom-nav">
              <div className="page-header">
                <button className="back-button" onClick={() => navigate('/vet/dashboard')}>← Back</button>
                <h1 className="page-title">Settings</h1>
                <button className="logout-button" onClick={handleLogout}>Logout</button>
              </div>
              <div style={{ padding: 20, textAlign: 'center' }}>
                <p>Loading settings...</p>
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


        {!showProfileForm && !showNotifications && !showAvailability ? (
          <>
            {/* Analytics Section */}
            <div style={{ 
              backgroundColor: 'white', 
              margin: '16px', 
              borderRadius: '12px', 
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', color: '#1F2937' }}>
                Appointment Frequency
              </h3>
              
              <div style={{ height: '200px', position: 'relative' }}>
                {/* Chart bars */}
                <div style={{ display: 'flex', alignItems: 'end', height: '150px', gap: '8px' }}>
                  {appointmentData.map((data, index) => (
                    <div key={data.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ 
                        height: `${(data.count / maxCount) * 120}px`,
                        backgroundColor: data.isCurrent ? '#F7931E' : '#FED7AA',
                        width: '100%',
                        borderRadius: '4px 4px 0 0',
                        position: 'relative'
                      }}>
                        {/* Trend line dots */}
                        <div style={{
                          position: 'absolute',
                          top: '-4px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: '8px',
                          height: '8px',
                          backgroundColor: '#F7931E',
                          borderRadius: '50%',
                          border: '2px solid white'
                        }} />
                      </div>
                      <div style={{ marginTop: '8px', fontSize: '12px', color: '#6B7280' }}>
                        {data.month}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Trend line */}
                <div style={{ 
                  position: 'absolute', 
                  top: '20px', 
                  left: '0', 
                  right: '0', 
                  height: '2px',
                  background: 'linear-gradient(90deg, #F7931E 0%, #F7931E 100%)',
                  opacity: 0.3
                }} />
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
                      👨‍⚕️
                    </div>
                  </div>
                  <div className="settings-text">
                    <div className="settings-title">Profile Management</div>
                    <p className="settings-subtitle">Manage your professional profile</p>
                  </div>
                </div>
                <div className="settings-action">
                  <div className="chevron-icon">›</div>
                </div>
              </div>

              {/* Availability Settings */}
              <div 
                className="settings-item"
                onClick={() => setShowAvailability(true)}
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
                      🕒
                    </div>
                  </div>
                  <div className="settings-text">
                    <div className="settings-title">Availability Settings</div>
                    <p className="settings-subtitle">Set your working hours and schedule</p>
                  </div>
                </div>
                <div className="settings-action">
                  <div className="chevron-icon">›</div>
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
                    <div className="settings-title">Notification Preferences</div>
                    <p className="settings-subtitle">Set your notification settings</p>
                  </div>
                </div>
                <div className="settings-action">
                  <div className="chevron-icon">›</div>
                </div>
              </div>
            </div>
          </>
        ) : showProfileForm ? (
          <div style={{ padding: '16px' }}>
            <div className="form-container">
              <div className="form-header">
                <h2 className="form-title">Profile Management</h2>
                <p className="form-subtitle">Update your professional information</p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    className="form-input"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    name="email"
                    className="form-input"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    className="form-input"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Specialization</label>
                  <select
                    name="specialization"
                    className="form-input"
                    value={formData.specialization}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="General Practice">General Practice</option>
                    <option value="Emergency & Critical Care">Emergency & Critical Care</option>
                    <option value="Surgery">Surgery</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Oncology">Oncology</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Ophthalmology">Ophthalmology</option>
                    <option value="Dentistry">Dentistry</option>
                    <option value="Behavioral Medicine">Behavioral Medicine</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Clinic Name</label>
                  <input
                    type="text"
                    name="clinicName"
                    className="form-input"
                    value={formData.clinicName}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Clinic Address</label>
                  <input
                    type="text"
                    name="clinicAddress"
                    className="form-input"
                    value={formData.clinicAddress}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">License Number</label>
                  <input
                    type="text"
                    name="licenseNumber"
                    className="form-input"
                    value={formData.licenseNumber}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Years of Experience</label>
                  <input
                    type="number"
                    name="experience"
                    className="form-input"
                    value={formData.experience}
                    onChange={handleInputChange}
                    min="0"
                    max="50"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Bio</label>
                  <textarea
                    name="bio"
                    className="form-input"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows="4"
                    placeholder="Tell us about your experience and approach to veterinary care..."
                    style={{ resize: 'vertical' }}
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
                      color: '#333',
                      border: '1px solid #ccc'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : showAvailability ? (
          <div style={{ padding: '16px' }}>
            <div className="form-container">
              <div className="form-header">
                <h2 className="form-title">Availability Settings</h2>
                <p className="form-subtitle">Set your working hours for each day</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {Object.entries(formData.availability).map(([day, schedule]) => (
                  <div key={day} style={{ 
                    border: '1px solid #e0e0e0', 
                    borderRadius: '8px', 
                    padding: '16px' 
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      marginBottom: '12px'
                    }}>
                      <h4 style={{ 
                        margin: 0, 
                        fontSize: '16px', 
                        fontWeight: '600',
                        textTransform: 'capitalize'
                      }}>
                        {day}
                      </h4>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          name={`availability.${day}.available`}
                          checked={schedule.available}
                          onChange={handleInputChange}
                          style={{ display: 'none' }}
                        />
                        <div className={`toggle-slider ${schedule.available ? 'active' : ''}`} />
                      </label>
                    </div>
                    
                    {schedule.available && (
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '12px', color: '#666', marginBottom: '4px', display: 'block' }}>
                            Start Time
                          </label>
                          <input
                            type="time"
                            name={`availability.${day}.start`}
                            value={schedule.start}
                            onChange={handleInputChange}
                            className="form-input"
                            style={{ padding: '8px' }}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '12px', color: '#666', marginBottom: '4px', display: 'block' }}>
                            End Time
                          </label>
                          <input
                            type="time"
                            name={`availability.${day}.end`}
                            value={schedule.end}
                            onChange={handleInputChange}
                            className="form-input"
                            style={{ padding: '8px' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setShowAvailability(false)}
                  style={{ 
                    flex: 1, 
                    backgroundColor: '#f0f0f0', 
                    color: '#333',
                    border: '1px solid #ccc'
                  }}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={async () => {
                    try {
                      await updateDoc(doc(db, 'users', user.uid), {
                        availability: formData.availability,
                        updatedAt: new Date().toISOString()
                      });
                      setShowAvailability(false);
                    } catch (err) {
                      setError(err.message || 'Failed to update availability');
                    }
                  }}
                  style={{ flex: 1 }}
                >
                  Save Availability
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '16px' }}>
            <div className="form-container">
              <div className="form-header">
                <h2 className="form-title">Notification Preferences</h2>
                <p className="form-subtitle">Choose what notifications you'd like to receive</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="settings-item">
                  <div className="settings-content">
                    <div className="settings-text">
                      <div className="settings-title">New Appointments</div>
                      <p className="settings-subtitle">Get notified when new appointments are booked</p>
                    </div>
                  </div>
                  <div className="settings-action">
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        name="notifications.newAppointments"
                        checked={formData.notifications.newAppointments}
                        onChange={handleInputChange}
                        style={{ display: 'none' }}
                      />
                      <div className={`toggle-slider ${formData.notifications.newAppointments ? 'active' : ''}`} />
                    </label>
                  </div>
                </div>

                <div className="settings-item">
                  <div className="settings-content">
                    <div className="settings-text">
                      <div className="settings-title">Appointment Reminders</div>
                      <p className="settings-subtitle">Reminders for upcoming appointments</p>
                    </div>
                  </div>
                  <div className="settings-action">
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        name="notifications.appointmentReminders"
                        checked={formData.notifications.appointmentReminders}
                        onChange={handleInputChange}
                        style={{ display: 'none' }}
                      />
                      <div className={`toggle-slider ${formData.notifications.appointmentReminders ? 'active' : ''}`} />
                    </label>
                  </div>
                </div>

                <div className="settings-item">
                  <div className="settings-content">
                    <div className="settings-text">
                      <div className="settings-title">Patient Updates</div>
                      <p className="settings-subtitle">Updates about your patients' health records</p>
                    </div>
                  </div>
                  <div className="settings-action">
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        name="notifications.patientUpdates"
                        checked={formData.notifications.patientUpdates}
                        onChange={handleInputChange}
                        style={{ display: 'none' }}
                      />
                      <div className={`toggle-slider ${formData.notifications.patientUpdates ? 'active' : ''}`} />
                    </label>
                  </div>
                </div>

                <div className="settings-item">
                  <div className="settings-content">
                    <div className="settings-text">
                      <div className="settings-title">Emergency Alerts</div>
                      <p className="settings-subtitle">Critical emergency notifications</p>
                    </div>
                  </div>
                  <div className="settings-action">
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        name="notifications.emergencyAlerts"
                        checked={formData.notifications.emergencyAlerts}
                        onChange={handleInputChange}
                        style={{ display: 'none' }}
                      />
                      <div className={`toggle-slider ${formData.notifications.emergencyAlerts ? 'active' : ''}`} />
                    </label>
                  </div>
                </div>

                <div className="settings-item">
                  <div className="settings-content">
                    <div className="settings-text">
                      <div className="settings-title">Promotional Emails</div>
                      <p className="settings-subtitle">Receive updates about new features and offers</p>
                    </div>
                  </div>
                  <div className="settings-action">
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        name="notifications.promotionalEmails"
                        checked={formData.notifications.promotionalEmails}
                        onChange={handleInputChange}
                        style={{ display: 'none' }}
                      />
                      <div className={`toggle-slider ${formData.notifications.promotionalEmails ? 'active' : ''}`} />
                    </label>
                  </div>
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
                    color: '#333',
                    border: '1px solid #ccc'
                  }}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={async () => {
                    try {
                      await updateDoc(doc(db, 'users', user.uid), {
                        notifications: formData.notifications,
                        updatedAt: new Date().toISOString()
                      });
                      setShowNotifications(false);
                    } catch (err) {
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
          <BottomNavigation userType="vet" />
        </div>
      </div>
    </div>
  );
}
