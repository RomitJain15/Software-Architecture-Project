import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './SignIn.css';

function SignIn({ onSignIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:8080/api/auth/login', {
        email,
        password
      });

      const { token, user } = response.data;
      console.log('Received user data:', user);
      onSignIn(token, user);
      const normalizedRole = user?.role ? user.role.toUpperCase() : '';
      navigate(normalizedRole === 'ADMIN' || normalizedRole === 'ROLE_ADMIN' ? '/admin' : '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signin-container">
      <div className="signin-box">
        <div className="signin-header">
          <div className="signin-logo">📚</div>
          <h1 className="signin-h1">StudyHub</h1>
          <p className="signin-tagline">Learn. Share. Grow.</p>
        </div>
        <h2>Welcome Back</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
          <button type="submit" className="signin-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div className="signup-link">
          Don't have an account? <Link to="/signup">Sign Up here</Link>
        </div>
      </div>
    </div>
  );
}

export default SignIn;
