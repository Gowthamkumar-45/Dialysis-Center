import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Stethoscope, Mail, Lock, Eye, EyeOff, ShieldCheck, HeartPulse, Activity, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.password) {
      setError('Please enter your username and password.');
      return;
    }
    setSubmitting(true);
    try {
      await login(form.username.trim(), form.password);
      navigate('/', { replace: true });
    } catch (err) {
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.non_field_errors?.[0] ||
        'Unable to sign in. Please check your credentials.';
      setError(detail);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        {/* Left brand panel */}
        <aside className="auth-brand">
          <div className="brand-overlay" />
          <div className="brand-content">
            <div className="brand-logo">
              <Stethoscope size={26} />
            </div>
            <h1 className="brand-title">DialyCare Portal</h1>
            <p className="brand-tagline">
              A modern operations platform for dialysis centers — patients, machines, sessions, and billing in one place.
            </p>

            <ul className="brand-features">
              <li>
                <span className="feat-ico"><HeartPulse size={18} /></span>
                <div>
                  <strong>Patient-centered care</strong>
                  <p>360° patient records and treatment history at a glance.</p>
                </div>
              </li>
              <li>
                <span className="feat-ico"><Activity size={18} /></span>
                <div>
                  <strong>Real-time scheduling</strong>
                  <p>Plan sessions and track machine utilization with ease.</p>
                </div>
              </li>
              <li>
                <span className="feat-ico"><ShieldCheck size={18} /></span>
                <div>
                  <strong>Secure & compliant</strong>
                  <p>Role-based access and audit-ready record keeping.</p>
                </div>
              </li>
            </ul>
          </div>
          <div className="brand-footer">© {new Date().getFullYear()} DialyCare Health Systems</div>
        </aside>

        {/* Right form panel */}
        <section className="auth-form-panel">
          <div className="auth-form-wrap">
            <div className="auth-form-header">
              <div className="mobile-logo">
                <Stethoscope size={20} />
              </div>
              <h2>Welcome back</h2>
              <p>Sign in to continue to your clinic dashboard.</p>
            </div>

            {error && (
              <div className="auth-alert">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              <label className="auth-field">
                <span className="auth-label">Username or email</span>
                <div className="auth-input-wrap">
                  <Mail size={16} className="auth-input-icon" />
                  <input
                    type="text"
                    name="username"
                    autoComplete="username"
                    placeholder="you@clinic.com"
                    value={form.username}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                </div>
              </label>

              <label className="auth-field">
                <span className="auth-label">Password</span>
                <div className="auth-input-wrap">
                  <Lock size={16} className="auth-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    className="auth-eye"
                    onClick={() => setShowPassword((s) => !s)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              <div className="auth-row">
                <label className="auth-check">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
                <button type="button" className="auth-link-btn">Forgot password?</button>
              </div>

              <button type="submit" className="auth-submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 size={18} className="spin" />
                    Signing in…
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            <div className="auth-divider"><span>or</span></div>

            <p className="auth-footer-text">
              Don't have an account?{' '}
              <Link to="/register" className="auth-link">Sign up</Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;
