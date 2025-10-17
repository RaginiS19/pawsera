import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Schedule = () => {
  const navigate = useNavigate();
  const [appointments] = useState([
    {
      id: 1,
      petName: 'Buddy',
      vetName: 'Dr. Smith',
      date: '2024-02-15',
      time: '10:00 AM',
      type: 'Checkup',
      status: 'Confirmed'
    },
    {
      id: 2,
      petName: 'Whiskers',
      vetName: 'Dr. Johnson',
      date: '2024-02-20',
      time: '2:30 PM',
      type: 'Vaccination',
      status: 'Pending'
    }
  ]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="screen-container">
      <div className="screen-content">
        {/* Header */}
        <div className="header-section">
          <button 
            className="back-button" 
            onClick={() => navigate('/home')}
            aria-label="Go back to home"
          >
            ← Back
          </button>
          <div className="brand-section">
            <div className="logo-container">
              <svg 
                className="paw-logo" 
                viewBox="0 0 24 24" 
                fill="currentColor"
                aria-label="Pawsera logo"
              >
                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M19 9H14V4H19V9Z" />
              </svg>
              <h1 className="brand-name">Pawsera</h1>
            </div>
          </div>
          <button 
            className="logout-button" 
            onClick={handleLogout}
            aria-label="Logout"
          >
            Logout
          </button>
        </div>

        {/* Page Title */}
        <div className="page-header">
          <h2 className="page-title">Appointments</h2>
          <button className="add-button" aria-label="Schedule new appointment">
            + New Appointment
          </button>
        </div>

        {/* Appointments List */}
        <div className="appointments-list">
          {appointments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19,3H18V1H16V3H8V1H6V3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M19,19H5V8H19V19Z" />
                </svg>
              </div>
              <h3 className="empty-title">No appointments scheduled</h3>
              <p className="empty-description">Schedule your first appointment</p>
              <button className="primary-button">Schedule Appointment</button>
            </div>
          ) : (
            appointments.map(appointment => (
              <div key={appointment.id} className="appointment-card">
                <div className="appointment-header">
                  <div className="appointment-date">
                    <span className="date-day">{new Date(appointment.date).getDate()}</span>
                    <span className="date-month">{new Date(appointment.date).toLocaleDateString('en', { month: 'short' })}</span>
                  </div>
                  <div className="appointment-info">
                    <h3 className="appointment-pet">{appointment.petName}</h3>
                    <p className="appointment-vet">with {appointment.vetName}</p>
                    <p className="appointment-time">{appointment.time}</p>
                  </div>
                  <div className={`appointment-status ${appointment.status.toLowerCase()}`}>
                    {appointment.status}
                  </div>
                </div>
                <div className="appointment-details">
                  <p className="appointment-type">{appointment.type}</p>
                  <div className="appointment-actions">
                    <button className="action-button" aria-label={`View details for ${appointment.petName}'s appointment`}>
                      View Details
                    </button>
                    <button className="action-button secondary" aria-label={`Reschedule ${appointment.petName}'s appointment`}>
                      Reschedule
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Schedule;
