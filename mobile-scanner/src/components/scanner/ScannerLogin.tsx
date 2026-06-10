import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Simple implementation for web-based scanner simulation
export const ScannerLogin = ({ onLoginSuccess }: { onLoginSuccess: () => void }) => {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');

  const handleLogin = () => {
    // Integrate with reactticket-core AuthService here
    if (username === 'crew' && pin === '1234') {
        onLoginSuccess();
    } else {
        alert('Invalid credentials');
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
