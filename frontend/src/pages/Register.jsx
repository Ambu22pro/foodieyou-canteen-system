import React, { useState } from 'react';
import './Register.css';

const Register = ({ onRegisterSubmit, onSwitchToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [submitted, setSubmitted] = useState(false);

  const handleRegister = (e) => {
    e.preventDefault();
    
    // Send user data up to App.jsx state
    if (typeof onRegisterSubmit === 'function') {
      onRegisterSubmit({ name, email, password, role });
    }
    
    setSubmitted(true);
  };

  return (
    <div className="foodie-css-wrapper">
      <div className="fast-food-badge top-left">🍔</div>
      <div className="fast-food-badge top-right">🍟</div>
      <div className="fast-food-badge mid-left">🍕</div>
      <div className="fast-food-badge mid-right">🥤</div>
      <div className="fast-food-badge bottom-left">🌭</div>
      <div className="fast-food-badge bottom-right">🍩</div>

      <div className="foodie-login-container">
        <div className="login-branding-side">
          <div className="foodie-emblem-box">
            <span className="emblem-crown">👑</span>
            <div className="emblem-title">CRAVE</div>
            <div className="emblem-subtitle">FASTER</div>
            <div className="emblem-footer">ANYTIME</div>
          </div>
          <h1>Foodie<span className="highlight">You</span></h1>
          <p>Join the campus food revolution. Register now and get verified by the admin!</p>
        </div>

        <div className="foodie-form-side">
          {submitted ? (
            <div className="success-state-box">
              <span className="success-icon">⏳</span>
              <h2>Registration Pending!</h2>
              <p>Your sign-up request has been sent to the Superadmin. Once approved, you will be able to sign in to your dashboard.</p>
              <button onClick={onSwitchToLogin} className="foodie-submit-btn" style={{ marginTop: '1.5rem' }}>
                Back to Login 🚀
              </button>
            </div>
          ) : (
            <>
              <div className="form-header">
                <h2>Create Account</h2>
                <p>Sign up as a student or campus staff member</p>
              </div>

              <form onSubmit={handleRegister} className="foodie-login-form">
                <div className="form-group">
                  <label>I am a</label>
                  <div className="role-switch-container">
                    {['student', 'staff'].map((r) => (
                      <button
                        type="button"
                        key={r}
                        className={`role-switch-btn ${role === r ? 'active' : ''}`}
                        onClick={() => setRole(r)}
                      >
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    placeholder="Enter your full name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>Campus Email</label>
                  <input 
                    type="email" 
                    placeholder="Enter your campus email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <input 
                    type="password" 
                    placeholder="Create a password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                </div>

                <button type="submit" className="foodie-submit-btn">
                  Submit for Approval 🚀
                </button>

                <div className="switch-auth-mode">
                  <span>Already have an account?</span>
                  <button type="button" onClick={onSwitchToLogin} className="text-link-btn">
                    Sign In
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;