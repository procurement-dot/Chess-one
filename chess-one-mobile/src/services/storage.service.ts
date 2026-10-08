/**
 * Secure Storage Service Interface
 * Prepared for the future ChessOne JWT token storage (Phase 2 backend integration).
 *
 * NOTE: Google access tokens are NOT permanently stored here.
 * Only the eventual authoritative ChessOne backend JWT will be persisted securely.
 */

class StorageService {
  private inMemoryCache: Map<string, string> = new Map();

  async setItem(key: string, value: string): Promise<void> {
    this.inMemoryCache.set(key, value);
  }

  async getItem(key: string): Promise<string | null> {
    return this.inMemoryCache.get(key) || null;
  }

  async removeItem(key: string): Promise<void> {
    this.inMemoryCache.delete(key);
  }

  async clear(): Promise<void> {
    this.inMemoryCache.clear();
  }
}

export const storageService = new StorageService();
