import React, { useMemo } from 'react';
import { ReactTicket } from 'reactticket';
import { SupabaseAdapter } from '../../platform/src/lib/Admit/SupabaseAdapter';
import { supabase } from '../../platform/src/lib/supabase';
import jsQR from 'reactticket-core/utils/jsQR';

// We hardcode the event ID and settings for the mock scanner environment
const EVENT_ID = 'evt_test_001';
const EVENT_CONFIG = {
  id: EVENT_ID,
  name: 'Test Event',
  scanSessionSecret: 'dummy-secret-at-least-32-chars-long!!!!!!!!!!',
  organizerId: 'org_1',
  date: new Date().toISOString(),
  location: 'Gate A',
  status: 'published' as const
};

export default function App() {
  const adapter = useMemo(() => new SupabaseAdapter(supabase), []);

  const qrParser = (data: Uint8ClampedArray, width: number, height: number) => {
    return jsQR(data, width, height, { inversionAttempts: "dontInvert" });
  };

  return (
    <div style={{ height: '100vh', backgroundColor: '#000' }}>
      <ReactTicket
        mode="scanner"
        event={EVENT_CONFIG}
        adapter={adapter}
        qrParser={qrParser}
        onCheckout={() => Promise.resolve('cancelled')}
      />
    </div>
  );
}
