import React, { useMemo } from 'react';
import { ReactTicket } from 'reactticket';
import { SupabaseAdapter } from '../../platform/src/lib/Admit/SupabaseAdapter';
import { supabase } from '../../platform/src/lib/supabase';
import jsQR from 'reactticket-core/utils/jsQR';

function ScannerApp() {
  const adapter = useMemo(() => new SupabaseAdapter(supabase), []);

  const qrParser = (data: Uint8ClampedArray, width: number, height: number) => {
    return jsQR(data, width, height, { inversionAttempts: 'dontInvert' });
  };

  // Basic routing for /scan/:eventId
  const path = window.location.pathname;
  const match = path.match(/^\/scan\/(.+)$/);
  const eventId = match ? match[1] : 'evt_test_001';

  const eventConfig = {
    id: eventId,
    name: 'Event ' + eventId,
    scanSessionSecret: '',
    qrSigningSecret: '',
    organizerId: 'org_1',
    date: new Date().toISOString(),
    location: 'Gate A',
    status: 'published' as const,
  };

  return (
    <div style={{ height: '100vh', backgroundColor: '#000' }}>
      <ReactTicket
        mode="scanner"
        event={eventConfig}
        adapter={adapter}
        qrParser={qrParser}
        onCheckout={() => Promise.resolve('cancelled')}
      />
    </div>
  );
}

export default function App() {
  return <ScannerApp />;
}
