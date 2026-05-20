import React, { useState } from 'react';
import { 
  ShieldPlus, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Loader2, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { authService } from '../../services/api';
import './UserManagement.css';

const UserManagement = () => {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    password2: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // States to prevent browser autofill on page load
  const [usernameReadOnly, setUsernameReadOnly] = useState(true);
  const [passwordReadOnly, setPasswordReadOnly] = useState(true);
  const [confirmPasswordReadOnly, setConfirmPasswordReadOnly] = useState(true);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.password2) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setSubmitting(true);
    try {
      await authService.register(form);
      setSuccess(`User ${form.username} created successfully!`);
      setForm({
        first_name: '',
        last_name: '',
        username: '',
        email: '',
        password: '',
        password2: '',
      });
      // Reset read-only states
      setUsernameReadOnly(true);
      setPasswordReadOnly(true);
      setConfirmPasswordReadOnly(true);
    } catch (err) {
      const data = err?.response?.data;
      setError(data?.detail || 'Unable to create user. Username or email might already exist.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="user-mgmt-container">
      <div className="mgmt-content">
        <div className="creation-card card">
          <div className="card-header">
            <ShieldPlus size={22} className="text-primary" />
            <h2>New User Registration</h2>
          </div>

          {error && (
            <div className="alert error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert success">
              <CheckCircle2 size={18} />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mgmt-form" autoComplete="off">
            {/* Dummy fields to absorb browser autofill */}
            <input
              type="text"
              name="prevent_autofill_username"
              style={{ opacity: 0, position: 'absolute', height: 0, width: 0, zIndex: -1 }}
              tabIndex="-1"
              readOnly
            />
            <input
              type="password"
              name="prevent_autofill_password"
              style={{ opacity: 0, position: 'absolute', height: 0, width: 0, zIndex: -1 }}
              tabIndex="-1"
              readOnly
            />

            <div className="form-grid">
              <div className="form-group">
                <label>First Name</label>
                <div className="input-with-icon">
                  <User size={16} className="field-icon" />
                  <input
                    type="text"
                    name="first_name"
                    placeholder="First Name"
                    value={form.first_name}
                    onChange={handleChange}
                    required
                    autoComplete="off"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <div className="input-with-icon">
                  <User size={16} className="field-icon" />
                  <input
                    type="text"
                    name="last_name"
                    placeholder="Last Name"
                    value={form.last_name}
                    onChange={handleChange}
                    required
                    autoComplete="off"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Username</label>
                <div className="input-with-icon">
                  <User size={16} className="field-icon" />
                  <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={form.username}
                    onChange={handleChange}
                    required
                    autoComplete="new-username"
                    readOnly={usernameReadOnly}
                    onFocus={() => setUsernameReadOnly(false)}
                    onClick={() => setUsernameReadOnly(false)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <div className="input-with-icon">
                  <Mail size={16} className="field-icon" />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    autoComplete="off"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Password</label>
                <div className="input-with-icon">
                  <Lock size={16} className="field-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
                    readOnly={passwordReadOnly}
                    onFocus={() => setPasswordReadOnly(false)}
                    onClick={() => setPasswordReadOnly(false)}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>Confirm Password</label>
                <div className="input-with-icon">
                  <Lock size={16} className="field-icon" />
                  <input
                    type={showPassword2 ? 'text' : 'password'}
                    name="password2"
                    placeholder="Confirm Password"
                    value={form.password2}
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
                    readOnly={confirmPasswordReadOnly}
                    onFocus={() => setConfirmPasswordReadOnly(false)}
                    onClick={() => setConfirmPasswordReadOnly(false)}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword2(!showPassword2)}
                    tabIndex="-1"
                  >
                    {showPassword2 ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 size={18} className="spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    Create Administrator
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="mgmt-info-panel">
          <div className="info-card card">
            <h3>Admin Privileges</h3>
            <p>New users created here will have administrative access to the Dialysis Center Management Portal.</p>
            <ul className="privilege-list">
              <li>Manage patients and medical records</li>
              <li>Schedule and log dialysis sessions</li>
              <li>Track staff attendance and roster</li>
              <li>Manage inventory and billing</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
