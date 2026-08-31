import Redis from 'ioredis';
import { config } from './env';

class FallbackRedisStore {
  private store = new Map<string, { value: string; expiry: number | null }>();
  private timers = new Map<string, NodeJS.Timeout>();

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiry && item.expiry < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string): Promise<'OK'> {
    this.store.set(key, { value, expiry: null });
    return 'OK';
  }

  async setex(key: string, seconds: number, value: string): Promise<'OK'> {
    const expiry = Date.now() + seconds * 1000;
    this.store.set(key, { value, expiry });

    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key)!);
    }

    const timer = setTimeout(() => {
      this.store.delete(key);
      this.timers.delete(key);
    }, seconds * 1000);

    this.timers.set(key, timer);
    return 'OK';
  }

  async del(key: string): Promise<number> {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key)!);
      this.timers.delete(key);
    }
    const existed = this.store.delete(key);
    return existed ? 1 : 0;
  }

  async keys(pattern: string): Promise<string[]> {
    const now = Date.now();
    const result: string[] = [];
    const prefix = pattern.replace('*', '');
    for (const [k, v] of this.store.entries()) {
      if (v.expiry && v.expiry < now) {
        this.store.delete(k);
        continue;
      }
      if (k.startsWith(prefix)) {
        result.push(k);
      }
    }
    return result;
  }

  async ttl(key: string): Promise<number> {
    const item = this.store.get(key);
    if (!item || !item.expiry) return -1;
    const remaining = Math.ceil((item.expiry - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }
}

let redisClient: any;
let isRedisAvailable = false;

export function initRedis(): any {
  try {
    const client = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      retryStrategy: () => null, // don't spam reconnects if offline
    });

    client.connect()
      .then(() => {
        isRedisAvailable = true;
        redisClient = client;
        console.log('✅ Redis connected for caching & chaos session TTL.');
      })
      .catch(() => {
        isRedisAvailable = false;
        redisClient = new FallbackRedisStore();
        console.warn('⚠️ Redis offline. Using high-performance in-memory key-value & TTL cache.');
      });

    redisClient = new FallbackRedisStore();
  } catch {
    redisClient = new FallbackRedisStore();
  }
  return redisClient;
}

export function getRedis(): any {
  if (!redisClient) {
    redisClient = new FallbackRedisStore();
  }
  return redisClient;
}
