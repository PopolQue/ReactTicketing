import React, { useEffect, useRef } from 'react';
import { useScanSession } from '../../hooks/useScanSession';
import { useReactTicket } from '../../hooks/useReactTicket';
import { ScanAccountBadge } from './ScanAccountBadge';
import { ScannerLogin } from './ScannerLogin';
import { ScanResult } from './ScanResult';
import { useScanAuth } from '../../hooks/useScanAuth';

interface ScannerViewProps {
    qrParser?: (data: Uint8ClampedArray, width: number, height: number) => { data: string } | null;
}

export const ScannerView: React.FC<ScannerViewProps> = ({ qrParser }) => {
  const { event, authSession } = useReactTicket();
  const videoRef = useRef<HTMLVideoElement>(null);
  const { 
    startCamera, 
    stopCamera, 
    isScanning, 
    lastResult, 
    setLastResult,
    isExpired
  } = useScanSession(event.id, videoRef, qrParser);
  const { logout } = useScanAuth(event.id);

  useEffect(() => {
    if (authSession?.role === 'scan' && !isExpired) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [authSession, isExpired, startCamera, stopCamera]);

  if (authSession?.role !== 'scan') {
    return <ScannerLogin />;
  }

  if (isExpired) {
    return (
        <div className="ReactTicket-root scanner-view" style={{padding: '20px', textAlign: 'center'}}>
            <h2>Session Expired</h2>
            <p>Your scanning session has expired. Please log in again.</p>
            <button onClick={logout} style={{ marginTop: '20px', padding: '15px', fontSize: '18px', fontWeight: 'bold' }}>Log In</button>
        </div>
    )
  }

  const handleDismissResult = () => {
    setLastResult(null);
  };

  return (
    <div className="ReactTicket-root scanner-view">
      <ScanAccountBadge />
      <div className="camera-view" style={{ position: 'relative', height: '400px', width: '100%', backgroundColor: '#000', overflow: 'hidden' }}>
        <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: isScanning ? 'block' : 'none' }} />
        
        {isScanning && !lastResult && (
          <div style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none'
          }}>
              <div style={{
                  width: '200px', height: '200px',
                  border: '3px solid rgba(255, 255, 255, 0.8)',
                  borderRadius: '12px',
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
              }}></div>
              <p style={{ color: 'white', marginTop: '20px', fontWeight: 'bold' }}>Position QR Code</p>
          </div>
        )}

        {lastResult && (
          <ScanResult result={lastResult} onDismiss={handleDismissResult} />
        )}

        <button onClick={isScanning ? stopCamera : startCamera} style={{ position: 'absolute', bottom: '10px', left: '10px', right: '10px', padding: '15px', fontSize: '18px', fontWeight: 'bold' }}>
            {isScanning ? 'Stop Scanning' : 'Start Scanning'}
        </button>
      </div>
    </div>
  );
};
