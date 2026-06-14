import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';

export default function ScanAccountsManager({ eventId }: { eventId: string }) {
  const { showToast } = useToast();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [form, setForm] = useState({ username: '', pin: '', assignedLocation: '' });

  useEffect(() => {
    fetchAccounts();
  }, [eventId]);

  const fetchAccounts = async () => {
    const { data } = await supabase.from('scan_accounts').select('*').eq('event_id', eventId);
    if (data) setAccounts(data);
    setIsLoading(false);
  };

  const deriveKey = async (pin: string): Promise<{ pinHash: string; pinSalt: string }> => {
    const enc = new TextEncoder();
    const pinBuffer = enc.encode(pin);
    const keyMaterial = await crypto.subtle.importKey(
      "raw", pinBuffer, "PBKDF2", false, ["deriveBits"]
    );
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const derivedBits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt: salt, iterations: 600000, hash: "SHA-256" },
      keyMaterial,
      256
    );
    const hashHex = btoa(String.fromCharCode(...new Uint8Array(derivedBits)));
    const saltHex = btoa(String.fromCharCode(...salt));
    return { pinHash: hashHex, pinSalt: saltHex };
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { pinHash, pinSalt } = await deriveKey(form.pin);
    const { error } = await supabase.from('scan_accounts').insert([{
      id: crypto.randomUUID(),
      event_id: eventId,
      username: form.username,
      pin_hash: pinHash,
      pin_salt: pinSalt,
      assigned_location: form.assignedLocation,
      active: true
    }]);

    if (error) showToast("Error: " + error.message, 'error');
    else {
      showToast("Account created", "success");
      setForm({ username: '', pin: '', assignedLocation: '' });
      fetchAccounts();
    }
  };

  const deactivate = async (id: string) => {
    await supabase.from('scan_accounts').update({ active: false }).eq('id', id);
    fetchAccounts();
  };

  const reactivate = async (id: string) => {
    await supabase.from('scan_accounts').update({ active: true }).eq('id', id);
    fetchAccounts();
  };

  const remove = async (id: string) => {
    await supabase.from('scan_accounts').delete().eq('id', id);
    fetchAccounts();
  };

  if (isLoading) return <div className="glass-panel" style={{ padding: '24px' }}>Loading Scan Accounts...</div>;

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <h3>Scan Accounts</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
        Manage scanning crew accounts for your event.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
        {accounts.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No scan accounts added yet.</p> : accounts.map((acc: any) => (
          <div key={acc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
            <div>
              <strong style={{ display: 'block', marginBottom: '4px' }}>{acc.username}</strong>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Gate: {acc.assigned_location || 'None'} | Status: {acc.active ? <span style={{ color: '#10b981' }}>Active</span> : <span style={{ color: '#ef4444' }}>Inactive</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {acc.active ? (
                <button onClick={() => deactivate(acc.id)} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.8rem', borderColor: '#f59e0b', color: '#f59e0b' }}>Deactivate</button>
              ) : (
                <button onClick={() => reactivate(acc.id)} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.8rem', borderColor: '#10b981', color: '#10b981' }}>Reactivate</button>
              )}
              <button onClick={() => remove(acc.id)} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.8rem', borderColor: '#ef4444', color: '#ef4444' }}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      <h4 style={{ marginTop: '16px', marginBottom: '16px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>Add Scan Account</h4>
      <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <input required type="text" placeholder="Username (e.g. crew1)" className="input-field" value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
        <div style={{ display: 'flex', gap: '12px' }}>
          <input required type="password" placeholder="PIN" className="input-field" value={form.pin} onChange={e => setForm({...form, pin: e.target.value})} />
          <input type="text" placeholder="Location (e.g. Main Gate)" className="input-field" value={form.assignedLocation} onChange={e => setForm({...form, assignedLocation: e.target.value})} />
        </div>
        <button type="submit" className="btn-secondary" style={{ marginTop: '8px' }}>+ Add Account</button>
      </form>
    </div>
  );
}
