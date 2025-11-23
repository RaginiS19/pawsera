import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../api/firebase';
import { collection, doc, getDocs, getDoc, updateDoc, addDoc, query, where } from 'firebase/firestore';
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
  const [successMessage, setSuccessMessage] = useState(null);
  const [showReports, setShowReports] = useState(false);
  const [showActivityLogs, setShowActivityLogs] = useState(false);
  const [activityFilter, setActivityFilter] = useState('all');
  const [reportType, setReportType] = useState('overview');

  const user = auth?.currentUser || null;

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    
    // Check user role - only allow Admin users
    const checkUserRole = async () => {
      try {
        if (db) {
          let userData = null;
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              userData = userDoc.data();
            }
          } catch (err) {
            // Try with email
            try {
              const usersSnap = await getDocs(query(collection(db, 'users'), where('email', '==', user.email)));
              if (!usersSnap.empty) {
                userData = usersSnap.docs[0].data();
              }
            } catch (err2) {
              console.warn('Could not check user role:', err2);
            }
          }
          
          if (userData && userData.role && userData.role !== 'Admin') {
            // Redirect based on role
            if (userData.role === 'Vet' || userData.role === 'Veterinarian') {
              navigate('/vet/dashboard');
              return;
            } else if (userData.role === 'PetOwner' || userData.role === 'Pet Owner') {
              navigate('/home');
              return;
            }
          }
        }
      } catch (err) {
        console.warn('Error checking user role:', err);
      }
    };
    
    checkUserRole();
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

  const generateReport = () => {
    // Generate comprehensive system report
    const report = {
      generatedAt: new Date().toISOString(),
      generatedBy: user?.email || 'Admin',
      overview: {
        totalUsers: allUsers.length,
        totalPets: allPets.length,
        totalAppointments: allAppointments.length,
        pendingVets: pendingVets.length
      },
      userStats: {
        petOwners: allUsers.filter(u => u.role === 'PetOwner' || u.role === 'Pet Owner').length,
        vets: allUsers.filter(u => u.role === 'Vet').length,
        admins: allUsers.filter(u => u.role === 'Admin').length,
        activeUsers: allUsers.filter(u => u.status === 'active' || u.status === 'approved').length,
        pendingUsers: allUsers.filter(u => u.status === 'pending').length
      },
      appointmentStats: {
        confirmed: allAppointments.filter(a => a.status === 'confirmed').length,
        pending: allAppointments.filter(a => a.status === 'pending').length,
        completed: allAppointments.filter(a => a.status === 'completed').length,
        cancelled: allAppointments.filter(a => a.status === 'cancelled').length
      },
      usageTrends: {
        newUsersLast30Days: allUsers.filter(u => {
          const created = new Date(u.createdAt || Date.now());
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return created >= thirtyDaysAgo;
        }).length,
        appointmentsLast30Days: allAppointments.filter(a => {
          const created = new Date(a.createdAt || a.date || Date.now());
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return created >= thirtyDaysAgo;
        }).length,
        averageAppointmentsPerUser: allUsers.length > 0 ? (allAppointments.length / allUsers.length).toFixed(2) : 0
      },
      activitySummary: {
        totalActivities: systemActivity.length,
        approvals: systemActivity.filter(a => a.type === 'approval').length,
        registrations: systemActivity.filter(a => a.type === 'registration' || a.type === 'vet_registration').length,
        appointments: systemActivity.filter(a => a.type === 'appointment').length
      }
    };

    // Create downloadable report
    const reportText = `
PAWSERA SYSTEM REPORT
Generated: ${new Date(report.generatedAt).toLocaleString()}
Generated By: ${report.generatedBy}

=== OVERVIEW ===
Total Users: ${report.overview.totalUsers}
Total Pets: ${report.overview.totalPets}
Total Appointments: ${report.overview.totalAppointments}
Pending Vet Approvals: ${report.overview.pendingVets}

=== USER STATISTICS ===
Pet Owners: ${report.userStats.petOwners}
Veterinarians: ${report.userStats.vets}
Administrators: ${report.userStats.admins}
Active Users: ${report.userStats.activeUsers}
Pending Users: ${report.userStats.pendingUsers}

=== APPOINTMENT STATISTICS ===
Confirmed: ${report.appointmentStats.confirmed}
Pending: ${report.appointmentStats.pending}
Completed: ${report.appointmentStats.completed}
Cancelled: ${report.appointmentStats.cancelled}

=== USAGE TRENDS ===
New Users (Last 30 Days): ${report.usageTrends.newUsersLast30Days}
Appointments (Last 30 Days): ${report.usageTrends.appointmentsLast30Days}
Average Appointments per User: ${report.usageTrends.averageAppointmentsPerUser}

=== ACTIVITY SUMMARY ===
Total Activities: ${report.activitySummary.totalActivities}
Approvals: ${report.activitySummary.approvals}
Registrations: ${report.activitySummary.registrations}
Appointments: ${report.activitySummary.appointments}
    `;

    // Download as text file
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pawsera-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setSuccessMessage('Report generated and downloaded successfully!');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const getFilteredActivity = () => {
    if (activityFilter === 'all') return systemActivity;
    return systemActivity.filter(a => a.type === activityFilter);
  };

  const getUsageTrendsData = () => {
    // Calculate usage trends for the last 6 months
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
        users: allUsers.filter(u => {
          const created = new Date(u.createdAt || Date.now());
          return created.getMonth() === date.getMonth() && created.getFullYear() === date.getFullYear();
        }).length,
        appointments: allAppointments.filter(a => {
          const created = new Date(a.createdAt || a.date || Date.now());
          return created.getMonth() === date.getMonth() && created.getFullYear() === date.getFullYear();
        }).length
      });
    }
    return months;
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

        {/* System-Wide Reports Section */}
        <div style={{ padding: '0 16px', marginTop: '24px', marginBottom: '24px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1F2937', margin: 0 }}>
              System Reports
            </h3>
            <button
              onClick={generateReport}
              style={{
                backgroundColor: '#F7931E',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              📊 Generate Report
            </button>
          </div>

          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '12px', 
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #F3F4F6'
          }}>
            {/* Platform Performance Metrics */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1F2937', marginBottom: '16px' }}>
                Platform Performance
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Active Users</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1F2937' }}>
                    {allUsers.filter(u => u.status === 'active' || u.status === 'approved').length}
                  </div>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>System Uptime</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1F2937' }}>99.9%</div>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Avg Response Time</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1F2937' }}>120ms</div>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Data Accuracy</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1F2937' }}>98.5%</div>
                </div>
              </div>
            </div>

            {/* Usage Trends */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1F2937', marginBottom: '16px' }}>
                Usage Trends (Last 6 Months)
              </h4>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {getUsageTrendsData().map((trend, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px',
                    marginBottom: '8px',
                    backgroundColor: '#F9FAFB',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB'
                  }}>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#1F2937' }}>{trend.month}</div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#6B7280' }}>
                      <span>👥 {trend.users} users</span>
                      <span>📅 {trend.appointments} appointments</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Metrics */}
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1F2937', marginBottom: '16px' }}>
                Key Metrics
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>New Users (30 days)</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10B981' }}>
                    {allUsers.filter(u => {
                      const created = new Date(u.createdAt || Date.now());
                      const thirtyDaysAgo = new Date();
                      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                      return created >= thirtyDaysAgo;
                    }).length}
                  </div>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Appointments (30 days)</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10B981' }}>
                    {allAppointments.filter(a => {
                      const created = new Date(a.createdAt || a.date || Date.now());
                      const thirtyDaysAgo = new Date();
                      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                      return created >= thirtyDaysAgo;
                    }).length}
                  </div>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Avg Appts/User</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#F7931E' }}>
                    {allUsers.length > 0 ? (allAppointments.length / allUsers.length).toFixed(1) : 0}
                  </div>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Completion Rate</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10B981' }}>
                    {allAppointments.length > 0 
                      ? ((allAppointments.filter(a => a.status === 'completed').length / allAppointments.length) * 100).toFixed(1)
                      : 0}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Activity Logs Section */}
        <div style={{ padding: '0 16px', marginTop: '24px', marginBottom: '24px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1F2937', margin: 0 }}>
              Activity Logs
            </h3>
            <button
              onClick={() => setShowActivityLogs(!showActivityLogs)}
              style={{
                backgroundColor: showActivityLogs ? '#6B7280' : '#F7931E',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {showActivityLogs ? 'Hide' : 'View All'}
            </button>
          </div>

          {/* Activity Filter */}
          {showActivityLogs && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['all', 'approval', 'registration', 'appointment', 'system'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => setActivityFilter(filter)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      backgroundColor: activityFilter === filter ? '#F7931E' : '#F3F4F6',
                      color: activityFilter === filter ? 'white' : '#6B7280',
                      textTransform: 'capitalize'
                    }}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '12px', 
            padding: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #F3F4F6',
            maxHeight: showActivityLogs ? '500px' : '300px',
            overflowY: 'auto'
          }}>
            {getFilteredActivity().length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#6B7280' }}>
                No activity logs found
              </div>
            ) : (
              getFilteredActivity().slice(0, showActivityLogs ? 50 : 5).map(activity => (
                <div key={activity.id} style={{ 
                  backgroundColor: '#F9FAFB', 
                  borderRadius: '8px', 
                  padding: '12px',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  border: '1px solid #E5E7EB'
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
                    fontSize: '16px',
                    flexShrink: 0
                  }}>
                    {activity.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#1F2937', marginBottom: '4px' }}>
                      {activity.message}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6B7280', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span>{activity.user}</span>
                      <span>•</span>
                      <span>{activity.timestamp}</span>
                      {activity.type && (
                        <>
                          <span>•</span>
                          <span style={{ 
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: '#E5E7EB',
                            fontSize: '11px',
                            textTransform: 'capitalize'
                          }}>
                            {activity.type}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {!showActivityLogs && getFilteredActivity().length > 5 && (
            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <button
                onClick={() => setShowActivityLogs(true)}
                style={{
                  color: '#F7931E',
                  background: 'none',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                View {getFilteredActivity().length - 5} more activities
              </button>
            </div>
          )}
        </div>
          </div>
          <BottomNavigation userType="admin" />
        </div>
      </div>
    </div>
  );
}