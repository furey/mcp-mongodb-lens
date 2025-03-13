import mongodb from 'mongodb'

const { MongoClient } = mongodb

export const connectionOptions = {
  useUnifiedTopology: true, 
  maxPoolSize: 20,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 360000,
  serverSelectionTimeoutMS: 30000,
  heartbeatFrequencyMS: 10000,
  retryWrites: false,
  useNewUrlParser: true
}

export const extractDbNameFromConnectionString = (uri) => {
  const pathParts = uri.split('/').filter(part => part)
  const lastPart = pathParts[pathParts.length - 1]?.split('?')[0]
  return (lastPart && !lastPart.includes(':')) ? lastPart : 'admin'
}

export const reconnect = async (mongoClient, connectionRetries, log) => {
  if (connectionRetries > 10) {
    log('Maximum reconnection attempts reached. Giving up.', true)
    return { success: false, connectionRetries }
  }
  
  connectionRetries++
  log(`Reconnection attempt ${connectionRetries}…`, true)
  
  try {
    await mongoClient.connect()
    log('Reconnected to MongoDB successfully', true)
    return { success: true, connectionRetries: 0 }
  } catch (error) {
    log(`Reconnection failed: ${error.message}`, true)
    return { success: false, connectionRetries, error }
  }
}

export const connect = async (uri = 'mongodb://localhost:27017', configFile, memoryCache, log) => {
  try {
    log(`Connecting to MongoDB at: ${uri}`)
    
    const finalUri = configFile?.mongoUri || uri
    const finalOptions = {
      ...connectionOptions,
      ...(configFile?.connectionOptions || {})
    }
    
    const mongoClient = new MongoClient(finalUri, finalOptions)
    
    let retryCount = 0
    const maxRetries = 5
    
    while (retryCount < maxRetries) {
      try {
        await mongoClient.connect()
        break
      } catch (connectionError) {
        retryCount++
        if (retryCount >= maxRetries) {
          throw connectionError
        }
        const delay = Math.min(1000 * Math.pow(2, retryCount), 30000)
        log(`Connection attempt ${retryCount} failed, retrying in ${delay/1000} seconds…`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    const adminDb = mongoClient.db('admin')
    let serverInfo
    
    try {
      serverInfo = await adminDb.command({ buildInfo: 1 })
      log(`Connected to MongoDB server version: ${serverInfo.version}`)
      
      const cacheKey = 'server_info'
      memoryCache.serverStatus.set(cacheKey, {
        data: serverInfo,
        timestamp: Date.now()
      })
    } catch (infoError) {
      log(`Warning: Unable to get server info: ${infoError.message}`)
    }
    
    const currentDbName = extractDbNameFromConnectionString(finalUri)
    const currentDb = mongoClient.db(currentDbName)
    
    try {
      await currentDb.stats()
    } catch (statsError) {
      log(`Warning: Unable to get database stats: ${statsError.message}`)
    }
    
    mongoClient.on('error', (err) => {
      log(`MongoDB connection error: ${err.message}. Will attempt to reconnect.`, true)
    })
    
    mongoClient.on('close', () => {
      log('MongoDB connection closed. Will attempt to reconnect.', true)
    })
    
    log(`Connected to MongoDB successfully, using database: ${currentDbName}`)
    return { 
      connected: true, 
      mongoClient, 
      currentDb, 
      currentDbName 
    }
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`)
    return { 
      connected: false,
      error 
    }
  }
}