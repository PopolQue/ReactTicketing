import React, { useState } from 'react';


// Simple implementation for web-based scanner simulation
export const ScannerLogin = ({ authService, onLoginSuccess }: { authService: any, onLoginSuccess: (session: any) => void }) => {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [eventId, setEventId] = useState('evt_test_001'); // Added eventId input for testing
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const session = await authService.loginScanAccount(eventId, username, pin);
      onLoginSuccess(session);
    } catch (err: any) {
      alert(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2>Scanner Login</h2>
      <input 
        placeholder="Username" 
        value={username} 
        onChange={(e) => setUsername(e.target.value)} 
        style={styles.input}
      />
      <input 
        type="password" 
        placeholder="PIN" 
        value={pin} 
        onChange={(e) => setPin(e.target.value)} 
        style={styles.input}
      />
      <button onClick={handleLogin} style={styles.button}>Sign in</button>
    </div>
  );
};

const styles: any = {
  container: { padding: 20, maxWidth: 300, margin: 'auto' },
  input: { display: 'block', width: '100%', padding: 10, marginBottom: 10 },
  button: { width: '100%', padding: 10 }
};
