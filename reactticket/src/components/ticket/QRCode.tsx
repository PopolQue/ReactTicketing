import React from 'react';
import { QRGenerator } from 'reactticket-core/services/QRGenerator';

export const QRCode = ({ payload }: { payload: string }) => {
  const [dataUri, setDataUri] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        setDataUri(QRGenerator.generate(payload));
      } catch (e) {
        console.error("Failed to generate QR", e);
      }
    }
  }, [payload]);

  if (!dataUri) return <div className="tf-qr-code-placeholder" style={{ width: 150, height: 150, background: '#eee' }} />;

  return <img src={dataUri} alt="QR Code" className="tf-qr-code" />;
};
