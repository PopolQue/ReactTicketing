import React from 'react';
import { ReactTicketProvider } from '../context/ReactTicketContext';
import { StorageAdapter } from '../types/adapter.types';
import { EventConfig } from '../types/event.types';
import { Order, IssuedTicket } from '../types/ticket.types';
import { ScanEvent } from '../types/scan.types';
import { TicketTypeList } from './storefront/TicketTypeList';
import { AdminPanel } from './admin/AdminPanel';
import { ScannerView } from './scanner/ScannerView';
import { TicketOverview } from './admin/TicketOverview';

interface ReactTicketProps {
  event: EventConfig;
  adapter: StorageAdapter;
  mode?: "storefront" | "scanner" | "admin" | "tickets" | "full";
  onCheckout: (order: Order) => Promise<"confirmed" | "cancelled">;
  onTicketIssued?: (ticket: IssuedTicket, assets: any) => void;
  onScanEvent?: (scan: ScanEvent, ticket: IssuedTicket) => void;
  qrParser?: (imageData: ImageData) => string | null;
  theme?: any;
  adminKey?: string;
  className?: string;
  style?: React.CSSProperties;
}

const renderMode = (mode: string | undefined, qrParser?: (imageData: ImageData) => string | null) => {
  switch (mode) {
    case 'storefront': return <TicketTypeList />;
    case 'admin': return <AdminPanel />;
    case 'scanner': return <ScannerView qrParser={qrParser} />;
    case 'tickets': return <TicketOverview />;
    default: return <TicketTypeList />;
  }
};

export const ReactTicket = (props: ReactTicketProps) => {
  return (
    <ReactTicketProvider event={props.event} adapter={props.adapter} onCheckout={props.onCheckout}>
      <div className={`ReactTicket-root ${props.className || ''}`} style={props.style}>
        {renderMode(props.mode, props.qrParser)}
      </div>
    </ReactTicketProvider>
  );
};
