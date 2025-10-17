import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../../api/firebase';
import { collection, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import { logoutUser } from '../../api/authService';
import { fetchWeather } from '../../api/weatherService';
import { getDummyPets, getDummyAppointments, getDummyWeatherData, getDummyNotifications, getDummyPetMilestones } from '../../api/dummyData';
import BottomNavigation from '../common/BottomNavigation';

export default function OwnerHome() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [pets, setPets] = useState([]);
  const [weather, setWeather] = useState(null);
  const [petCount, setPetCount] = useState(0);
  const [upcomingAppointment, setUpcomingAppointment] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [petMilestones, setPetMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const user = auth?.currentUser || null;

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    const loadUserData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to fetch user data with proper error handling
        let userData = {};
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          userData = userDocSnap.exists() ? userDocSnap.data() : {};
        } catch (err) {
          console.warn('Could not fetch user data:', err.message);
          // Continue with default data
        }

        // Set name with fallback
        const fetchedName = userData.name || user.displayName || user.email?.split('@')[0] || 'Guest';
        setProfile({ ...userData, name: fetchedName });

        // Set city and persist if missing (with error handling)
        let cityToUse = userData.city || 'Toronto';
        try {
          if (!userData.city) {
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, { city: cityToUse, updatedAt: new Date().toISOString() });
          }
        } catch (err) {
          console.warn('Could not update user city:', err.message);
          // Continue with default city
        }

        // Fetch weather with fallback
        try {
          const weatherData = await fetchWeather(cityToUse);
          setWeather(weatherData);
        } catch (err) {
          console.warn('Could not fetch weather:', err.message);
          // Use fallback weather data
          setWeather({
            weather: [{ main: 'Sunny' }],
            main: { temp: 28 }
          });
        }

        // Fetch pets with error handling
        try {
          const petsSnap = await getDocs(collection(db, 'pets'));
          const userPets = petsSnap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(p => p.ownerID === user.uid);
          setPets(userPets);
          setPetCount(userPets.length);
        } catch (err) {
          console.warn('Could not fetch pets, using dummy data:', err.message);
          // Use dummy data as fallback
          const dummyPets = getDummyPets();
          setPets(dummyPets);
          setPetCount(dummyPets.length);
        }

        // Fetch appointments with error handling
        try {
          const appointmentsSnap = await getDocs(collection(db, 'appointments'));
          const now = new Date();
          const userAppointments = appointmentsSnap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(a => a.ownerID === user.uid && new Date(a.date) >= now && a.status === 'confirmed')
            .sort((a, b) => new Date(a.date) - new Date(b.date));

          setUpcomingAppointment(userAppointments.length > 0 ? userAppointments[0] : null);
        } catch (err) {
          console.warn('Could not fetch appointments, using dummy data:', err.message);
          // Use dummy data as fallback
          const dummyAppointments = getDummyAppointments();
          const upcomingAppointments = dummyAppointments
            .filter(apt => apt.status === 'confirmed' || apt.status === 'pending')
            .sort((a, b) => new Date(a.date) - new Date(b.date));
          setUpcomingAppointment(upcomingAppointments[0] || null);
        }

        // Load dummy notifications and milestones
        setNotifications(getDummyNotifications());
        setPetMilestones(getDummyPetMilestones());

      } catch (err) {
        console.error("Unexpected error loading user data:", err);
        setError('Unable to load some data. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [navigate, user]);

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
                <div style={{ position: 'relative' }}>
                  <div style={{ fontSize: '20px', color: '#6B7280' }}>🔔</div>
                  <div style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#F7931E'
                  }}></div>
                </div>
              </div>
              <div style={{ padding: 20, textAlign: 'center' }}>
                <p>Loading dashboard...</p>
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
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: '20px', color: '#6B7280' }}>🔔</div>
            <div style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#F7931E'
            }}></div>
          </div>
        </div>

        {/* Welcome Section */}
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '18px', color: '#6B7280', margin: '0 0 8px 0' }}>
            Hello{profile?.name ? `, ${profile.name}` : ''}!
          </h2>
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
                {petCount}
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
                {upcomingAppointment ? 1 : 0}
              </div>
              <div style={{ fontSize: '13px', color: '#6B7280', fontWeight: '500' }}>
                Upcoming
              </div>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div style={{ padding: '0 16px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1F2937', marginBottom: '16px' }}>
            Notifications
          </h3>
          
          {notifications.slice(0, 3).map((notification) => (
            <div key={notification.id} style={{ 
              backgroundColor: 'white', 
              borderRadius: '12px', 
              padding: '16px',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              border: '1px solid #F3F4F6'
            }}>
              <div style={{ fontSize: '24px', color: '#F7931E' }}>{notification.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#1F2937', marginBottom: '2px' }}>
                  {notification.title}
                </div>
                <div style={{ fontSize: '13px', color: '#6B7280' }}>
                  {notification.message}
                </div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>
                  {notification.timestamp}
                </div>
              </div>
            </div>
          ))}
          
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '12px', 
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            border: '1px solid #F3F4F6'
          }}>
            <div style={{ fontSize: '24px', color: '#F7931E' }}>💊</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#1F2937', marginBottom: '2px' }}>
                Medication Reminder
              </div>
              <div style={{ fontSize: '13px', color: '#6B7280' }}>
                Give your pets their vitamins at 8 PM
              </div>
            </div>
          </div>
        </div>

        {/* Weather Section */}
        <div style={{ padding: '0 16px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1F2937', marginBottom: '16px' }}>
            Weather-based Reminders
          </h3>
          
          <div style={{ 
            backgroundColor: '#EFF6FF', 
            borderRadius: '12px', 
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            border: '1px solid #BFDBFE',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <div style={{ fontSize: '24px', color: '#3B82F6' }}>☀️</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#1F2937', marginBottom: '2px' }}>
                {weather ? `${weather.weather[0].main}: ${Math.round(weather.main.temp)}°C` : 'Sunny Day: 28°C'}
              </div>
              <div style={{ fontSize: '13px', color: '#6B7280' }}>
                Perfect for a walk! Don't forget water for your furry friend.
              </div>
            </div>
          </div>
        </div>

        {/* Pet Milestones */}
        <div style={{ padding: '0 16px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1F2937', marginBottom: '16px' }}>
            Pet Milestones
          </h3>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '12px',
            maxWidth: '100%'
          }}>
            {petMilestones.slice(0, 2).map((milestone) => (
              <div key={milestone.id} style={{ 
                backgroundColor: 'white', 
                borderRadius: '12px', 
                padding: '16px',
                textAlign: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                border: '1px solid #F3F4F6',
                minHeight: '120px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                <div style={{ position: 'relative', marginBottom: '12px' }}>
                  <div style={{ 
                    width: '48px', 
                    height: '48px', 
                    borderRadius: '50%', 
                    backgroundColor: '#F7931E',
                    margin: '0 auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '20px'
                  }}>
                    {milestone.petName === 'Buddy' ? '🐕' : '🐱'}
                  </div>
                  <div style={{
                    position: 'absolute',
                    bottom: '-2px',
                    right: '8px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: '#F7931E',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    color: 'white',
                    border: '2px solid white'
                  }}>
                    {milestone.icon}
                  </div>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1F2937', marginBottom: '4px' }}>
                  {milestone.title}
                </div>
                <div style={{ fontSize: '11px', color: '#6B7280' }}>
                  {new Date(milestone.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        </div>

          </div>
          <BottomNavigation userType="owner" />
        </div>
      </div>
    </div>
  );
}