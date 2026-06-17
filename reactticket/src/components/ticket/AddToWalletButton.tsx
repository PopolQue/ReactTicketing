import React, { useState } from 'react';
import { useReactTicket } from '../../hooks/useReactTicket';

interface AddToWalletButtonProps {
  ticketId: string;
}

export const AddToWalletButton: React.FC<AddToWalletButtonProps> = ({ ticketId }) => {
  const [loading, setLoading] = useState(false);
  const { adapter } = useReactTicket();

  const handleAddToWallet = async () => {
    setLoading(true);
    try {
      // adapter is an instance of StorageAdapter (or SupabaseAdapter)
      // We need to call the edge function via supabase client if available on adapter,
      // or just assume we have access to it.
      // Actually, Supabase is typically passed in or accessible via adapter.
      // For now, let's call the Edge Function directly if the client is exposed.
      
      const response = await fetch('/api/generate-wallet-pass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId })
      });
      
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message);
      
      console.log('Wallet pass ready:', data);
    } catch (err) {
      console.error('Error generating wallet pass:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleAddToWallet} disabled={loading} className="btn-secondary">
      {loading ? 'Preparing Pass...' : 'Add to Wallet'}
    </button>
  );
};
