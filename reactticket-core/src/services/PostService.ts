import { StorageAdapter } from '../types/adapter.types';

export interface Post {
  user_id: string;
  event_id: string;
  is_public: boolean;
}

export class PostService {
  constructor(private adapter: StorageAdapter) {}

  async createPost(post: Post) {
    return this.adapter.createPost(post);
  }
}
