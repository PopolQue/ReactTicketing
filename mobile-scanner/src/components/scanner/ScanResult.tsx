import React from 'react';

// Simplified ScanResult for web container
export const ScanResult = ({ result, ticketInfo, onDismiss }: { result: string, ticketInfo?: any, onDismiss: () => void }) => {
  return (
    <div 
      role="alert"
      aria-live="assertive"
      style={{
        ...styles.container,
        backgroundColor: result === 'admitted' ? '#22c55e' : '#ef4444'
      }}
    >
      <h2 aria-label={`Scan result: ${result.replace('_', ' ')}`}>
        {result.replace('_', ' ').toUpperCase()}
      </h2>
      {ticketInfo && (
        <div style={{ marginBottom: 20 }}>
          <p>ID: {ticketInfo.id}</p>
          <p>Type: {ticketInfo.typeName}</p>
          <p>Name: {ticketInfo.name} {ticketInfo.surname}</p>
        </div>
      )}
      <button onClick={onDismiss} style={styles.button}>Scan Next</button>
    </div>
  );
};

const styles: any = {
  container: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
    color: 'white', padding: 20
  },
  button: { padding: 15, fontSize: 16, borderRadius: 8, border: 'none', cursor: 'pointer' }
};
