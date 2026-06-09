import React from 'react';
import { QRGenerator } from '../../services/QRGenerator';

export const QRCode = ({ payload }: { payload: string }) => {
  const dataUri = QRGenerator.generate(payload);
  return <img src={dataUri} alt="QR Code" className="tf-qr-code" />;
};
