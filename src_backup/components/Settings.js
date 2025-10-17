import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    notifications: true,
    emailUpdates: true,
    smsReminders: false,
    darkMode: false
  });

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleSettingChange = (setting) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const settingsOptions = [
    {
      id: 'account',
      title: 'Account',
      subtitle: 'Manage your account settings',
      icon: '👤'
    },
    {
      id: 'notifications',
      title: 'Notifications',
      subtitle: 'Push notifications and alerts',
      icon: '🔔',
      toggle: true,
      value: settings.notifications
    },
    {
      id: 'email',
      title: 'Email Updates',
      subtitle: 'Receive email notifications',
      icon: '📧',
      toggle: true,
      value: settings.emailUpdates
    },
    {
      id: 'sms',
      title: 'SMS Reminders',
      subtitle: 'Text message reminders',
      icon: '📱',
      toggle: true,
      value: settings.smsReminders
    },
    {
      id: 'privacy',
      title: 'Privacy',
      subtitle: 'Data and privacy settings',
      icon: '🔒'
    },
    {
      id: 'help',
      title: 'Help & Support',
      subtitle: 'Get help and contact support',
      icon: '❓'
    },
    {
      id: 'about',
      title: 'About',
      subtitle: 'App version and information',
      icon: 'ℹ️'
    }
  ];

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
          <h2 className="page-title">Settings</h2>
        </div>

        {/* User Profile Section */}
        <div className="profile-section">
          <div className="profile-avatar">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z" />
            </svg>
          </div>
          <div className="profile-info">
            <h3 className="profile-name">John Doe</h3>
            <p className="profile-email">john.doe@example.com</p>
          </div>
          <button className="edit-profile-button" aria-label="Edit profile">
            Edit
          </button>
        </div>

        {/* Settings List */}
        <div className="settings-list">
          {settingsOptions.map(option => (
            <div key={option.id} className="settings-item">
              <div className="settings-content">
                <div className="settings-icon">{option.icon}</div>
                <div className="settings-text">
                  <h3 className="settings-title">{option.title}</h3>
                  <p className="settings-subtitle">{option.subtitle}</p>
                </div>
              </div>
              <div className="settings-action">
                {option.toggle ? (
                  <button
                    className={`toggle-switch ${option.value ? 'active' : ''}`}
                    onClick={() => handleSettingChange(option.id)}
                    aria-label={`Toggle ${option.title}`}
                    aria-pressed={option.value}
                  >
                    <div className="toggle-slider"></div>
                  </button>
                ) : (
                  <svg className="chevron-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" />
                  </svg>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Logout Section */}
        <div className="logout-section">
          <button 
            className="logout-button-large" 
            onClick={handleLogout}
            aria-label="Logout from account"
          >
            <svg className="logout-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16,17V14H9V10H16V7L21,12L16,17M14,2A2,2 0 0,1 16,4V6H14V4H5V20H14V18H16V20A2,2 0 0,1 14,22H5A2,2 0 0,1 3,20V4A2,2 0 0,1 5,2H14Z" />
            </svg>
            Logout
          </button>
        </div>

        {/* App Version */}
        <div className="version-info">
          <p className="version-text">Pawsera v1.0.0</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
