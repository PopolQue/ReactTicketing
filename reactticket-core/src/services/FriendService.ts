import { StorageAdapter } from "../types/adapter.types";

export class FriendService {
  constructor(private adapter: StorageAdapter) {}

  async sendRequest(userId: string, friendId: string) {
    return this.adapter.createFriendship(userId, friendId);
  }

  async acceptRequest(friendshipId: string) {
    return this.adapter.updateFriendshipStatus(friendshipId, 'accepted');
  }

  async getFriends(userId: string) {
    return this.adapter.getFriends(userId);
  }
}
