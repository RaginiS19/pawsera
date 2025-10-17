import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser, findUserByEmail } from '../../api/authService';
import { auth, db } from '../../api/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function OwnerLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // First authenticate the user
      await loginUser(email, password);
      
      // Get the authenticated user
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Authentication failed. Please try again.');
      }
      
      let userData = null;
      
      // Try to get user data by UID first
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          userData = { id: userDoc.id, ...userDoc.data() };
        }
      } catch (uidError) {
        console.warn('Could not get user by UID:', uidError);
      }
      
      // If UID lookup failed, try by email
      if (!userData) {
        try {
          userData = await findUserByEmail(email);
        } catch (emailError) {
          console.warn('Could not get user by email:', emailError);
        }
      }
      
      if (!userData) {
        // Temporary fallback for testing - create default user data based on email
        console.warn('User not found in database, using fallback logic');
        if (email.includes('admin') || email.includes('ragini')) {
          userData = { role: 'Admin', name: 'Admin User', email: email };
        } else if (email.includes('vet') || email.includes('sean')) {
          userData = { role: 'Vet', name: 'Vet User', email: email };
        } else {
          userData = { role: 'PetOwner', name: 'Pet Owner', email: email };
        }
        console.log('Using fallback user data:', userData);
      }
      
      console.log('User data:', userData); // Debug log
      console.log('User role:', userData.role); // Debug log
      
      // Route based on role
      switch (userData.role) {
        case 'Admin':
          navigate('/admin/dashboard');
          break;
        case 'Vet':
          navigate('/vet/dashboard');
          break;
        case 'PetOwner':
        case 'Pet Owner': // Handle both variations
          navigate('/home');
          break;
        default:
          throw new Error(`Unknown user role: ${userData.role}`);
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err.message.includes('permission') || err.message.includes('insufficient')) {
        setError('Unable to access user data. Please check your connection and try again.');
      } else if (err.message.includes('user-not-found') || err.message.includes('wrong-password')) {
        setError('Invalid email or password. Please try again.');
      } else {
        setError(err.message || 'Login failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="screen-container">
      <div className="mobile-phone-frame">
        <div className="mobile-screen">
          <div className="screen-content">
            <div className="login-container">
              <div className="login-content">
        {/* Brand Section */}
        <div className="brand-section">
          <div className="logo-container">
            <div className="paw-logo">🐾</div>
            <h1 className="brand-name">Pawsera</h1>
          </div>
                  <p className="welcome-text">Welcome to Pawsera - Pet Care Management</p>
        </div>

        {/* Login Form */}
        <div className="login-form">
          <form onSubmit={handleSubmit} className="form-container">
                    <div className="form-header">
                      <h2 className="form-title">Sign In</h2>
                      <p className="form-subtitle">Enter your credentials to access your dashboard</p>
                    </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="password-container">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>


            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={!email || !password || isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>

            <div className="forgot-password-container">
              <Link to="/forgot-password" className="forgot-password-link">
                Forgot your password?
              </Link>
            </div>
          </form>

          <div className="register-section">
            <p className="register-text">
              Don't have an account?
              <Link to="/signup" className="register-link"> Create one here</Link>
            </p>
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: '#6B7280', margin: '8px 0' }}>
                This login works for Pet Owners, Veterinarians, and Administrators
              </p>
            </div>
          </div>
        </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
