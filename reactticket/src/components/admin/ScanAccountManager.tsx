import React, { useState, useEffect } from 'react';
import { useReactTicket } from '../../hooks/useReactTicket';
import { ScanAccount } from '../../types/scanAccount.types';
import { ScanAccountService } from '../../services/ScanAccountService';

export const ScanAccountManager: React.FC = () => {
  const { adapter, event, dispatch } = useReactTicket();
  const [scanAccounts, setScanAccounts] = useState<ScanAccount[]>([]);
  const [newAccount, setNewAccount] = useState({ username: '', pin: '', location: '' });
  const accountService = new ScanAccountService(adapter);

  useEffect(() => {
    adapter.listScanAccounts(event.id).then(setScanAccounts);
  }, [adapter, event.id]);

  const createAccount = async () => {
    if (!newAccount.username || !newAccount.pin) return;
    await accountService.createAccount(event.id, newAccount.username, newAccount.pin, newAccount.location);
    setScanAccounts(await adapter.listScanAccounts(event.id));
    setNewAccount({ username: '', pin: '', location: '' });
  };

  return (
    <section style={{ marginTop: '20px' }}>
      <h3>Scan Accounts</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '10px', background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <input placeholder="Username" value={newAccount.username} onChange={e => setNewAccount({...newAccount, username: e.target.value})} />
        <input type="password" placeholder="PIN" value={newAccount.pin} onChange={e => setNewAccount({...newAccount, pin: e.target.value})} />
        <input placeholder="Location" value={newAccount.location} onChange={e => setNewAccount({...newAccount, location: e.target.value})} />
        <button onClick={createAccount}>Create Account</button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
            <th style={{ padding: '8px' }}>Username</th>
            <th style={{ padding: '8px' }}>Location</th>
          </tr>
        </thead>
        <tbody>
          {scanAccounts.map((account: ScanAccount) => (
            <tr key={account.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '8px' }}>{account.username}</td>
              <td style={{ padding: '8px' }}>{account.assignedLocation || 'No location'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};
