import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useReactTicket } from '../../hooks/useReactTicket';
import { ScanAccount } from '../../types/scanAccount.types';
import { ScanAccountService } from '../../services/ScanAccountService';

export const ScanAccountManager: React.FC = () => {
  const { adapter, event } = useReactTicket();
  const accountService = useMemo(() => new ScanAccountService(adapter), [adapter]);

  const [scanAccounts, setScanAccounts] = useState<ScanAccount[]>([]);
  const [newAccount, setNewAccount] = useState({ username: '', pin: '', location: '' });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ username?: string; assignedLocation?: string }>({});
  
  const [resettingAccount, setResettingAccount] = useState<ScanAccount | null>(null);
  const [newPin, setNewPin] = useState('');

  const loadAccounts = useCallback(async () => {
    setScanAccounts(await adapter.listScanAccounts(event.id));
  }, [adapter, event.id]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const createAccount = async () => {
    if (!newAccount.username || !newAccount.pin) return;
    await accountService.createAccount(event.id, newAccount.username, newAccount.pin, newAccount.location);
    await loadAccounts();
    setNewAccount({ username: '', pin: '', location: '' });
  };

  const updateAccount = async (account: ScanAccount) => {
    const updatedAccount = { ...account, ...editValues };
    await adapter.saveScanAccount(event.id, updatedAccount);
    setEditingId(null);
    setEditValues({});
    await loadAccounts();
  };
  
  const toggleAccountActive = async (account: ScanAccount) => {
    if (account.active) {
        await accountService.deactivate(account.id);
    } else {
        await accountService.reactivate(account.id);
    }
    await loadAccounts();
  }
  
  const deleteAccount = async (accountId: string) => {
      if (window.confirm("Are you sure you want to delete this account? This cannot be undone.")) {
        await accountService.delete(accountId);
        await loadAccounts();
      }
  }
  
  const resetPin = async () => {
    if (!resettingAccount || !newPin) return;
    await accountService.resetPin(resettingAccount.id, newPin);
    setResettingAccount(null);
    setNewPin('');
    alert("PIN reset successfully");
  };

  return (
    <section style={{ marginTop: '20px' }}>
      <h3>Scan Accounts</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '10px', background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <input placeholder="Username" value={newAccount.username} onChange={e => setNewAccount({...newAccount, username: e.target.value})} />
        <input type="password" placeholder="PIN" value={newAccount.pin} onChange={e => setNewAccount({...newAccount, pin: e.target.value})} />
        <input placeholder="Assigned Location" value={newAccount.location} onChange={e => setNewAccount({...newAccount, location: e.target.value})} />
        <button onClick={createAccount}>Create Account</button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
            <th style={{ padding: '8px' }}>Username</th>
            <th style={{ padding: '8px' }}>Location</th>
            <th style={{ padding: '8px' }}>Status</th>
            <th style={{ padding: '8px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {scanAccounts.map((account: ScanAccount) => (
            <tr key={account.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '8px' }}>
                {editingId === account.id 
                    ? <input value={editValues.username ?? account.username} onChange={e => setEditValues({...editValues, username: e.target.value})} /> 
                    : account.username}
              </td>
              <td style={{ padding: '8px' }}>
                {editingId === account.id 
                    ? <input value={editValues.assignedLocation ?? account.assignedLocation} onChange={e => setEditValues({...editValues, assignedLocation: e.target.value})} /> 
                    : account.assignedLocation || 'No location'}
                </td>
              <td style={{ padding: '8px' }}>
                <span style={{color: account.active ? 'green' : 'red', fontWeight: 'bold'}}>{account.active ? 'Active' : 'Inactive'}</span>
              </td>
              <td style={{ padding: '8px', display: 'flex', gap: '5px' }}>
                {editingId === account.id ? (
                  <>
                    <button onClick={() => updateAccount(account)}>Save</button>
                    <button onClick={() => setEditingId(null)}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => {setEditingId(account.id); setEditValues({username: account.username, assignedLocation: account.assignedLocation})}}>Edit</button>
                    <button onClick={() => toggleAccountActive(account)}>{account.active ? 'Deactivate' : 'Reactivate'}</button>
                    <button onClick={() => setResettingAccount(account)}>Reset PIN</button>
                    <button onClick={() => deleteAccount(account.id)} style={{background: '#ef4444', color: 'white'}}>Delete</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {resettingAccount && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <div style={{background: 'white', padding: '20px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px'}}>
                <h3>Reset PIN for {resettingAccount.username}</h3>
                <input type="password" placeholder="New PIN" value={newPin} onChange={e => setNewPin(e.target.value)} />
                <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
                    <button onClick={() => setResettingAccount(null)}>Cancel</button>
                    <button onClick={resetPin} style={{background: '#0f172a', color: 'white'}}>Save New PIN</button>
                </div>
            </div>
        </div>
      )}
    </section>
  );
};
