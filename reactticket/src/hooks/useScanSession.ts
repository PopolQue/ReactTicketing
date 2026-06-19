import React, { useMemo, useCallback, useRef, useState, useEffect } from 'react';
import { useReactTicket } from './useReactTicket';
import { ScanService } from 'reactticket-core/services/ScanService';
import { AuthService } from 'reactticket-core/services/AuthService';
import jsQR from 'reactticket-core/utils/jsQR';
import { ScanEvent } from 'reactticket-core/types/scan.types';

type QRParser = (data: Uint8ClampedArray, width: number, height: number) => { data: string } | null;

export const useScanSession = (
  eventId: string,
  videoRef: React.RefObject<HTMLVideoElement>,
  qrParser?: QRParser
) => {
  const { adapter, authSession, event } = useReactTicket();
  const authService = useMemo(() => new AuthService(adapter, event.settings), [adapter, event.settings]);
  const scanService = useMemo(() => new ScanService(adapter, authService), [adapter, authService]);

  const animationFrameId = useRef<number | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [lastResult, setLastResult] = useState<ScanEvent | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = async () => {
        setIsOnline(true);
        // Sync queued scans
        const queued = await adapter.getQueuedScanEvents();
        if (queued.length > 0) {
            for (const scan of queued) {
                try {
                    await scanService.validateTicket(scan.ticketId, authSession as any, eventId);
                    await adapter.saveScanEvent(scan);
                } catch (e) {
                    console.error('Failed to sync scan', e);
                }
            }
            await adapter.clearQueuedScanEvents();
        }
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
  }, [adapter, scanService, authSession, eventId]);

  const stopCamera = useCallback(() => {
      if (animationFrameId.current !== null) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  }, [videoRef]);

  const scanLoop = useCallback(() => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        const decoder = qrParser ?? jsQR;
        const code = decoder(imageData.data, imageData.width, imageData.height);

        if (code) {
          if (authSession && 'token' in authSession) {
            if (isOnline) {
                scanService.validateTicket(code.data, authSession, eventId)
                .then(scanEvent => {
                    setLastResult(scanEvent);
                    // Pause scanning for a bit to show result
                    setTimeout(() => {
                    setLastResult(null);
                    if (animationFrameId.current !== null) { // Check if still scanning
                        animationFrameId.current = requestAnimationFrame(scanLoop);
                    }
                    }, 4000);
                })
                .catch(console.error);
            } else {
                // Offline mode: queue the scan result locally
                setLastResult({
                    result: 'offline_queued',
                    ticketId: code.data,
                    scannedByAccountName: 'Offline Mode'
                } as any);
                // Queue the validation request here (LocalStorageAdapter)
                adapter.queueScanEvent({
                    result: 'offline_queued',
                    ticketId: code.data,
                    scannedByAccountName: 'Offline Mode',
                    scannedAt: new Date()
                } as any);
            }
          }
          return; // Stop the loop until validation is done and timeout passed
        }
      }
    }
    if (animationFrameId.current !== null) { // Check if still scanning
        animationFrameId.current = requestAnimationFrame(scanLoop);
    }
  }, [videoRef, qrParser, authSession, scanService, isOnline, adapter, eventId]);

  const startCamera = useCallback(async () => {
    if (animationFrameId.current !== null) {
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS
        await videoRef.current.play();
        setIsScanning(true);
        animationFrameId.current = requestAnimationFrame(scanLoop);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  }, [videoRef, scanLoop]);

  useEffect(() => {
    if (authSession?.role === 'scan') {
      const checkExpiry = () => {
        if (authSession.expiresAt < Date.now()) {
          setIsExpired(true);
          stopCamera();
        }
      };
      const interval = setInterval(checkExpiry, 1000);
      checkExpiry(); // check immediately
      return () => clearInterval(interval);
    }
  }, [authSession, stopCamera]);
  
  useEffect(() => {
      return () => {
          stopCamera();
      }
  }, [stopCamera]);

  const scanManual = useCallback(async (payload: string) => {
    if (authSession && 'token' in authSession) {
        const scanEvent = await scanService.validateTicket(payload, authSession, eventId);
        setLastResult(scanEvent);
        return scanEvent.result;
    }
    throw new Error('Not authenticated');
  }, [scanService, authSession]);

  return {
    isScanning,
    lastResult,
    startCamera,
    stopCamera,
    scanManual,
    setLastResult, // To allow dismissing the result
    isExpired,
  };
};
