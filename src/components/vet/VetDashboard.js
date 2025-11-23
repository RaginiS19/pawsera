import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, storage } from '../../api/firebase';
import { collection, doc, getDocs, getDoc, addDoc, updateDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { logoutUser } from '../../api/authService';
import { getDummyAppointments, getDummyPets, getDummyMedicalHistoryByPetId } from '../../api/dummyData';
import BottomNavigation from '../common/BottomNavigation';

export default function VetDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientRecordForm, setShowPatientRecordForm] = useState(false);
  const [showAppointmentNotes, setShowAppointmentNotes] = useState(false);
  const [showEducationalResource, setShowEducationalResource] = useState(false);
  const [showCareRecommendation, setShowCareRecommendation] = useState(false);
  const [patientRecords, setPatientRecords] = useState([]);
  const [educationalResources, setEducationalResources] = useState([]);
  const [appointmentNotes, setAppointmentNotes] = useState({});
  const [patientRecordForm, setPatientRecordForm] = useState({
    petId: '',
    title: '',
    doctor: '',
    date: '',
    type: 'checkup',
    description: ''
  });
  const [careRecommendationForm, setCareRecommendationForm] = useState({
    petId: '',
    ownerId: '',
    title: '',
    description: '',
    priority: 'normal'
  });
  const [uploadingResource, setUploadingResource] = useState(false);

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
      
      // Create sample appointments with current/future dates for ALL vets (15 appointments)
      const dummyAppts = getDummyAppointments();
      const sampleAppts = dummyAppts.slice(0, 15).map((apt, index) => {
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
                  .slice(0, 10);

      // Combine today's and upcoming appointments
      const vetAppointments = [...todayAppointments, ...upcomingAppointments];
      
      // Create sample patients that match the appointments (all unique pets from appointments)
      const dummyPets = getDummyPets();
      const uniquePetIds = [...new Set(vetAppointments.map(a => a.petId).filter(Boolean))];
      const vetPatients = uniquePetIds.map((petId, index) => {
        const pet = dummyPets.find(p => p.id === petId) || dummyPets[index % dummyPets.length];
        const matchingAppt = vetAppointments.find(a => a.petId === petId);
        return {
          ...pet,
          id: `sample_${pet.id}_${user.uid}_${index}`,
          ownerName: matchingAppt?.ownerName || pet.ownerName || 'Unknown Owner',
          lastVisit: matchingAppt?.date || pet.lastCheckup,
          nextVisit: vetAppointments.filter(a => a.petId === petId && new Date(a.date) > today)
            .sort((a, b) => new Date(a.date) - new Date(b.date))[0]?.date || pet.nextCheckup
        };
      });
      
      // Load patient records (medical history) for all patients
      const allPatientRecords = [];
      vetPatients.forEach(patient => {
        const originalPetId = patient.id.replace(`sample_`, '').replace(`_${user.uid}_${vetPatients.indexOf(patient)}`, '');
        const records = getDummyMedicalHistoryByPetId(originalPetId);
        allPatientRecords.push(...records.map(r => ({ ...r, petId: patient.id, petName: patient.name })));
      });
      
      // Load educational resources (dummy data for now)
      const dummyResources = [
        { id: 'res1', title: 'Preventive Care Guide', type: 'PDF', uploadDate: '2024-04-01', url: '#' },
        { id: 'res2', title: 'Vaccination Schedule', type: 'PDF', uploadDate: '2024-04-02', url: '#' },
        { id: 'res3', title: 'Nutrition Tips', type: 'PDF', uploadDate: '2024-04-03', url: '#' }
      ];
      
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
      setPatientRecords(allPatientRecords);
      setEducationalResources(dummyResources);
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

  const handleAppointmentClick = (appointment) => {
    setSelectedAppointment(appointment);
  };

  const handlePatientClick = (patient) => {
    setSelectedPatient(patient);
  };

  const handleAddAppointmentNote = async (appointmentId, note) => {
    try {
      const updateData = {
        vetNotes: note,
        notesUpdatedAt: new Date().toISOString()
      };
      
      // Update local state
      setAppointments(prev => prev.map(apt => 
        apt.id === appointmentId ? { ...apt, ...updateData } : apt
      ));
      setAppointmentNotes(prev => ({ ...prev, [appointmentId]: note }));
      
      // Try to save to Firebase
      if (db) {
        try {
          await updateDoc(doc(db, 'appointments', appointmentId), updateData);
        } catch (err) {
          console.warn('Could not save note to Firebase:', err);
        }
      }
      
      setSuccessMessage('Note added successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to add note');
    }
  };

  const handleCreatePatientRecord = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      const newRecord = {
        ...patientRecordForm,
        id: `record_${Date.now()}`,
        petName: patients.find(p => p.id === patientRecordForm.petId)?.name || 'Unknown',
        createdAt: new Date().toISOString(),
        vetId: user.uid,
        vetName: profile?.name || 'Dr. Unknown'
      };
      
      // Add to local state
      setPatientRecords(prev => [newRecord, ...prev]);
      
      // Try to save to Firebase
      if (db) {
        try {
          await addDoc(collection(db, 'medical_history'), newRecord);
        } catch (err) {
          console.warn('Could not save to Firebase:', err);
        }
      }
      
      setShowPatientRecordForm(false);
      setPatientRecordForm({
        petId: '',
        title: '',
        doctor: '',
        date: '',
        type: 'checkup',
        description: ''
      });
      setSuccessMessage('Patient record created successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to create patient record');
    }
  };

  const handleUploadEducationalResource = async (file) => {
    try {
      setUploadingResource(true);
      setError(null);
      
      // Validate file
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        setUploadingResource(false);
        return;
      }
      
      let fileUrl = '';
      
      // Try Firebase Storage
      if (storage) {
        try {
          const storageRef = ref(storage, `educational_resources/${Date.now()}_${file.name}`);
          await uploadBytes(storageRef, file);
          fileUrl = await getDownloadURL(storageRef);
        } catch (storageErr) {
          console.warn('Could not upload to Firebase Storage:', storageErr);
          // Create local URL as fallback
          fileUrl = URL.createObjectURL(file);
        }
      } else {
        fileUrl = URL.createObjectURL(file);
      }
      
      const newResource = {
        id: `res_${Date.now()}`,
        title: file.name,
        type: file.type.includes('pdf') ? 'PDF' : 'Document',
        uploadDate: new Date().toISOString().split('T')[0],
        url: fileUrl,
        uploadedBy: user.uid,
        vetName: profile?.name || 'Dr. Unknown'
      };
      
      setEducationalResources(prev => [newResource, ...prev]);
      
      // Try to save to Firebase
      if (db) {
        try {
          await addDoc(collection(db, 'educational_resources'), newResource);
        } catch (err) {
          console.warn('Could not save to Firebase:', err);
        }
      }
      
      setShowEducationalResource(false);
      setSuccessMessage('Educational resource uploaded successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to upload resource');
    } finally {
      setUploadingResource(false);
    }
  };

  const handleSendCareRecommendation = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      const recommendation = {
        ...careRecommendationForm,
        id: `rec_${Date.now()}`,
        petName: patients.find(p => p.id === careRecommendationForm.petId)?.name || 'Unknown',
        ownerName: users.find(u => u.id === careRecommendationForm.ownerId)?.name || 'Unknown',
        createdAt: new Date().toISOString(),
        vetId: user.uid,
        vetName: profile?.name || 'Dr. Unknown',
        status: 'sent'
      };
      
      // Try to save to Firebase
      if (db) {
        try {
          await addDoc(collection(db, 'care_recommendations'), recommendation);
        } catch (err) {
          console.warn('Could not save to Firebase:', err);
        }
      }
      
      setShowCareRecommendation(false);
      setCareRecommendationForm({
        petId: '',
        ownerId: '',
        title: '',
        description: '',
        priority: 'normal'
      });
      setSuccessMessage('Care recommendation sent successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to send recommendation');
    }
  };

  const getHealthTrendsData = () => {
    // Calculate health trends from patient records
    const trends = {
      totalRecords: patientRecords.length,
      byType: {},
      byMonth: {},
      commonConditions: {}
    };
    
    patientRecords.forEach(record => {
      // By type
      trends.byType[record.type] = (trends.byType[record.type] || 0) + 1;
      
      // By month
      const month = new Date(record.date).toLocaleString('default', { month: 'short' });
      trends.byMonth[month] = (trends.byMonth[month] || 0) + 1;
      
      // Common conditions (from description)
      if (record.description) {
        const conditions = ['vaccination', 'checkup', 'surgery', 'injury', 'illness', 'dental'];
        conditions.forEach(condition => {
          if (record.description.toLowerCase().includes(condition)) {
            trends.commonConditions[condition] = (trends.commonConditions[condition] || 0) + 1;
          }
        });
      }
    });
    
    return trends;
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
                maxWidth: '100%',
                gridTemplateRows: 'auto auto'
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
                    {appointments.filter(a => {
                      const appointmentDate = new Date(a.date);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      appointmentDate.setHours(0, 0, 0, 0);
                      return appointmentDate > today;
                    }).length}
                  </div>
                  <div style={{ fontSize: '13px', color: '#6B7280', fontWeight: '500' }}>
                    Upcoming
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
                    {patientRecords.length}
                  </div>
                  <div style={{ fontSize: '13px', color: '#6B7280', fontWeight: '500' }}>
                    Patient Records
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
                    <div 
                      key={appointment.id} 
                      onClick={() => handleAppointmentClick(appointment)}
                      style={{ 
                        backgroundColor: 'white', 
                        borderRadius: '12px', 
                        padding: '16px',
                        marginBottom: '12px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        border: '1px solid #F3F4F6',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                      }}
                    >
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
                    <div 
                      key={appointment.id} 
                      onClick={() => handleAppointmentClick(appointment)}
                      style={{ 
                        backgroundColor: 'white', 
                        borderRadius: '12px', 
                        padding: '12px',
                        marginBottom: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        border: '1px solid #F3F4F6',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                      }}
                    >
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
                  <div 
                    key={patient.id} 
                    onClick={() => handlePatientClick(patient)}
                    style={{ 
                      backgroundColor: '#F9FAFB', 
                      borderRadius: '12px', 
                      padding: '12px',
                      marginBottom: '8px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                    }}
                  >
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

            {/* Patient Records Widget */}
            <div style={{ padding: '0 16px', marginTop: '24px', marginBottom: '24px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1F2937', margin: 0 }}>
                  Patient Records
                </h3>
                <button
                  onClick={() => setShowPatientRecordForm(true)}
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
                  + Add Record
                </button>
              </div>

              <div style={{ 
                backgroundColor: 'white', 
                borderRadius: '12px', 
                padding: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid #F3F4F6',
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                {patientRecords.slice(0, 5).length === 0 ? (
                  <p style={{ color: '#6B7280', margin: 0, fontSize: '14px', textAlign: 'center' }}>
                    No patient records yet
                  </p>
                ) : (
                  patientRecords.slice(0, 5).map(record => (
                    <div key={record.id} style={{
                      padding: '12px',
                      marginBottom: '8px',
                      backgroundColor: '#F9FAFB',
                      borderRadius: '8px',
                      border: '1px solid #E5E7EB'
                    }}>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1F2937', marginBottom: '4px' }}>
                        {record.title}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>
                        {record.petName} • {new Date(record.date).toLocaleDateString()} • {record.type}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Pet Health Trends Analytics */}
            <div style={{ padding: '0 16px', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1F2937', marginBottom: '12px' }}>
                Pet Health Trends Analytics
              </h3>
              <div style={{ 
                backgroundColor: 'white', 
                borderRadius: '12px', 
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid #F3F4F6'
              }}>
                {(() => {
                  const trends = getHealthTrendsData();
                  return (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#F7931E' }}>{trends.totalRecords}</div>
                          <div style={{ fontSize: '12px', color: '#6B7280' }}>Total Records</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#F7931E' }}>{Object.keys(trends.byType).length}</div>
                          <div style={{ fontSize: '12px', color: '#6B7280' }}>Record Types</div>
                        </div>
                      </div>
                      <div style={{ marginTop: '16px' }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#1F2937', marginBottom: '8px' }}>
                          Records by Type:
                        </div>
                        {Object.entries(trends.byType).map(([type, count]) => (
                          <div key={type} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
                            <span style={{ color: '#6B7280', textTransform: 'capitalize' }}>{type}:</span>
                            <span style={{ color: '#1F2937', fontWeight: '600' }}>{count}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Educational Resources */}
            <div style={{ padding: '0 16px', marginBottom: '24px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1F2937', margin: 0 }}>
                  Educational Resources
                </h3>
                <button
                  onClick={() => setShowEducationalResource(true)}
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
                  + Upload
                </button>
              </div>

              <div style={{ 
                backgroundColor: 'white', 
                borderRadius: '12px', 
                padding: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid #F3F4F6'
              }}>
                {educationalResources.length === 0 ? (
                  <p style={{ color: '#6B7280', margin: 0, fontSize: '14px', textAlign: 'center' }}>
                    No educational resources uploaded yet
                  </p>
                ) : (
                  educationalResources.slice(0, 3).map(resource => (
                    <div key={resource.id} style={{
                      padding: '12px',
                      marginBottom: '8px',
                      backgroundColor: '#F9FAFB',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#1F2937' }}>{resource.title}</div>
                        <div style={{ fontSize: '12px', color: '#6B7280' }}>{resource.type} • {resource.uploadDate}</div>
                      </div>
                      <button
                        onClick={() => window.open(resource.url, '_blank')}
                        style={{
                          backgroundColor: '#F7931E',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        View
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Care Recommendations */}
            <div style={{ padding: '0 16px', marginBottom: '24px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1F2937', margin: 0 }}>
                  Care Recommendations
                </h3>
                <button
                  onClick={() => setShowCareRecommendation(true)}
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
                  + Send
                </button>
              </div>

              <div style={{ 
                backgroundColor: 'white', 
                borderRadius: '12px', 
                padding: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid #F3F4F6',
                textAlign: 'center'
              }}>
                <p style={{ color: '#6B7280', margin: 0, fontSize: '14px' }}>
                  Send care recommendations directly to pet owners
                </p>
              </div>
            </div>
        </>

        {/* Appointment Detail Modal */}
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
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#1F2937' }}>
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <strong style={{ color: '#6B7280', fontSize: '12px' }}>Pet:</strong>
                  <div style={{ color: '#1F2937', fontSize: '14px', marginTop: '4px' }}>{selectedAppointment.petName}</div>
                </div>
                <div>
                  <strong style={{ color: '#6B7280', fontSize: '12px' }}>Owner:</strong>
                  <div style={{ color: '#1F2937', fontSize: '14px', marginTop: '4px' }}>{selectedAppointment.ownerName}</div>
                </div>
                <div>
                  <strong style={{ color: '#6B7280', fontSize: '12px' }}>Date & Time:</strong>
                  <div style={{ color: '#1F2937', fontSize: '14px', marginTop: '4px' }}>
                    {new Date(selectedAppointment.date).toLocaleDateString()} at {selectedAppointment.time}
                  </div>
                </div>
                <div>
                  <strong style={{ color: '#6B7280', fontSize: '12px' }}>Purpose:</strong>
                  <div style={{ color: '#1F2937', fontSize: '14px', marginTop: '4px' }}>{selectedAppointment.purpose}</div>
                </div>
                {selectedAppointment.notes && (
                  <div>
                    <strong style={{ color: '#6B7280', fontSize: '12px' }}>Notes:</strong>
                    <div style={{ color: '#1F2937', fontSize: '14px', marginTop: '4px' }}>{selectedAppointment.notes}</div>
                  </div>
                )}
                <div>
                  <strong style={{ color: '#6B7280', fontSize: '12px' }}>Status:</strong>
                  <div style={{ 
                    display: 'inline-block',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: selectedAppointment.status === 'confirmed' ? '#D1FAE5' : selectedAppointment.status === 'pending' ? '#FEF3C7' : '#FEE2E2',
                    color: selectedAppointment.status === 'confirmed' ? '#065F46' : selectedAppointment.status === 'pending' ? '#92400E' : '#991B1B',
                    marginTop: '4px'
                  }}>
                    {selectedAppointment.status || 'Pending'}
                  </div>
                </div>
              </div>

              {/* Add Notes Section */}
              <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '16px' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1F2937', marginBottom: '8px' }}>
                  Add Notes
                </div>
                <textarea
                  placeholder="Add notes about this appointment..."
                  value={appointmentNotes[selectedAppointment.id] || ''}
                  onChange={(e) => setAppointmentNotes(prev => ({ ...prev, [selectedAppointment.id]: e.target.value }))}
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    fontSize: '14px',
                    resize: 'vertical',
                    marginBottom: '12px'
                  }}
                />
                <button
                  onClick={() => {
                    if (appointmentNotes[selectedAppointment.id]) {
                      handleAddAppointmentNote(selectedAppointment.id, appointmentNotes[selectedAppointment.id]);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#F7931E',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Save Notes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Patient Detail Modal */}
        {selectedPatient && (
          <div 
            onClick={() => setSelectedPatient(null)}
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
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#1F2937' }}>
                  Patient Details
                </h3>
                <button
                  onClick={() => setSelectedPatient(null)}
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <strong style={{ color: '#6B7280', fontSize: '12px' }}>Name:</strong>
                  <div style={{ color: '#1F2937', fontSize: '14px', marginTop: '4px' }}>{selectedPatient.name}</div>
                </div>
                <div>
                  <strong style={{ color: '#6B7280', fontSize: '12px' }}>Breed:</strong>
                  <div style={{ color: '#1F2937', fontSize: '14px', marginTop: '4px' }}>{selectedPatient.breed}</div>
                </div>
                <div>
                  <strong style={{ color: '#6B7280', fontSize: '12px' }}>Age:</strong>
                  <div style={{ color: '#1F2937', fontSize: '14px', marginTop: '4px' }}>{selectedPatient.age} years</div>
                </div>
                <div>
                  <strong style={{ color: '#6B7280', fontSize: '12px' }}>Gender:</strong>
                  <div style={{ color: '#1F2937', fontSize: '14px', marginTop: '4px' }}>{selectedPatient.gender}</div>
                </div>
                <div>
                  <strong style={{ color: '#6B7280', fontSize: '12px' }}>Weight:</strong>
                  <div style={{ color: '#1F2937', fontSize: '14px', marginTop: '4px' }}>{selectedPatient.weight}</div>
                </div>
                <div>
                  <strong style={{ color: '#6B7280', fontSize: '12px' }}>Owner:</strong>
                  <div style={{ color: '#1F2937', fontSize: '14px', marginTop: '4px' }}>{selectedPatient.ownerName}</div>
                </div>
                {selectedPatient.lastVisit && (
                  <div>
                    <strong style={{ color: '#6B7280', fontSize: '12px' }}>Last Visit:</strong>
                    <div style={{ color: '#1F2937', fontSize: '14px', marginTop: '4px' }}>
                      {new Date(selectedPatient.lastVisit).toLocaleDateString()}
                    </div>
                  </div>
                )}
                {selectedPatient.nextVisit && (
                  <div>
                    <strong style={{ color: '#6B7280', fontSize: '12px' }}>Next Visit:</strong>
                    <div style={{ color: '#1F2937', fontSize: '14px', marginTop: '4px' }}>
                      {new Date(selectedPatient.nextVisit).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>

              {/* Patient Records */}
              <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '16px' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1F2937', marginBottom: '12px' }}>
                  Medical Records
                </div>
                {patientRecords.filter(r => r.petId === selectedPatient.id).length === 0 ? (
                  <p style={{ color: '#6B7280', fontSize: '13px', margin: 0 }}>No medical records yet</p>
                ) : (
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {patientRecords.filter(r => r.petId === selectedPatient.id).slice(0, 5).map(record => (
                      <div key={record.id} style={{
                        padding: '10px',
                        marginBottom: '8px',
                        backgroundColor: '#F9FAFB',
                        borderRadius: '8px',
                        border: '1px solid #E5E7EB'
                      }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#1F2937' }}>{record.title}</div>
                        <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>
                          {new Date(record.date).toLocaleDateString()} • {record.type}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Patient Record Form Modal */}
        {showPatientRecordForm && (
          <div 
            onClick={() => {
              setShowPatientRecordForm(false);
              setPatientRecordForm({
                petId: '',
                title: '',
                doctor: '',
                date: '',
                type: 'checkup',
                description: ''
              });
            }}
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
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 'bold', color: '#1F2937' }}>
                Add Patient Record
              </h3>
              <form onSubmit={handleCreatePatientRecord}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Pet *
                  </label>
                  <select
                    name="petId"
                    value={patientRecordForm.petId}
                    onChange={(e) => setPatientRecordForm(prev => ({ ...prev, petId: e.target.value }))}
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
                    {patients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name} ({patient.breed})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={patientRecordForm.title}
                    onChange={(e) => setPatientRecordForm(prev => ({ ...prev, title: e.target.value }))}
                    required
                    placeholder="e.g., Annual Checkup"
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
                    Doctor *
                  </label>
                  <input
                    type="text"
                    name="doctor"
                    value={patientRecordForm.doctor}
                    onChange={(e) => setPatientRecordForm(prev => ({ ...prev, doctor: e.target.value }))}
                    required
                    placeholder="Doctor name"
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
                    Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={patientRecordForm.date}
                    onChange={(e) => setPatientRecordForm(prev => ({ ...prev, date: e.target.value }))}
                    required
                    max={new Date().toISOString().split('T')[0]}
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
                    Type *
                  </label>
                  <select
                    name="type"
                    value={patientRecordForm.type}
                    onChange={(e) => setPatientRecordForm(prev => ({ ...prev, type: e.target.value }))}
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
                    <option value="checkup">Checkup</option>
                    <option value="vaccination">Vaccination</option>
                    <option value="surgery">Surgery</option>
                    <option value="treatment">Treatment</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={patientRecordForm.description}
                    onChange={(e) => setPatientRecordForm(prev => ({ ...prev, description: e.target.value }))}
                    required
                    placeholder="Record details..."
                    rows="4"
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

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPatientRecordForm(false);
                      setPatientRecordForm({
                        petId: '',
                        title: '',
                        doctor: '',
                        date: '',
                        type: 'checkup',
                        description: ''
                      });
                    }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      backgroundColor: '#f0f0f0',
                      color: '#333',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: '10px',
                      backgroundColor: '#F7931E',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Create Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Educational Resource Upload Modal */}
        {showEducationalResource && (
          <div 
            onClick={() => setShowEducationalResource(false)}
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
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
              }}
            >
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 'bold', color: '#1F2937' }}>
                Upload Educational Resource
              </h3>
              <div style={{ 
                border: '2px dashed #D1D5DB',
                borderRadius: '8px',
                padding: '20px',
                textAlign: 'center',
                marginBottom: '16px'
              }}>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      handleUploadEducationalResource(file);
                    }
                  }}
                  disabled={uploadingResource}
                  style={{ display: 'none' }}
                  id="resource-upload"
                />
                <label
                  htmlFor="resource-upload"
                  style={{
                    cursor: uploadingResource ? 'not-allowed' : 'pointer',
                    display: 'block'
                  }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📄</div>
                  <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '4px' }}>
                    {uploadingResource ? 'Uploading...' : 'Click to upload or drag and drop'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#9CA3AF' }}>
                    PDF, DOC, DOCX (max 10MB)
                  </div>
                </label>
              </div>
              <button
                onClick={() => setShowEducationalResource(false)}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#f0f0f0',
                  color: '#333',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Care Recommendation Modal */}
        {showCareRecommendation && (
          <div 
            onClick={() => {
              setShowCareRecommendation(false);
              setCareRecommendationForm({
                petId: '',
                ownerId: '',
                title: '',
                description: '',
                priority: 'normal'
              });
            }}
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
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 'bold', color: '#1F2937' }}>
                Send Care Recommendation
              </h3>
              <form onSubmit={handleSendCareRecommendation}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Pet *
                  </label>
                  <select
                    name="petId"
                    value={careRecommendationForm.petId}
                    onChange={(e) => {
                      const pet = patients.find(p => p.id === e.target.value);
                      setCareRecommendationForm(prev => ({ 
                        ...prev, 
                        petId: e.target.value,
                        ownerId: pet?.ownerId || ''
                      }));
                    }}
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
                    {patients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name} ({patient.breed})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={careRecommendationForm.title}
                    onChange={(e) => setCareRecommendationForm(prev => ({ ...prev, title: e.target.value }))}
                    required
                    placeholder="e.g., Post-Surgery Care Instructions"
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
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={careRecommendationForm.description}
                    onChange={(e) => setCareRecommendationForm(prev => ({ ...prev, description: e.target.value }))}
                    required
                    placeholder="Detailed care instructions for the pet owner..."
                    rows="5"
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
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={careRecommendationForm.priority}
                    onChange={(e) => setCareRecommendationForm(prev => ({ ...prev, priority: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #D1D5DB',
                      fontSize: '14px',
                      backgroundColor: 'white'
                    }}
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCareRecommendation(false);
                      setCareRecommendationForm({
                        petId: '',
                        ownerId: '',
                        title: '',
                        description: '',
                        priority: 'normal'
                      });
                    }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      backgroundColor: '#f0f0f0',
                      color: '#333',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: '10px',
                      backgroundColor: '#F7931E',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Send
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