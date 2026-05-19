import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Stethoscope, Mail, Lock, User, Eye, EyeOff, ShieldCheck, HeartPulse, Activity, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    password2: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
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
      await register(form);
      navigate('/', { replace: true });
    } catch (err) {
      const data = err?.response?.data;
      const firstError =
        data?.detail ||
        (data && typeof data === 'object'
          ? Object.values(data).flat()[0]
          : null) ||
        'Unable to create account. Please try again.';
      setError(String(firstError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <aside className="auth-brand">
          <div className="brand-overlay" />
          <div className="brand-content">
            <div className="brand-logo">
              <Stethoscope size={26} />
            </div>
            <h1 className="brand-title">Join DialyCare</h1>
            <p className="brand-tagline">
              Create your account and start managing your dialysis center with confidence.
            </p>

            <ul className="brand-features">
              <li>
                <span className="feat-ico"><HeartPulse size={18} /></span>
                <div>
                  <strong>Holistic care</strong>
                  <p>Manage every aspect of patient treatment in one platform.</p>
                </div>
              </li>
              <li>
                <span className="feat-ico"><Activity size={18} /></span>
                <div>
                  <strong>Smart insights</strong>
                  <p>Live dashboards and reports for operations and quality.</p>
                </div>
              </li>
              <li>
                <span className="feat-ico"><ShieldCheck size={18} /></span>
                <div>
                  <strong>Enterprise security</strong>
                  <p>Encrypted credentials and token-based authentication.</p>
                </div>
              </li>
            </ul>
          </div>
          <div className="brand-footer">© {new Date().getFullYear()} DialyCare Health Systems</div>
        </aside>

        <section className="auth-form-panel">
          <div className="auth-form-wrap">
            <div className="auth-form-header">
              <div className="mobile-logo">
                <Stethoscope size={20} />
              </div>
              <h2>Create your account</h2>
              <p>Get started in less than a minute.</p>
            </div>

            {error && (
              <div className="auth-alert">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              <div className="auth-grid-2">
                <label className="auth-field">
                  <span className="auth-label">First name</span>
                  <div className="auth-input-wrap">
                    <User size={16} className="auth-input-icon" />
                    <input
                      type="text"
                      name="first_name"
                      placeholder="Jane"
                      value={form.first_name}
                      onChange={handleChange}
                      disabled={submitting}
                    />
                  </div>
                </label>
                <label className="auth-field">
                  <span className="auth-label">Last name</span>
                  <div className="auth-input-wrap">
                    <User size={16} className="auth-input-icon" />
                    <input
                      type="text"
                      name="last_name"
                      placeholder="Doe"
                      value={form.last_name}
                      onChange={handleChange}
                      disabled={submitting}
                    />
                  </div>
                </label>
              </div>

              <label className="auth-field">
                <span className="auth-label">Username</span>
                <div className="auth-input-wrap">
                  <User size={16} className="auth-input-icon" />
                  <input
                    type="text"
                    name="username"
                    autoComplete="username"
                    placeholder="janedoe"
                    value={form.username}
                    onChange={handleChange}
                    required
                    disabled={submitting}
                  />
                </div>
              </label>

              <label className="auth-field">
                <span className="auth-label">Email</span>
                <div className="auth-input-wrap">
                  <Mail size={16} className="auth-input-icon" />
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="jane@clinic.com"
                    value={form.email}
                    onChange={handleChange}
                    required
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
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    value={form.password}
                    onChange={handleChange}
                    required
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

              <label className="auth-field">
                <span className="auth-label">Confirm password</span>
                <div className="auth-input-wrap">
                  <Lock size={16} className="auth-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password2"
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    value={form.password2}
                    onChange={handleChange}
                    required
                    disabled={submitting}
                  />
                </div>
              </label>

              <button type="submit" className="auth-submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 size={18} className="spin" />
                    Creating account…
                  </>
                ) : (
                  'Create account'
                )}
              </button>
            </form>

            <div className="auth-divider"><span>or</span></div>

            <p className="auth-footer-text">
              Already have an account?{' '}
              <Link to="/login" className="auth-link">Sign in</Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Register;
