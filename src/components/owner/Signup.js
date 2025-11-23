import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../../api/authService';
import '../../styles/styles.css';

export default function OwnerSignup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (!agreeToTerms) {
      setError('Please agree to the terms and conditions');
      setIsLoading(false);
      return;
    }

    try {
      // Register user with correct parameter order: email, password, role, name
      const newUser = await registerUser(email, password, 'PetOwner', name);
      console.log('✅ Account created successfully for:', newUser.email);
      // Navigate to home after successful registration
      // Pass a flag to show welcome message
      navigate('/home', { state: { isNewUser: true, userName: name } });
    } catch (err) {
      console.error('Registration error:', err);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
      
      // Provide user-friendly error messages
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please sign in instead.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please use a stronger password.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized. Please contact support.');
        console.error('⚠️ Domain not authorized in Firebase. Add your Vercel domain to Firebase Authorized Domains.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Email/password authentication is not enabled. Please contact support.');
        console.error('⚠️ Email/Password authentication not enabled in Firebase Console.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection and try again.');
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="screen-container">
      <div className="mobile-phone-frame">
        <div className="mobile-screen" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="screen-content" style={{ 
            overflowY: 'auto', 
            overflowX: 'hidden', 
            flex: 1, 
            WebkitOverflowScrolling: 'touch',
            paddingBottom: '80px',
            height: '100%',
            maxHeight: '100%'
          }}>
            <div 
              className="login-container signup-form" 
              style={{ 
                padding: '20px',
                display: 'flex',
                justifyContent: 'center'
              }}
            >
              <div className="login-content" style={{ 
                width: '100%', 
                maxWidth: '420px', 
                paddingBottom: '100px',
                minHeight: 'auto'
              }}>
                {/* Brand Section */}
                <div className="brand-section">
                  <div className="logo-container">
                    <div className="paw-logo">🐾</div>
                    <h1 className="brand-name">Pawsera</h1>
                  </div>
                  <p className="welcome-text">Join our pet care community</p>
                </div>

                {/* Signup Form */}
                <div className="login-form" style={{ width: '100%' }}>
                  <form onSubmit={handleSubmit} className="form-container" style={{ marginBottom: '24px' }}>
                    <div className="form-header">
                      <h2 className="form-title">Create Account</h2>
                      <p className="form-subtitle">Sign up to start managing your pet's health</p>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Enter your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <input
                        type="email"
                        className="form-input"
                        placeholder="your.email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                      <small style={{ 
                        fontSize: '12px', 
                        color: '#6B7280', 
                        marginTop: '4px', 
                        display: 'block' 
                      }}>
                        Use any personal email address (Gmail, Yahoo, Outlook, etc.)
                      </small>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Password</label>
                      <div className="password-container" style={{ position: 'relative' }}>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          className="form-input"
                          placeholder="Create a password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          style={{ paddingRight: '45px' }}
                        />
                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            fontSize: '18px',
                            color: '#6B7280',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {showPassword ? '👁️' : '👁️‍🗨️'}
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Confirm Password</label>
                      <div className="password-container" style={{ position: 'relative' }}>
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          className="form-input"
                          placeholder="Confirm your password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          style={{ paddingRight: '45px' }}
                        />
                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            fontSize: '18px',
                            color: '#6B7280',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="checkbox-container">
                        <input
                          type="checkbox"
                          checked={agreeToTerms}
                          onChange={(e) => setAgreeToTerms(e.target.checked)}
                          required
                        />
                        <span className="checkmark"></span>
                        I agree to the <Link to="/terms" className="terms-link">Terms and Conditions</Link>
                      </label>
                    </div>

                    {error && (
                      <div className="error-message">
                        <span className="error-icon">⚠️</span>
                        {error}
                      </div>
                    )}

                    <div style={{ marginTop: '24px', marginBottom: '16px' }}>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="btn btn-primary"
                        style={{
                          width: '100%',
                          padding: '14px 24px',
                          fontSize: '16px',
                          fontWeight: '600',
                          borderRadius: '8px',
                          cursor: isLoading ? 'not-allowed' : 'pointer',
                          display: 'block',
                          position: 'relative',
                          zIndex: 10,
                          backgroundColor: '#F7931E',
                          color: 'white',
                          border: 'none',
                          boxShadow: '0 4px 12px rgba(247, 147, 30, 0.3)'
                        }}
                      >
                        {isLoading ? 'Creating Account...' : 'Create Account'}
                      </button>
                    </div>
                  </form>

                  <div className="register-section">
                    <p className="register-text">
                      Already have an account?
                      <Link to="/" className="register-link"> Sign in here</Link>
                    </p>
                    <p className="register-text" style={{ marginTop: '8px' }}>
                      Not a pet owner?
                      <Link to="/vet/signup" className="register-link"> Sign up as Veterinarian</Link>
                      {' or '}
                      <Link to="/admin/signup" className="register-link">Sign up as Administrator</Link>
                    </p>
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