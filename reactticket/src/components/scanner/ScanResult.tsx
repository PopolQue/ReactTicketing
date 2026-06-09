import React from 'react';
import { useScanSession } from '../../hooks/useScanSession';
import { useReactTicket } from '../../hooks/useReactTicket';

export const ScanResult: React.FC = () => {
  const { event } = useReactTicket();
  const { lastResult } = useScanSession(event.id);

  if (!lastResult) return null;

  return (
    <div className={`ReactTicket-root scan-result ${lastResult.result}`}>
      <p>Result: {lastResult.result}</p>
    </div>
  );
};
