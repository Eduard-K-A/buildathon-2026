export class CacheService<T> {
  private readonly cache = new Map<string, T>();

  get(key: string) {
    return this.cache.get(key);
  }

  set(key: string, value: T) {
    this.cache.set(key, value);
    return value;
  }
}
