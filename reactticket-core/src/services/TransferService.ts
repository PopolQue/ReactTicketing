import { StorageAdapter } from '../types/adapter.types';

export class TransferService {
  constructor(private adapter: StorageAdapter) {}

  async initiateTransfer(ticketId: string, senderId: string, receiverId: string) {
    // Logic for creating a pending transfer record
    return this.adapter.createTransfer(ticketId, senderId, receiverId);
  }

  async confirmTransfer(transferId: string) {
    // Logic for finalizing the transfer (atomic update)
    return this.adapter.finalizeTransfer(transferId);
  }
}
