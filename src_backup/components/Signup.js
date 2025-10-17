import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const togglePasswordVisibility = (field) => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Signup attempt:', formData);
      // Navigate to home screen on successful signup
      navigate('/home');
    } catch (error) {
      console.error('Signup error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.name.trim() && formData.email.trim() && 
                     formData.password.trim() && formData.confirmPassword.trim() &&
                     formData.password === formData.confirmPassword;

  return (
    <div className="screen-container">
      <div className="screen-content">
        {/* Header */}
        <div className="header-section">
          <button 
            className="back-button" 
            onClick={() => navigate('/')}
            aria-label="Go back to login"
          >
            ←
          </button>
          <h1 className="page-title">Create Account</h1>
          <div></div>
        </div>

        {/* Welcome Section */}
        <div className="welcome-section">
          <h2 className="welcome-title">Welcome to Pawsera!</h2>
          <p className="welcome-subtitle">Let's get you started.</p>
        </div>

        {/* Signup Form */}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="form-container">
            {/* Name Input */}
            <div className="input-group">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Full Name"
                className={`form-input ${errors.name ? 'error' : ''}`}
                aria-label="Full name"
                aria-describedby={errors.name ? 'name-error' : undefined}
                autoComplete="name"
              />
              {errors.name && (
                <div id="name-error" className="error-message" role="alert">
                  {errors.name}
                </div>
              )}
            </div>

            {/* Email Input */}
            <div className="input-group">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                aria-label="Email address"
                aria-describedby={errors.email ? 'email-error' : undefined}
                autoComplete="email"
              />
              {errors.email && (
                <div id="email-error" className="error-message" role="alert">
                  {errors.email}
                </div>
              )}
            </div>

            {/* Password Input */}
            <div className="input-group">
              <div className="password-container">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Password"
                  className={`form-input password-input ${errors.password ? 'error' : ''}`}
                  aria-label="Password"
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => togglePasswordVisibility('password')}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex="0"
                >
                  {showPassword ? (
                    <svg className="eye-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" />
                    </svg>
                  ) : (
                    <svg className="eye-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.83,9L15,12.16C15,12.11 15,12.05 15,12A3,3 0 0,0 12,9C11.94,9 11.89,9 11.83,9M7.53,9.8L9.08,11.35C9.03,11.56 9,11.77 9,12A3,3 0 0,0 12,15C12.22,15 12.44,14.97 12.65,14.92L14.2,16.47C13.53,16.8 12.79,17 12,17A5,5 0 0,1 7,12C7,11.21 7.2,10.47 7.53,9.8M2,4.27L4.28,6.55L4.73,7C3.08,8.3 1.78,10 1,12C2.73,16.39 7,19.5 12,19.5C13.55,19.5 15.03,19.2 16.38,18.66L16.81,19.08L19.73,22L21,20.73L3.27,3M12,7A5,5 0 0,1 17,12C17,12.64 16.87,13.26 16.64,13.82L18.57,15.75C20.07,14.5 21.27,12.86 22,11C20.27,6.61 16,3.5 12,3.5C10.6,3.5 9.26,3.75 8,4.26L9.45,5.71C10.4,5.25 11.2,5 12,5A7,7 0 0,1 19,12C19,12.8 18.75,13.6 18.29,14.55L20.22,16.48C21.25,15 22,13.06 22,11C20.27,6.61 16,3.5 12,3.5Z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <div id="password-error" className="error-message" role="alert">
                  {errors.password}
                </div>
              )}
            </div>

            {/* Confirm Password Input */}
            <div className="input-group">
              <div className="password-container">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm Password"
                  className={`form-input password-input ${errors.confirmPassword ? 'error' : ''}`}
                  aria-label="Confirm password"
                  aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => togglePasswordVisibility('confirmPassword')}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  tabIndex="0"
                >
                  {showConfirmPassword ? (
                    <svg className="eye-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" />
                    </svg>
                  ) : (
                    <svg className="eye-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.83,9L15,12.16C15,12.11 15,12.05 15,12A3,3 0 0,0 12,9C11.94,9 11.89,9 11.83,9M7.53,9.8L9.08,11.35C9.03,11.56 9,11.77 9,12A3,3 0 0,0 12,15C12.22,15 12.44,14.97 12.65,14.92L14.2,16.47C13.53,16.8 12.79,17 12,17A5,5 0 0,1 7,12C7,11.21 7.2,10.47 7.53,9.8M2,4.27L4.28,6.55L4.73,7C3.08,8.3 1.78,10 1,12C2.73,16.39 7,19.5 12,19.5C13.55,19.5 15.03,19.2 16.38,18.66L16.81,19.08L19.73,22L21,20.73L3.27,3M12,7A5,5 0 0,1 17,12C17,12.64 16.87,13.26 16.64,13.82L18.57,15.75C20.07,14.5 21.27,12.86 22,11C20.27,6.61 16,3.5 12,3.5C10.6,3.5 9.26,3.75 8,4.26L9.45,5.71C10.4,5.25 11.2,5 12,5A7,7 0 0,1 19,12C19,12.8 18.75,13.6 18.29,14.55L20.22,16.48C21.25,15 22,13.06 22,11C20.27,6.61 16,3.5 12,3.5Z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <div id="confirm-password-error" className="error-message" role="alert">
                  {errors.confirmPassword}
                </div>
              )}
            </div>

            {/* Terms and Conditions */}
            <div className="terms-section">
              <label className="terms-checkbox">
                <input type="checkbox" className="terms-input" />
                <span className="terms-text">
                  I agree to the <a href="#" className="terms-link">Terms & Conditions</a> and <a href="#" className="terms-link">Privacy Policy</a> of Pawsera.
                </span>
              </label>
            </div>

            {/* Signup Button */}
            <button
              type="submit"
              className={`auth-button ${!isFormValid || isSubmitting ? 'disabled' : ''}`}
              disabled={!isFormValid || isSubmitting}
              aria-label="Create your account"
            >
              {isSubmitting ? 'Creating Account...' : 'Create My Account'}
            </button>
          </div>
        </form>

        {/* Login Link */}
        <div className="auth-link-section">
          <p className="auth-link-text">
            Already have an account? <button onClick={() => navigate('/')} className="auth-link">Login</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
