import React, { useState } from 'react';
import './Login.css';

const Login = ({ users = [], onLoginSuccess, onAdminLogin, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');

  const handleLogin = (e) => {
    e.preventDefault();

    // 1. Superadmin hardcoded check
    if (role === 'admin') {
      if (email === 'admin@foodieyou.com' && password === 'admin123') {
        if (typeof onAdminLogin === 'function') onAdminLogin();
      } else {
        alert('Invalid Superadmin Credentials! (Use admin@foodieyou.com / admin123)');
      }
      return;
    }

    // 2. Student / Staff validation against registered users state
    const foundUser = users.find(u => u.email === email && u.role === role);

    if (!foundUser) {
      alert('Account not found! Please check your email or click "Sign Up" below.');
      return;
    }

    if (foundUser.password !== password) {
      alert('Incorrect password! Please try again.');
      return;
    }

    if (foundUser.status !== 'approved') {
      alert('⏳ Your account is still pending Superadmin approval. Please wait for the admin to approve your request.');
      return;
    }

    // 3. Approved & authenticated successfully
    if (typeof onLoginSuccess === 'function') {
      onLoginSuccess(role, foundUser);
    }
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
          <p>Skip the physical line, order ahead, and savor your favorite campus bites instantly!</p>
        </div>

        <div className="foodie-form-side">
          <div className="form-header">
            <h2>Welcome Back</h2>
            <p>Sign in to your FoodieYou dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="foodie-login-form">
            <div className="form-group">
              <label>Select Role</label>
              <div className="role-switch-container">
                {['student', 'staff', 'admin'].map((r) => (
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
              <label>{role === 'admin' ? 'Superadmin Email' : 'Campus Email'}</label>
              <input 
                type="text" 
                placeholder={role === 'admin' ? 'admin@foodieyou.com' : 'e.g. student@jiet.ac.in'} 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>

            <button type="submit" className="foodie-submit-btn">
              {role === 'admin' ? 'Access Superadmin Panel 👑' : 'Sign In to FoodieYou 🚀'}
            </button>

            <div className="switch-auth-mode">
              <span>Don't have an account?</span>
              <button type="button" onClick={onSwitchToRegister} className="text-link-btn">
                Sign Up
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;