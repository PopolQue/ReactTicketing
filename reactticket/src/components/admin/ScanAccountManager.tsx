import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useReactTicket } from '../../hooks/useReactTicket';
import { ScanAccount } from 'reactticket-core/types/scanAccount.types';
import { ScanAccountService } from 'reactticket-core/services/ScanAccountService';

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
    await adapter.saveScanAccount(updatedAccount);
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
    <section style={{ marginTop: '20px' }} role="region" aria-label="Scan Account Manager">
      <h3>Scan Accounts</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '10px', background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '20px' }} role="group" aria-label="Create Scan Account">
        <input placeholder="Username" value={newAccount.username} onChange={e => setNewAccount({...newAccount, username: e.target.value})} aria-label="New Account Username" />
        <input type="password" placeholder="PIN" value={newAccount.pin} onChange={e => setNewAccount({...newAccount, pin: e.target.value})} aria-label="New Account PIN" />
        <input placeholder="Assigned Location" value={newAccount.location} onChange={e => setNewAccount({...newAccount, location: e.target.value})} aria-label="New Account Assigned Location" />
        <button type="button" onClick={createAccount}>Create Account</button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }} aria-label="Scan Accounts List">
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
                    ? <input value={editValues.username ?? account.username} onChange={e => setEditValues({...editValues, username: e.target.value})} aria-label={`Edit username for ${account.username}`} /> 
                    : account.username}
              </td>
              <td style={{ padding: '8px' }}>
                {editingId === account.id 
                    ? <input value={editValues.assignedLocation ?? account.assignedLocation} onChange={e => setEditValues({...editValues, assignedLocation: e.target.value})} aria-label={`Edit assigned location for ${account.username}`} /> 
                    : account.assignedLocation || 'No location'}
                </td>
              <td style={{ padding: '8px' }}>
                <span style={{color: account.active ? 'green' : 'red', fontWeight: 'bold'}}>{account.active ? 'Active' : 'Inactive'}</span>
              </td>
              <td style={{ padding: '8px', display: 'flex', gap: '5px' }}>
                {editingId === account.id ? (
                  <>
                    <button type="button" onClick={() => updateAccount(account)} aria-label={`Save changes for ${account.username}`}>Save</button>
                    <button type="button" onClick={() => setEditingId(null)} aria-label={`Cancel editing for ${account.username}`}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={() => {setEditingId(account.id); setEditValues({username: account.username, assignedLocation: account.assignedLocation})}} aria-label={`Edit account ${account.username}`}>Edit</button>
                    <button type="button" onClick={() => toggleAccountActive(account)} aria-label={`${account.active ? 'Deactivate' : 'Reactivate'} account ${account.username}`}>{account.active ? 'Deactivate' : 'Reactivate'}</button>
                    <button type="button" onClick={() => setResettingAccount(account)} aria-label={`Reset PIN for account ${account.username}`}>Reset PIN</button>
                    <button type="button" onClick={() => deleteAccount(account.id)} style={{background: '#ef4444', color: 'white'}} aria-label={`Delete account ${account.username}`}>Delete</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {resettingAccount && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center'}} role="dialog" aria-modal="true" aria-labelledby="reset-pin-title">
            <div style={{background: 'white', padding: '20px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px'}}>
                <h3 id="reset-pin-title">Reset PIN for {resettingAccount.username}</h3>
                <input type="password" placeholder="New PIN" value={newPin} onChange={e => setNewPin(e.target.value)} aria-label="New PIN" />
                <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
                    <button type="button" onClick={() => setResettingAccount(null)}>Cancel</button>
                    <button type="button" onClick={resetPin} style={{background: '#0f172a', color: 'white'}}>Save New PIN</button>
                </div>
            </div>
        </div>
      )}
    </section>
  );
};
