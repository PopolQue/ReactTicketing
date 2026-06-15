import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { SupabaseAdapter } from '../../lib/Admit/SupabaseAdapter';
import { mapEventToAdmitConfig } from '../../lib/Admit/mappers';
import { useEventData } from '../../hooks/useEventData';
import { useLanguage } from '../../contexts/LanguageContext';


const ReactTicket = React.lazy(() => import('reactticket').then(m => ({ default: m.ReactTicket })));

export default function ScanPage() {
  const { t } = useLanguage();
  const { id } = useParams();
  const { event, loading } = useEventData(id);

  // Adapter initialization
  const adapter = useMemo(() => new SupabaseAdapter(supabase), []);
  const admitConfig = useMemo(() => event ? mapEventToAdmitConfig(event) : null, [event]);

  // SSR Guard
  const [isClient] = useState(typeof window !== 'undefined');

  if (loading) return <div style={{ padding: '60px', textAlign: 'center' }}>{t('marketplace.scanPage.loadingEvent')}</div>;
  if (!event) return <div style={{ padding: '60px', textAlign: 'center' }}>{t('marketplace.scanPage.eventNotFound')}</div>;

  return (
    <div style={{ height: '100vh', backgroundColor: '#000', overflow: 'hidden' }}>
      <React.Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: 'white' }}>{t('marketplace.scanPage.loadingScanner')}</div>}>
        {isClient && admitConfig ? (
          <ReactTicket
            mode="scanner"
            event={admitConfig}
            adapter={adapter}
            onCheckout={() => Promise.resolve('cancelled')}
          />
        ) : null}
      </React.Suspense>
    </div>
  );
}