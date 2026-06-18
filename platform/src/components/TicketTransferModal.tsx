import React, { useState } from 'react';
import Modal from './Modal';

export const TicketTransferModal = ({ isOpen, onClose, onConfirm }: { isOpen: boolean, onClose: () => void, onConfirm: (receiverId: string) => Promise<void> }) => {
  const [receiverId, setReceiverId] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Transfer Ticket">
      <div style={{ padding: '16px' }}>
        <input 
            className="input-field" 
            value={receiverId} 
            onChange={(e) => setReceiverId(e.target.value)} 
            placeholder="Receiver User ID" 
        />
        <div style={{ margin: '20px 0', padding: '10px', border: '1px solid #f00', borderRadius: '4px', color: '#f00' }}>
            <label>
              <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
              I confirm that this ticket transfer is non-reversible and is being sent to a trusted individual.
            </label>
        </div>
        <button className="btn-primary" disabled={!confirmed || !receiverId} onClick={() => onConfirm(receiverId)}>
          Confirm Transfer
        </button>
      </div>
    </Modal>
  );
};
