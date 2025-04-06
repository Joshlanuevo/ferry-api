import NodeCache from "node-cache";

export class CacheClient {
  private cache: NodeCache;
  
  constructor() {
    this.cache = new NodeCache();
  }

  async get(key: string): Promise<string | null> {
    return this.cache.get(key) || null;
  }

  async set(key: string, value: string, expiryInSeconds?: number): Promise<void> {
    if (expiryInSeconds) {
      this.cache.set(key, value, expiryInSeconds);
    } else {
      this.cache.set(key, value);
    }
  }
}