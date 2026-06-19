import React from 'react';
import { ReactTicketProvider } from '../context/ReactTicketContext';
import { I18nProvider, Dictionary } from '../context/I18nContext';
import { StorageAdapter } from 'reactticket-core/types/adapter.types';
import { EventConfig } from 'reactticket-core/types/event.types';
import { Order, IssuedTicket } from 'reactticket-core/types/ticket.types';
import { ScanEvent } from 'reactticket-core/types/scan.types';
import { TicketTypeList } from './storefront/TicketTypeList';
import { AdminPanel } from './admin/AdminPanel';
import { ScannerView } from './scanner/ScannerView';
import { TicketOverview } from './admin/TicketOverview';
import { validateAdapterSettings } from 'reactticket-core/utils/validation';

declare const process: any;

interface ReactTicketProps {
  event: EventConfig;
  adapter: StorageAdapter;
  mode?: "storefront" | "scanner" | "admin" | "tickets" | "full";
  onCheckout: (order: Order) => Promise<"confirmed" | "cancelled">;
  onCheckoutComplete?: (order: Order) => void;
  onTicketIssued?: (ticket: IssuedTicket, assets: any) => void;
  onScanEvent?: (scan: ScanEvent, ticket: IssuedTicket) => void;
  qrParser?: (data: Uint8ClampedArray, width: number, height: number) => { data: string } | null;
  theme?: any;
  adminKey?: string;
  authSession?: any;
  className?: string;
  style?: React.CSSProperties;
  locale?: string;
  dictionary?: Dictionary;
}

const renderMode = (mode: string | undefined, qrParser?: (data: Uint8ClampedArray, width: number, height: number) => { data: string } | null) => {
  switch (mode) {
    case 'storefront': return <TicketTypeList />;
    case 'admin': return <AdminPanel />;
    case 'scanner': return <ScannerView qrParser={qrParser} />;
    case 'tickets': return <TicketOverview />;
    default: return <TicketTypeList />;
  }
};

export const ReactTicket = (props: ReactTicketProps) => {
  const validation = validateAdapterSettings(
    props.adapter.name,
    props.mode,
    process.env.NODE_ENV || 'development'
  );

  if (validation?.type === 'error') {
    throw new Error(validation.message);
  }

  if (validation?.type === 'warn') {
    console.warn(validation.message);
  }

  return (
    <I18nProvider locale={props.locale || props.event?.settings?.locale} dictionary={props.dictionary}>
      <ReactTicketProvider event={props.event} adapter={props.adapter} onCheckout={props.onCheckout} onCheckoutComplete={props.onCheckoutComplete} onTicketIssued={props.onTicketIssued} authSession={props.authSession}>
        <div className={`ReactTicket-root ${props.className || ''}`} style={props.style} role="region" aria-label="Ticket Management System">
          {renderMode(props.mode, props.qrParser)}
        </div>
      </ReactTicketProvider>
    </I18nProvider>
  );
};
