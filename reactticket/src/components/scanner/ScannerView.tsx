import React, { useEffect, useRef, useState } from 'react';
import { useScanSession } from '../../hooks/useScanSession';
import { useReactTicket } from '../../hooks/useReactTicket';
import { ScanAccountBadge } from './ScanAccountBadge';
import { ScannerLogin } from './ScannerLogin';
import { ScanService } from '../../services/ScanService';

interface ScannerViewProps {
    qrParser?: (imageData: ImageData) => string | null;
}

export const ScannerView: React.FC<ScannerViewProps> = ({ qrParser }) => {
  const { event, authSession, adapter } = useReactTicket();
  const { startCamera, stopCamera } = useScanSession(event.id);
  const [scanResult, setScanResult] = useState<{result: string, ticket: any | null} | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const streamRef = useRef<MediaStream | null>(null);
  
  // Need scanService to perform manual check
  const { authService } = useScanSession(event.id);
  const scanService = React.useMemo(() => new ScanService(adapter, authService), [adapter, authService]);

  const toggleCamera = () => {
    if (isCameraActive) {
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        if (videoRef.current) videoRef.current.srcObject = null;
    } else {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
            .then(s => {
                streamRef.current = s;
                if (videoRef.current) videoRef.current.srcObject = s;
            });
    }
    setIsCameraActive(!isCameraActive);
  };

  const handleScan = async (payload: string) => {
    setIsCameraActive(false); // Pause camera
    const { result, ticket } = await scanService.checkTicket(payload);
    setScanResult({ result, ticket });
  };

  const admitAndResume = async () => {
    if (scanResult?.ticket && authSession && 'accountId' in authSession) {
        await scanService.admitTicket(scanResult.ticket.id, (authSession as any).accountId);
    }
    setScanResult(null);
    toggleCamera(); // Resumes camera
  };

  const resumeScanning = () => {
    setScanResult(null);
    toggleCamera(); // Resumes camera
  };

  useEffect(() => {
    if (authSession?.role === 'scan') {
      startCamera();
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(s => {
            streamRef.current = s;
            if (videoRef.current) videoRef.current.srcObject = s;
        })
        .catch(err => console.error("Camera error:", err));
    }
    return () => {
        stopCamera();
        streamRef.current?.getTracks().forEach(t => t.stop());
        if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [authSession, startCamera, stopCamera]);

  // Frame processing loop
  useEffect(() => {
    let animationFrame: number;
    const processFrame = () => {
        if (isCameraActive && videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            const canvas = canvasRef.current;
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const result = qrParser ? qrParser(imageData) : null;
                if (result) handleScan(result);
            }
        }
        animationFrame = requestAnimationFrame(processFrame);
    };
    if (authSession?.role === 'scan' && isCameraActive && !scanResult) animationFrame = requestAnimationFrame(processFrame);
    return () => cancelAnimationFrame(animationFrame);
  }, [authSession, qrParser, isCameraActive, scanResult]);

  if (authSession?.role !== 'scan') {
    return <ScannerLogin />;
  }

  return (
    <div className="ReactTicket-root scanner-view">
      <ScanAccountBadge />
      <div className="camera-view" style={{ position: 'relative', height: '400px', width: '100%', backgroundColor: '#000', overflow: 'hidden' }}>
        {scanResult ? (
            <div style={{ color: 'white', padding: '20px', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <h3>{scanResult.result.toUpperCase()}</h3>
                {scanResult.ticket && (
                    <>
                        <p>Ticket: {scanResult.ticket.id}</p>
                        <p>Buyer: {scanResult.ticket.personalization.name} {scanResult.ticket.personalization.surname}</p>
                    </>
                )}
                {scanResult.result === 'admitted' && (
                    <button onClick={admitAndResume} style={{ padding: '15px', fontSize: '18px', fontWeight: 'bold', backgroundColor: '#22c55e', color: 'white' }}>Admit Ticket</button>
                )}
                <button onClick={resumeScanning} style={{ padding: '15px', fontSize: '18px', fontWeight: 'bold', marginTop: '10px' }}>{scanResult.result === 'admitted' ? 'Cancel' : 'Scan Next Ticket'}</button>
            </div>
        ) : (
            <>
                <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                
                {isCameraActive && (
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
                <button onClick={toggleCamera} style={{ position: 'absolute', bottom: '10px', left: '10px', right: '10px', padding: '15px', fontSize: '18px', fontWeight: 'bold' }}>
                    {isCameraActive ? 'Stop Scanning' : 'Resume Scanning'}
                </button>
            </>
        )}
      </div>
    </div>
  );
};
