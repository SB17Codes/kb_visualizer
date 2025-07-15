interface CacheEntry {
  data: any
  timestamp: number
  hash: string
}

class CacheManager {
  private cache = new Map<string, CacheEntry>()
  private readonly maxAge = 1000 * 60 * 30 // 30 minutes
  private readonly maxSize = 50

  set(key: string, data: any, hash: string): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = Array.from(this.cache.keys())[0]
      this.cache.delete(oldestKey)
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      hash,
    })
  }

  get(key: string, hash: string): any | null {
    const entry = this.cache.get(key)

    if (!entry) return null

    // Check if entry is expired
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key)
      return null
    }

    // Check if hash matches
    if (entry.hash !== hash) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }
}

export const cacheManager = new CacheManager()
