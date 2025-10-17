import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../api/firebase';
import { collection, doc, getDocs, getDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { logoutUser } from '../../api/authService';
import { getDummyUsers } from '../../api/dummyData';
import BottomNavigation from '../common/BottomNavigation';

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const user = auth?.currentUser || null;

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    loadUsers();
  }, [navigate, user]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(usersQuery);
      
      const usersData = [];
      querySnapshot.forEach((doc) => {
        const userData = { id: doc.id, ...doc.data() };
        usersData.push(userData);
      });

      setUsers(usersData);
    } catch (err) {
      console.error('Error loading users, using dummy data:', err);
      // Use dummy data as fallback
      setUsers(getDummyUsers());
    } finally {
      setLoading(false);
    }
  };

  const handleApproveVet = async (userId) => {
    try {
      setError(null);
      await updateDoc(doc(db, 'users', userId), {
        status: 'approved',
        approvedAt: new Date().toISOString(),
        approvedBy: user.uid
      });
      
      // Update local state
      setUsers(users.map(u => 
        u.id === userId ? { ...u, status: 'approved', approvedAt: new Date().toISOString() } : u
      ));
    } catch (err) {
      console.error('Error approving vet:', err);
      setError(err.message || 'Failed to approve veterinarian');
    }
  };

  const handleDenyVet = async (userId) => {
    try {
      setError(null);
      await updateDoc(doc(db, 'users', userId), {
        status: 'denied',
        deniedAt: new Date().toISOString(),
        deniedBy: user.uid
      });
      
      // Update local state
      setUsers(users.map(u => 
        u.id === userId ? { ...u, status: 'denied', deniedAt: new Date().toISOString() } : u
      ));
    } catch (err) {
      console.error('Error denying vet:', err);
      setError(err.message || 'Failed to deny veterinarian');
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleUpdateUser = async (updatedData) => {
    try {
      setError(null);
      await updateDoc(doc(db, 'users', selectedUser.id), updatedData);
      
      // Update local state
      setUsers(users.map(u => 
        u.id === selectedUser.id ? { ...u, ...updatedData } : u
      ));
      
      setShowEditModal(false);
      setSelectedUser(null);
    } catch (err) {
      console.error('Error updating user:', err);
      setError(err.message || 'Failed to update user');
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

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'pending' && user.status === 'pending') ||
      (statusFilter === 'approved' && user.status === 'approved') ||
      (statusFilter === 'denied' && user.status === 'denied') ||
      (statusFilter === 'active' && (!user.status || user.status === 'approved'));
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getStatusBadge = (user) => {
    if (user.role === 'Vet' || user.role === 'Veterinarian') {
      if (user.status === 'pending') {
        return (
          <div className="status-badge pending">
            <span className="status-dot"></span>
            Pending Approval
          </div>
        );
      } else if (user.status === 'approved') {
        return (
          <div className="status-badge approved">
            <span className="status-icon">🛡️</span>
            Veterinarian
          </div>
        );
      } else if (user.status === 'denied') {
        return (
          <div className="status-badge denied">
            <span className="status-dot"></span>
            Denied
          </div>
        );
      }
    }
    return null;
  };

  const getRoleDisplay = (user) => {
    if (user.role === 'Vet' || user.role === 'Veterinarian') {
      return getStatusBadge(user);
    }
    return <span className="role-text">{user.role}</span>;
  };

  const getProfileImage = (user) => {
    // Generate consistent profile images based on name
    const colors = ['#4F46E5', '#059669', '#DC2626', '#D97706', '#7C3AED', '#DB2777'];
    const colorIndex = user.name?.charCodeAt(0) % colors.length || 0;
    const initials = user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
    
    return (
      <div 
        className="profile-image" 
        style={{ backgroundColor: colors[colorIndex] }}
      >
        {initials}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="screen-container">
        <div className="mobile-phone-frame">
          <div className="mobile-screen">
            <div className="screen-content">
              <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading users...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-container">
      <div className="mobile-phone-frame">
        <div className="mobile-screen">
          <div className="screen-content">
            {/* Header */}
            <div className="page-header">
              <button 
                className="back-button"
                onClick={() => navigate('/admin/dashboard')}
              >
                ←
              </button>
              <h1 className="page-title">User Management</h1>
            </div>


            {/* Search and Filters */}
            <div className="filters-section">
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              
              <div className="filter-buttons">
                <button
                  className={`filter-btn ${roleFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setRoleFilter('all')}
                >
                  All Roles
                </button>
                <button
                  className={`filter-btn ${roleFilter === 'PetOwner' ? 'active' : ''}`}
                  onClick={() => setRoleFilter('PetOwner')}
                >
                  Pet Owners
                </button>
                <button
                  className={`filter-btn ${roleFilter === 'Vet' ? 'active' : ''}`}
                  onClick={() => setRoleFilter('Vet')}
                >
                  Veterinarians
                </button>
              </div>

              <div className="status-filters">
                <button
                  className={`status-filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('all')}
                >
                  All
                </button>
                <button
                  className={`status-filter-btn ${statusFilter === 'pending' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('pending')}
                >
                  Pending
                </button>
                <button
                  className={`status-filter-btn ${statusFilter === 'approved' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('approved')}
                >
                  Approved
                </button>
              </div>
            </div>

            {/* Users List */}
            <div className="users-list">
              {filteredUsers.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">👥</div>
                  <h3>No users found</h3>
                  <p>Try adjusting your search or filters</p>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div key={user.id} className="user-card">
                    <div className="user-info">
                      {getProfileImage(user)}
                      <div className="user-details">
                        <h3 className="user-name">{user.name || 'Unknown User'}</h3>
                        {getRoleDisplay(user)}
                      </div>
                    </div>
                    
                    <div className="user-actions">
                      {(user.role === 'Vet' || user.role === 'Veterinarian') && user.status === 'pending' ? (
                        <div className="approval-buttons">
                          <button
                            className="approve-btn"
                            onClick={() => handleApproveVet(user.id)}
                          >
                            <span className="btn-icon">✓</span>
                            Approve
                          </button>
                          <button
                            className="deny-btn"
                            onClick={() => handleDenyVet(user.id)}
                          >
                            <span className="btn-icon">✕</span>
                            Deny
                          </button>
                        </div>
                      ) : (
                        <button
                          className="edit-btn"
                          onClick={() => handleEditUser(user)}
                        >
                          ✏️
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Edit User Modal */}
            {showEditModal && selectedUser && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <div className="modal-header">
                    <h3>Edit User</h3>
                    <button 
                      className="close-btn"
                      onClick={() => setShowEditModal(false)}
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="modal-body">
                    <div className="form-group">
                      <label>Name</label>
                      <input
                        type="text"
                        defaultValue={selectedUser.name}
                        onChange={(e) => setSelectedUser({...selectedUser, name: e.target.value})}
                        className="form-input"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        defaultValue={selectedUser.email}
                        onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
                        className="form-input"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Role</label>
                      <select
                        defaultValue={selectedUser.role}
                        onChange={(e) => setSelectedUser({...selectedUser, role: e.target.value})}
                        className="form-select"
                      >
                        <option value="PetOwner">Pet Owner</option>
                        <option value="Vet">Veterinarian</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="modal-footer">
                    <button
                      className="btn btn-secondary"
                      onClick={() => setShowEditModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleUpdateUser({
                        name: selectedUser.name,
                        email: selectedUser.email,
                        role: selectedUser.role
                      })}
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <BottomNavigation 
            currentPath="/admin/users" 
            userRole="admin"
            onLogout={handleLogout}
          />
        </div>
      </div>
    </div>
  );
}
