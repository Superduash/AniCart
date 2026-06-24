import React, { useState, useEffect } from 'react';
import { useTitle } from '../../hooks/useTitle';
import { useUI } from '../../contexts/UIContext';
import apiClient from '../../api/client';

export default function AdminCreatorsPage() {
  useTitle('Creator Applications | Admin');
  const { addToast } = useUI();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // C2 Fix: creatorRoutes is mounted at '/' not '/creator/', so correct path is /admin/creator-requests
    apiClient.get('/admin/creator-requests')
      .then(r => {
        const data = r.data?.data?.users || r.data?.data || [];
        setUsers(Array.isArray(data) ? data : []);
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const handlePromote = async (id) => {
    try {
      // C2 Fix: correct URL
      await apiClient.put(`/admin/creator-requests/${id}/approve`);
      setUsers(u => u.filter(x => x._id !== id));
      addToast('Creator application approved!', 'success');
    } catch {
      addToast('Failed to approve application.', 'error');
    }
  };

  // C2 Fix: added reject handler which was completely missing
  const handleReject = async (id) => {
    try {
      await apiClient.put(`/admin/creator-requests/${id}/reject`);
      setUsers(u => u.filter(x => x._id !== id));
      addToast('Creator application rejected.', 'info');
    } catch {
      addToast('Failed to reject application.', 'error');
    }
  };

  return (
    <div>
      <h1 style={{ fontFamily: 'Orbitron, monospace', fontWeight: 800, fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', color: 'var(--color-pink)', marginBottom: 6 }}>
        Creator Applications
      </h1>
      <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 'var(--text-sm)', letterSpacing: 2, textTransform: 'uppercase', color: 'var(--color-text-3)', marginBottom: 32 }}>
        Review pending creator requests
      </div>

      {loading ? (
        <div style={{ color: 'var(--color-text-3)' }}>Loading applications...</div>
      ) : users.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
          {/* H2 Fix: corrected empty state message */}
          No pending creator applications.
        </div>
      ) : (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)', fontFamily: 'Rajdhani, sans-serif', fontSize: 'var(--text-xs)', letterSpacing: 1, textTransform: 'uppercase', color: 'var(--color-text-3)' }}>
                <th style={{ padding: '16px 20px', fontWeight: 600 }}>Applicant</th>
                <th style={{ padding: '16px 20px', fontWeight: 600 }}>Email</th>
                <th style={{ padding: '16px 20px', fontWeight: 600 }}>Portfolio</th>
                <th style={{ padding: '16px 20px', fontWeight: 600 }}>Applied</th>
                <th style={{ padding: '16px 20px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '16px 20px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--color-text)' }}>
                    {u.name}
                  </td>
                  <td style={{ padding: '16px 20px', fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-sm)', color: 'var(--color-text-2)' }}>
                    {u.email}
                  </td>
                  <td style={{ padding: '16px 20px', fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-sm)', color: 'var(--color-text-3)' }}>
                    {u.creatorRequest?.portfolioLink ? (
                      <a href={u.creatorRequest.portfolioLink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent)', textDecoration: 'none' }}>
                        View →
                      </a>
                    ) : '—'}
                  </td>
                  <td style={{ padding: '16px 20px', fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-sm)', color: 'var(--color-text-3)' }}>
                    {u.creatorRequest?.requestedAt
                      ? new Date(u.creatorRequest.requestedAt).toLocaleDateString()
                      : new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => handlePromote(u._id)}
                      style={{ background: 'var(--color-pink)', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'var(--text-xs)' }}
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleReject(u._id)}
                      style={{ background: 'var(--color-surface-2)', color: 'var(--color-error)', border: '1px solid var(--color-error)', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'var(--text-xs)' }}
                    >
                      ✕ Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
