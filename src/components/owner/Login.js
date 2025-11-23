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
      if (db) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            userData = { id: userDoc.id, ...userDoc.data() };
            console.log('✅ Found user data by UID:', userData);
          }
        } catch (uidError) {
          console.warn('Could not get user by UID:', uidError);
        }
        
        // If UID lookup failed, try by email
        if (!userData) {
          try {
            userData = await findUserByEmail(email);
            if (userData) {
              console.log('✅ Found user data by email:', userData);
            }
          } catch (emailError) {
            console.warn('Could not get user by email:', emailError);
          }
        }
        
        // If still not found, try to get by email as document ID
        if (!userData && db) {
          try {
            const emailDoc = await getDoc(doc(db, 'users', email));
            if (emailDoc.exists()) {
              userData = { id: emailDoc.id, ...emailDoc.data() };
              console.log('✅ Found user data by email as document ID:', userData);
            }
          } catch (emailDocError) {
            console.warn('Could not get user by email as document ID:', emailDocError);
          }
        }
      }
      
      // If user data still not found, create it on the fly
      // This handles cases where registration succeeded but Firestore save failed
      if (!userData) {
        console.warn('⚠️ User not found in database, attempting to create user data');
        
        // Try to determine role from email or use PetOwner as default
        let userRole = 'PetOwner';
        let userStatus = 'active';
        
        if (email.includes('admin') || email.includes('@admin')) {
          userRole = 'Admin';
          userStatus = 'active';
        } else if (email.includes('vet') || email.includes('@vet')) {
          userRole = 'Vet';
          userStatus = 'pending'; // Vets need approval
        }
        
        userData = { 
          role: userRole, 
          name: currentUser.displayName || email.split('@')[0], 
          email: email,
          status: userStatus,
          userID: currentUser.uid,
          id: currentUser.uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Try to save this to Firestore (but don't fail if it doesn't work)
        if (db) {
          try {
            // Try with UID first
            await setDoc(doc(db, 'users', currentUser.uid), userData);
            console.log('✅ Created user data in Firestore with UID');
          } catch (uidErr) {
            console.warn('Could not save user data with UID, trying email:', uidErr);
            try {
              // Try with email as document ID
              await setDoc(doc(db, 'users', email), userData, { merge: true });
              console.log('✅ Created user data in Firestore with email');
            } catch (emailErr) {
              console.warn('Could not save user data to Firestore:', emailErr);
              console.warn('User can still login, but data will not persist');
            }
          }
        }
        
        console.log('Using created user data:', userData);
      }
      
      console.log('User data:', userData); // Debug log
      console.log('User role:', userData.role); // Debug log
      
      // Route based on role
      const userRole = userData.role || 'PetOwner';
      
      switch (userRole) {
        case 'Admin':
          // Admin users can always login (status should be 'active' but we allow anyway)
          console.log('✅ Admin login successful');
          navigate('/admin/dashboard');
          break;
        case 'Vet':
          // Check if vet account is approved
          if (userData.status && userData.status !== 'approved') {
            throw new Error('Your veterinarian account is pending approval. Please wait for an administrator to approve your account.');
          }
          console.log('✅ Vet login successful');
          navigate('/vet/dashboard');
          break;
        case 'PetOwner':
        case 'Pet Owner': // Handle both variations
          console.log('✅ Pet Owner login successful');
          navigate('/home');
          break;
        default:
          console.warn('Unknown role, defaulting to Pet Owner:', userRole);
          navigate('/home');
      }
    } catch (err) {
      console.error('Login error:', err);
      console.error('Error details:', {
        code: err.code,
        message: err.message,
        email: email
      });
      
      // Handle specific Firebase auth errors
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email. Please sign up first.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address. Please check and try again.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed login attempts. Please try again later.');
      } else if (err.message.includes('permission') || err.message.includes('insufficient')) {
        setError('Unable to access user data. Please check your connection and try again.');
      } else if (err.message.includes('pending approval')) {
        setError(err.message);
      } else if (err.message.includes('Invalid email or password')) {
        setError(err.message);
      } else {
        setError(err.message || 'Login failed. Please try again.');
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
              <Link to="/signup" className="register-link"> Sign up as Pet Owner</Link>
            </p>
            <div style={{ marginTop: '12px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: '#6B7280', margin: '8px 0' }}>
                <Link to="/vet/signup" className="register-link" style={{ fontSize: '14px' }}>
                  Sign up as Veterinarian
                </Link>
                {' • '}
                <Link to="/admin/signup" className="register-link" style={{ fontSize: '14px' }}>
                  Sign up as Administrator
                </Link>
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
