import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function BottomNavigation({ userType = 'owner' }) {
  const navigate = useNavigate();
  const location = useLocation();

  const getNavItems = () => {
    if (userType === 'vet') {
      return [
        { path: '/vet/dashboard', icon: '🏠', label: 'Dashboard' },
        { path: '/vet/scheduling', icon: '📅', label: 'Appointments' },
        { path: '/vet/settings', icon: '⚙️', label: 'Settings' }
      ];
    } else if (userType === 'admin') {
      return [
        { path: '/admin/dashboard', icon: '🏠', label: 'Dashboard' },
        { path: '/admin/appointments', icon: '📅', label: 'Appointments' },
        { path: '/admin/users', icon: '👥', label: 'Users' },
        { path: '/admin/settings', icon: '⚙️', label: 'Settings' }
      ];
    } else {
      // Owner navigation
      return [
        { path: '/home', icon: '🏠', label: 'Dashboard' },
        { path: '/mypets', icon: '🐾', label: 'My Pets' },
        { path: '/schedule', icon: '📅', label: 'Schedule' },
        { path: '/nearbyvets', icon: '🏥', label: 'Vets' },
        { path: '/settings', icon: '⚙️', label: 'Settings' }
      ];
    }
  };

  const navItems = getNavItems();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="bottom-navigation">
      {navItems.map((item) => (
        <button
          key={item.path}
          className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
          onClick={() => handleNavigation(item.path)}
        >
          <div className="nav-icon">{item.icon}</div>
          <div className="nav-label">{item.label}</div>
        </button>
      ))}
    </div>
  );
}
