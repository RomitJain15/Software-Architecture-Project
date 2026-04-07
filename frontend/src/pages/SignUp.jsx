import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import './SignUp.css';

function SignUp({ onSignIn }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!formData.username || !formData.email) {
      setError('All fields are required');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        name: formData.username,
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      });

      const { token, user } = response.data;
      if (onSignIn) {
        onSignIn(token, user);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-box">
        <div className="signup-header">
          <div className="signup-logo">📚</div>
          <h1 className="signup-h1">StudyHub</h1>
          <p className="signup-tagline">Learn. Share. Grow.</p>
        </div>
        <h2>Create Your Account</h2>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Full Name</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="toggle-visibility"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <svg className="toggle-visibility-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2.5 12C4.3 8.2 7.8 5.8 12 5.8c4.2 0 7.7 2.4 9.5 6.2-1.8 3.8-5.3 6.2-9.5 6.2-4.2 0-7.7-2.4-9.5-6.2Z" />
                    <circle cx="12" cy="12" r="3.2" />
                  </svg>
                ) : (
                  <svg className="toggle-visibility-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 11.5c2.5 3.7 5.8 5.5 8 5.5s5.5-1.8 8-5.5" />
                    <path d="M7.3 15.2l-.8 1.5" />
                    <path d="M10.1 16.2l-.2 1.7" />
                    <path d="M13.9 16.2l.2 1.7" />
                    <path d="M16.7 15.2l.8 1.5" />
                  </svg>
                )}
                <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
              </button>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="password-field">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="toggle-visibility"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                aria-pressed={showConfirmPassword}
              >
                {showConfirmPassword ? (
                  <svg className="toggle-visibility-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2.5 12C4.3 8.2 7.8 5.8 12 5.8c4.2 0 7.7 2.4 9.5 6.2-1.8 3.8-5.3 6.2-9.5 6.2-4.2 0-7.7-2.4-9.5-6.2Z" />
                    <circle cx="12" cy="12" r="3.2" />
                  </svg>
                ) : (
                  <svg className="toggle-visibility-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 11.5c2.5 3.7 5.8 5.5 8 5.5s5.5-1.8 8-5.5" />
                    <path d="M7.3 15.2l-.8 1.5" />
                    <path d="M10.1 16.2l-.2 1.7" />
                    <path d="M13.9 16.2l.2 1.7" />
                    <path d="M16.7 15.2l.8 1.5" />
                  </svg>
                )}
                <span className="sr-only">{showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}</span>
              </button>
            </div>
          </div>
          <button type="submit" className="signup-btn" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>
        <div className="signin-link">
          Already have an account? <Link to="/signin">Sign In here</Link>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
