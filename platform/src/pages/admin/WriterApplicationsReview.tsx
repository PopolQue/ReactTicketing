import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import Modal from '../../components/Modal';

export default function WriterApplicationsReview() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingApp, setRejectingApp] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchApplications = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('writer_applications')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (data) {
      setApplications(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleApprove = async (app: any) => {
    // 1. Mark application as approved
    await supabase.from('writer_applications').update({ status: 'approved' }).eq('id', app.id);
    
    // 2. Create writer profile
    await supabase.from('writer_profiles').insert([{
      id: app.user_id,
      pen_name: app.pen_name,
      bio: app.bio,
      verified: true
    }]);

    fetchApplications();
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingApp) return;

    await supabase.from('writer_applications').update({ 
      status: 'rejected',
      rejection_reason: rejectionReason.trim()
    }).eq('id', rejectingApp.id);
    
    setRejectingApp(null);
    setRejectionReason('');
    fetchApplications();
  };

  if (loading) return <p>Loading applications...</p>;

  return (
    <div>
      <h2 style={{ marginBottom: '24px' }}>Writer Applications</h2>
      
      {applications.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>No pending writer applications right now.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {applications.map(app => (
            <div key={app.id} className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {app.pen_name}
                    <span style={{ fontSize: '0.8rem', color: 'var(--accent)', textTransform: 'uppercase', border: '1px solid var(--accent)', padding: '2px 6px', borderRadius: '4px' }}>
                      Application
                    </span>
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    User ID: <span style={{ fontFamily: 'monospace' }}>{app.user_id}</span>
                  </p>
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => setRejectingApp(app)} 
                    className="btn-secondary" 
                    style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                  >
                    Reject
                  </button>
                  <button 
                    onClick={() => handleApprove(app)} 
                    className="btn-primary"
                    style={{ backgroundColor: '#10b981' }}
                  >
                    Approve & Verify
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', backgroundColor: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px' }}>
                <div>
                  <strong style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Bio</strong>
                  <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.5 }}>{app.bio}</p>
                </div>
                <div>
                  <strong style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Writing Samples</strong>
                  <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.5, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                    {app.samples}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal 
        isOpen={!!rejectingApp} 
        onClose={() => { setRejectingApp(null); setRejectionReason(''); }} 
        title="Reject Writer Application"
      >
        <form onSubmit={handleRejectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Reason for Rejection</label>
            <textarea 
              className="input-field" 
              rows={3}
              required
              value={rejectionReason} 
              onChange={e => setRejectionReason(e.target.value)} 
              placeholder="e.g. Your writing samples did not meet our editorial guidelines."
            />
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button type="button" onClick={() => { setRejectingApp(null); setRejectionReason(''); }} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
            <button type="submit" className="btn-primary" style={{ flex: 1, backgroundColor: '#ef4444' }}>
              Confirm Rejection
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
