export const CACHE_TTL = {
  SCHEMAS: 60 * 1000,
  COLLECTIONS: 30 * 1000,
  STATS: 15 * 1000,
  INDEXES: 120 * 1000,
  SERVER_STATUS: 20 * 1000
}

export const initMemoryCache = () => {
  return {
    schemas: new Map(),
    collections: new Map(),
    stats: new Map(),
    indexes: new Map(),
    serverStatus: new Map(),
    fields: new Map()
  }
}

export const clearMemoryCache = (cache) => {
  if (!cache) return
  
  cache.schemas.clear()
  cache.collections.clear()
  cache.stats.clear()
  cache.indexes.clear()
  cache.serverStatus.clear()
  cache.fields.clear()
}

export const getCachedData = (cache, cacheType, key, ttl) => {
  if (!cache || !cache[cacheType]) return null
  
  const cachedData = cache[cacheType].get(key)
  if (cachedData && (Date.now() - cachedData.timestamp) < ttl) {
    return cachedData.data
  }
  
  return null
}

export const setCachedData = (cache, cacheType, key, data) => {
  if (!cache || !cache[cacheType]) return false
  
  cache[cacheType].set(key, {
    data,
    timestamp: Date.now()
  })
  
  return true
}

export const monitorMemoryUsage = (cache, criticalThresholdMB = 2000, warningThresholdMB = 1500, log) => {
  const memoryUsage = process.memoryUsage()
  const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024)
  const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024)
  
  const status = {
    heapUsedMB,
    heapTotalMB,
    critical: heapUsedMB > criticalThresholdMB,
    warning: heapUsedMB > warningThresholdMB
  }
  
  if (status.warning && log) {
    log(`High memory usage: ${heapUsedMB}MB used of ${heapTotalMB}MB heap`, true)
  }
  
  if (status.critical && cache) {
    if (log) log('Critical memory pressure. Clearing caches…', true)
    clearMemoryCache(cache)
    global.gc && global.gc()
  }
  
  return status
}