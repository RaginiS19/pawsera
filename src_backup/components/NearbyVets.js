import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const NearbyVets = () => {
  const navigate = useNavigate();
  const [vets] = useState([
    {
      id: 1,
      name: 'Happy Paws Veterinary Clinic',
      address: '123 Main St, City, State 12345',
      distance: '0.5 miles',
      rating: 4.8,
      phone: '(555) 123-4567',
      hours: 'Mon-Fri: 8AM-6PM',
      services: ['General Care', 'Emergency', 'Surgery']
    },
    {
      id: 2,
      name: 'Animal Care Center',
      address: '456 Oak Ave, City, State 12345',
      distance: '1.2 miles',
      rating: 4.6,
      phone: '(555) 987-6543',
      hours: 'Mon-Sat: 7AM-7PM',
      services: ['General Care', 'Dental', 'Grooming']
    },
    {
      id: 3,
      name: 'Pet Wellness Clinic',
      address: '789 Pine St, City, State 12345',
      distance: '2.1 miles',
      rating: 4.9,
      phone: '(555) 456-7890',
      hours: 'Mon-Fri: 9AM-5PM',
      services: ['Wellness', 'Vaccinations', 'Behavior']
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
          <h2 className="page-title">Nearby Vets</h2>
          <button className="filter-button" aria-label="Filter vets">
            Filter
          </button>
        </div>

        {/* Search Bar */}
        <div className="search-section">
          <div className="search-container">
            <svg className="search-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z" />
            </svg>
            <input 
              type="text" 
              placeholder="Search vets..." 
              className="search-input"
              aria-label="Search for veterinary clinics"
            />
          </div>
        </div>

        {/* Vets List */}
        <div className="vets-list">
          {vets.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z" />
                </svg>
              </div>
              <h3 className="empty-title">No vets found</h3>
              <p className="empty-description">Try adjusting your search or location</p>
            </div>
          ) : (
            vets.map(vet => (
              <div key={vet.id} className="vet-card">
                <div className="vet-header">
                  <div className="vet-info">
                    <h3 className="vet-name">{vet.name}</h3>
                    <p className="vet-address">{vet.address}</p>
                    <div className="vet-meta">
                      <span className="vet-distance">{vet.distance}</span>
                      <span className="vet-rating">★ {vet.rating}</span>
                    </div>
                  </div>
                </div>
                <div className="vet-details">
                  <div className="vet-hours">
                    <span className="hours-label">Hours:</span>
                    <span className="hours-text">{vet.hours}</span>
                  </div>
                  <div className="vet-phone">
                    <span className="phone-label">Phone:</span>
                    <a href={`tel:${vet.phone}`} className="phone-link">{vet.phone}</a>
                  </div>
                  <div className="vet-services">
                    {vet.services.map((service, index) => (
                      <span key={index} className="service-tag">{service}</span>
                    ))}
                  </div>
                </div>
                <div className="vet-actions">
                  <button className="action-button" aria-label={`Call ${vet.name}`}>
                    Call
                  </button>
                  <button className="action-button" aria-label={`Get directions to ${vet.name}`}>
                    Directions
                  </button>
                  <button className="action-button primary" aria-label={`Book appointment with ${vet.name}`}>
                    Book
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NearbyVets;
