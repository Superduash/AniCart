import React, { useState } from 'react';
import { useTitle } from '../../hooks/useTitle';
import { useAuth } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';
import apiClient from '../../api/client';

export default function SettingsPage() {
  useTitle('Settings');
  const { user, updateUser } = useAuth();
  const { addToast } = useUI();
  const [form, setForm] = useState({ name: user?.name || '' });
  const [loading, setLoading] = useState(false);

  // Password form
  const [pwdForm, setPwdForm] = useState({ current: '', new: '', confirm: '' });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    try {
      await apiClient.put('/users/profile', { name: form.name });
      updateUser({ name: form.name });
      addToast('Profile updated successfully', 'success');
    } catch {
      addToast('Failed to update profile', 'error');
    }
    setLoading(false);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!pwdForm.current || !pwdForm.new || !pwdForm.confirm) {
      addToast('Please fill all password fields', 'warning');
      return;
    }
    if (pwdForm.new !== pwdForm.confirm) {
      addToast('New passwords do not match', 'error');
      return;
    }
    if (pwdForm.new.length < 8) {
      addToast('New password must be at least 8 characters', 'warning');
      return;
    }
    setPwdLoading(true);
    try {
      await apiClient.put('/users/password', {
        currentPassword: pwdForm.current,
        newPassword: pwdForm.new
      });
      addToast('Password updated successfully', 'success');
      setPwdForm({ current: '', new: '', confirm: '' });
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update password', 'error');
    }
    setPwdLoading(false);
  };

  return (
    <div>
      <h1 style={{ fontFamily: 'Orbitron, monospace', fontWeight: 800, fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', color: 'var(--color-text)', marginBottom: 32 }}>
        Account Settings
      </h1>

      <div style={{ display: 'grid', gap: 32, maxWidth: 640 }}>
        {/* Profile */}
        <div className="glass-card-flat" style={{ padding: 24 }}>
          <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--color-text)', marginBottom: 20 }}>
            Profile Information
          </h2>
          <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input form-input-no-icon" value={user?.email || ''} disabled style={{ opacity: 0.6 }} />
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', marginTop: 6 }}>Email cannot be changed. Contact support if needed.</div>
            </div>
            <div className="form-group">
              <label className="form-label">Display Name</label>
              <input type="text" className="form-input form-input-no-icon" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} disabled={loading} />
            </div>
            <div>
              <button type="submit" className="btn btn-primary btn-sm" disabled={loading || form.name === user?.name}>
                {loading ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Password */}
        <div className="glass-card-flat" style={{ padding: 24 }}>
          <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--color-text)', marginBottom: 20 }}>
            Security
          </h2>
          <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <div className="form-input-wrapper">
                <input type={showPwd ? 'text' : 'password'} className="form-input form-input-no-icon" value={pwdForm.current} onChange={e => setPwdForm(p => ({ ...p, current: e.target.value }))} disabled={pwdLoading} />
                <button type="button" className="toggle-password" onClick={() => setShowPwd(!showPwd)} tabIndex={-1}>{showPwd ? '◎' : '●'}</button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <div className="form-input-wrapper">
                <input type={showPwd ? 'text' : 'password'} className="form-input form-input-no-icon" value={pwdForm.new} onChange={e => setPwdForm(p => ({ ...p, new: e.target.value }))} disabled={pwdLoading} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <div className="form-input-wrapper">
                <input type={showPwd ? 'text' : 'password'} className="form-input form-input-no-icon" value={pwdForm.confirm} onChange={e => setPwdForm(p => ({ ...p, confirm: e.target.value }))} disabled={pwdLoading} />
              </div>
            </div>
            <div>
              <button type="submit" className="btn btn-secondary btn-sm" disabled={pwdLoading}>
                {pwdLoading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
