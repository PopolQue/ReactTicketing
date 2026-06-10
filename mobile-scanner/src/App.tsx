import React, { useState, useEffect } from 'react';
import { ScannerLogin } from './components/scanner/ScannerLogin';
import { ScanResult } from './components/scanner/ScanResult';
import { ScanService } from 'reactticket-core/services/ScanService';
import { AuthService } from 'reactticket-core/services/AuthService';
import { LocalStorageAdapter } from 'reactticket-core/adapters/LocalStorageAdapter';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';

const adapter = new LocalStorageAdapter();
const eventId = 'evt_test_001';
const eventSettings = { scanSessionSecret: 'dummy-secret-at-least-32-chars-long!!!!!!!!!!' };
const authService = new AuthService(adapter, eventSettings as any);
const scanService = new ScanService(adapter, authService);

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [isScannerActive, setIsScannerActive] = useState(false);

  const startScan = async () => {
    await BarcodeScanner.checkPermission({ force: true });
    BarcodeScanner.hideBackground();
    setIsScannerActive(true);
    const result = await BarcodeScanner.startScan();
    if (result.hasContent) {
      setIsScannerActive(false);
      try {
        const session = await authService.loginScanAccount(eventId, 'crew', '1234');
        const scanEvent = await scanService.validateTicket(result.content!, session, eventId);
        
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
    }
  };

  if (!isAuthenticated) {
    return <ScannerLogin onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  if (scanResult) {
    return <ScanResult result={scanResult.result} ticketInfo={scanResult.ticketInfo} onDismiss={() => setScanResult(null)} />;
  }

  return (
    <div style={{ textAlign: 'center', marginTop: 50 }}>
      <h1>Scanner Active</h1>
      <button onClick={startScan} disabled={isScannerActive}>
        {isScannerActive ? 'Scanning...' : 'Start Camera Scan'}
      </button>
    </div>
  );
}
