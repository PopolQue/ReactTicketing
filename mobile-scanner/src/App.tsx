import React, { useState, useEffect, useRef } from 'react';
import { ScannerLogin } from './components/scanner/ScannerLogin';
import { ScanResult } from './components/scanner/ScanResult';
import { ScanService } from 'reactticket-core/services/ScanService';
import { AuthService } from 'reactticket-core/services/AuthService';
import { LocalStorageAdapter } from 'reactticket-core/adapters/LocalStorageAdapter';
import jsQR from 'reactticket-core/utils/jsQR';

const adapter = new LocalStorageAdapter();
const eventId = 'evt_test_001';
const eventSettings = { scanSessionSecret: 'dummy-secret-at-least-32-chars-long!!!!!!!!!!' };
const authService = new AuthService(adapter, eventSettings as any);
const scanService = new ScanService(adapter, authService);

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [isScannerActive, setIsScannerActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();

  useEffect(() => {
    if (isScannerActive) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isScannerActive]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.play();
        requestRef.current = requestAnimationFrame(tick);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setIsScannerActive(false);
    }
  };

  const stopCamera = () => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const tick = async () => {
    if (!isScannerActive) return;
    
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (canvas) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code) {
            setIsScannerActive(false);
            stopCamera();
            await processScan(code.data);
            return;
          }
        }
      }
    }
    if (isScannerActive) {
      requestRef.current = requestAnimationFrame(tick);
    }
  };

  const processScan = async (payload: string) => {
    try {
      if (!session) throw new Error("No active session");
      
      const scanEvent = await scanService.validateTicket(payload, session, eventId);
      
      // Fetch ticket details for display
      const ticket = await adapter.getTicket(scanEvent.ticketId);
      let typeName = 'Unknown';
      if (ticket) {
          const ticketTypes = await adapter.getTicketTypes(eventId);
          const type = ticketTypes.find(t => t.id === ticket.ticketTypeId);
          typeName = type ? type.name : 'Unknown';
      }
      
      setScanResult({
          result: scanEvent.result,
          ticketInfo: ticket ? { 
              id: ticket.id, 
              name: ticket.personalization.name, 
              surname: ticket.personalization.surname,
              typeName: typeName
          } : null
      });
    } catch (e) {
      console.error("Scan failed", e);
      setScanResult({ result: 'invalid' });
    }
  };

  if (!session) {
    return <ScannerLogin onLoginSuccess={() => setSession({
      accountId: 'test-acc',
      accountUsername: 'crew',
      eventId: eventId,
      assignedLocation: 'Gate A',
      credentialVersion: 1,
      issuedAt: Date.now(),
      expiresAt: Date.now() + 86400000,
      token: 'dummy.token.here',
      role: 'scan',
    })} />;
  }

  if (scanResult) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <ScanResult result={scanResult.result} ticketInfo={scanResult.ticketInfo} onDismiss={() => {
          setScanResult(null);
          setIsScannerActive(true); // Auto-restart scanning after dismiss
        }} />
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '16px', background: '#333', color: '#fff', display: 'flex', justifyContent: 'space-between' }}>
        <span>Gate A • Active</span>
        <button onClick={() => setSession(null)}>Logout</button>
      </header>
      
      <div style={{ flex: 1, position: 'relative', background: '#000' }}>
        <video 
          ref={videoRef} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        
        {!isScannerActive && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
            <button 
              onClick={() => setIsScannerActive(true)}
              style={{ padding: '16px 32px', fontSize: '1.2rem', borderRadius: '8px' }}
            >
              Start Scanner
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
