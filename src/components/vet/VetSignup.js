import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../../api/authService';

export default function VetSignup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [clinic, setClinic] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
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
      // Register user with Vet role and additional data
      const additionalData = {
        clinicName: clinic || '', // Use 'clinic' state variable, not 'clinicName'
        licenseNumber: licenseNumber || ''
      };
      const newUser = await registerUser(email, password, 'Vet', name, additionalData);
      console.log('✅ Vet account created successfully for:', newUser.email);
      
      // Note: Vet accounts are pending approval, so they won't be able to login until approved
      // Navigate to vet dashboard after successful registration (they'll see pending status)
      navigate('/vet/dashboard', { state: { isNewUser: true, userName: name, pendingApproval: true } });
    } catch (err) {
      console.error('Registration error:', err);
      // Provide user-friendly error messages
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please sign in instead.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please use a stronger password.');
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
                  <p className="welcome-text">Join as a Veterinarian</p>
                </div>

                {/* Signup Form */}
                <div className="login-form" style={{ width: '100%' }}>
                  <form onSubmit={handleSubmit} className="form-container" style={{ marginBottom: '24px' }}>
                    <div className="form-header">
                      <h2 className="form-title">Create Vet Account</h2>
                      <p className="form-subtitle">Sign up to manage your veterinary practice</p>
                      <div style={{ 
                        marginTop: '12px', 
                        padding: '10px', 
                        backgroundColor: '#FEF3C7', 
                        borderRadius: '8px',
                        fontSize: '13px',
                        color: '#92400E'
                      }}>
                        ⚠️ Your account will be pending approval. An administrator will review and approve your account.
                      </div>
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
                        Use any personal or professional email address
                      </small>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Clinic Name (Optional)</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Enter your clinic name"
                        value={clinic}
                        onChange={(e) => setClinic(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">License Number (Optional)</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Enter your veterinary license number"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                      />
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
                        {isLoading ? 'Creating Account...' : 'Create Vet Account'}
                      </button>
                    </div>
                  </form>

                  <div className="register-section">
                    <p className="register-text">
                      Already have an account?
                      <Link to="/" className="register-link"> Sign in here</Link>
                    </p>
                    <p className="register-text" style={{ marginTop: '8px' }}>
                      Not a veterinarian?
                      <Link to="/signup" className="register-link"> Sign up as Pet Owner</Link>
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

