import mongodb from 'mongodb'
import { 
  currentDb, 
  currentDbName, 
  log, 
  memoryCache, 
  mongoClient, 
  CACHE_TTL,
  getCachedData,
  setCachedData
} from '../config/index.js'
import { inferSchema } from './schema.js'

const { ObjectId } = mongodb

// Client accessors
export const getMongoClient = () => mongoClient
export const getCurrentDb = () => currentDb
export const getCurrentDbName = () => currentDbName

// Database operations
export const listDatabases = async () => {
  log('DB Operation: Listing databases…')
  const adminDb = mongoClient.db('admin')
  const result = await adminDb.admin().listDatabases()
  log(`DB Operation: Found ${result.databases.length} databases.`)
  return result.databases
}

export const switchDatabase = async (dbName) => {
  log(`DB Operation: Switching to database '${dbName}'…`)
  try {
    const dbs = await listDatabases()
    const dbExists = dbs.some(db => db.name === dbName)
    if (!dbExists) throw new Error(`Database '${dbName}' does not exist`)
    currentDbName = dbName
    currentDb = mongoClient.db(dbName)
    log(`DB Operation: Successfully switched to database '${dbName}'.`)
    return currentDb
  } catch (error) {
    log(`DB Operation: Failed to switch to database '${dbName}': ${error.message}`)
    throw error
  }
}

export const getDatabaseStats = async () => {
  log(`DB Operation: Getting statistics for database '${currentDbName}'…`)
  const stats = await currentDb.stats()
  log(`DB Operation: Retrieved database statistics.`)
  return stats
}

export const getServerStatus = async () => {
  log('DB Operation: Getting server status…')
  try {
    const cacheKey = 'server_status'
    const cachedData = getCachedData(memoryCache, 'serverStatus', cacheKey, CACHE_TTL.SERVER_STATUS)
    
    if (cachedData) {
      log('DB Operation: Using cached server status')
      return cachedData
    }
    
    const adminDb = mongoClient.db('admin')
    const status = await adminDb.command({ serverStatus: 1 })
    log('DB Operation: Retrieved server status.')
    
    setCachedData(memoryCache, 'serverStatus', cacheKey, status)
    
    return status
  } catch (error) {
    log(`DB Operation: Error getting server status: ${error.message}`)
    return {
      host: mongoClient.s.options.host || 'unknown',
      port: mongoClient.s.options.port || 'unknown',
      version: 'Information unavailable',
      error: error.message
    }
  }
}

export const getReplicaSetStatus = async () => {
  log('DB Operation: Getting replica set status…')
  try {
    const adminDb = mongoClient.db('admin')
    const status = await adminDb.command({ replSetGetStatus: 1 })
    log('DB Operation: Retrieved replica set status.')
    return status
  } catch (error) {
    log(`DB Operation: Error getting replica set status: ${error.message}`)
    return {
      isReplicaSet: false,
      info: 'This server is not part of a replica set or you may not have permissions to view replica set status.',
      error: error.message
    }
  }
}

export const getDatabaseUsers = async () => {
  log(`DB Operation: Getting users for database '${currentDbName}'…`)
  try {
    const users = await currentDb.command({ usersInfo: 1 })
    log(`DB Operation: Retrieved user information.`)
    return users
  } catch (error) {
    log(`DB Operation: Error getting users: ${error.message}`)
    return { 
      users: [],
      info: 'Could not retrieve user information. You may not have sufficient permissions.',
      error: error.message
    }
  }
}

export const getStoredFunctions = async () => {
  log(`DB Operation: Getting stored JavaScript functions…`)
  try {
    const system = currentDb.collection('system.js')
    const functions = await system.find({}).toArray()
    log(`DB Operation: Retrieved ${functions.length} stored functions.`)
    return functions
  } catch (error) {
    log(`DB Operation: Error getting stored functions: ${error.message}`)
    return []
  }
}

// Collection operations
export const collectionExists = async (collectionName) => {
  if (!currentDb) throw new Error('No database selected')
  const collections = await currentDb.listCollections().toArray()
  return collections.some(coll => coll.name === collectionName)
}

export const throwIfCollectionNotExists = async (collectionName) => {
  if (!await collectionExists(collectionName)) {
    throw new Error(`Collection '${collectionName}' does not exist`)
  }
}

// Export schema-related functions
export { inferSchema } from './schema.js'

export const listCollections = async () => {
  log(`DB Operation: Listing collections in database '${currentDbName}'…`)
  try {
    if (!currentDb) throw new Error("No database selected")

    const cacheKey = currentDbName
    const cachedData = getCachedData(memoryCache, 'collections', cacheKey, CACHE_TTL.COLLECTIONS)
    
    if (cachedData) {
      log(`DB Operation: Using cached collections list for '${currentDbName}'`)
      return cachedData
    }

    const collections = await currentDb.listCollections().toArray()
    log(`DB Operation: Found ${collections.length} collections.`)

    setCachedData(memoryCache, 'collections', cacheKey, collections)
    
    return collections
  } catch (error) {
    log(`DB Operation: Failed to list collections: ${error.message}`)
    throw error
  }
}

export const getCollectionStats = async (collectionName) => {
  log(`DB Operation: Getting statistics for collection '${collectionName}'…`)
  try {
    await throwIfCollectionNotExists(collectionName)
    
    const cacheKey = `${currentDbName}.${collectionName}`
    const cachedData = getCachedData(memoryCache, 'stats', cacheKey, CACHE_TTL.STATS)
    
    if (cachedData) {
      log(`DB Operation: Using cached stats for '${collectionName}'`)
      return cachedData
    }
    
    const stats = await currentDb.collection(collectionName).stats()
    log(`DB Operation: Retrieved statistics for collection '${collectionName}'.`)
    
    setCachedData(memoryCache, 'stats', cacheKey, stats)
    
    return stats
  } catch (error) {
    log(`DB Operation: Failed to get statistics for collection '${collectionName}': ${error.message}`)
    throw error
  }
}

export const getCollectionIndexes = async (collectionName) => {
  log(`DB Operation: Getting indexes for collection '${collectionName}'…`)
  try {
    await throwIfCollectionNotExists(collectionName)

    const cacheKey = `${currentDbName}.${collectionName}`
    const cachedData = getCachedData(memoryCache, 'indexes', cacheKey, CACHE_TTL.INDEXES)
    
    if (cachedData) {
      log(`DB Operation: Using cached indexes for '${collectionName}'`)
      return cachedData
    }

    const indexes = await currentDb.collection(collectionName).indexes()
    log(`DB Operation: Retrieved ${indexes.length} indexes for collection '${collectionName}'.`)

    try {
      const stats = await currentDb.command({ collStats: collectionName, indexDetails: true })
      if (stats && stats.indexDetails) {
        for (const index of indexes) {
          if (stats.indexDetails[index.name]) {
            index.usage = stats.indexDetails[index.name]
          }
        }
      }
    } catch (statsError) {
      log(`DB Operation: Index usage stats not available: ${statsError.message}`)
    }

    setCachedData(memoryCache, 'indexes', cacheKey, indexes)
    
    return indexes
  } catch (error) {
    log(`DB Operation: Failed to get indexes for collection '${collectionName}': ${error.message}`)
    throw error
  }
}

export const getCollectionValidation = async (collectionName) => {
  log(`DB Operation: Getting validation rules for collection '${collectionName}'…`)
  try {
    await throwIfCollectionNotExists(collectionName)
    const collections = await currentDb.listCollections({ name: collectionName }, { validator: 1 }).toArray()
    log(`DB Operation: Retrieved validation information for collection '${collectionName}'.`)
    if (collections.length === 0) return { hasValidation: false }
    return {
      hasValidation: !!collections[0].options?.validator,
      validator: collections[0].options?.validator || {},
      validationLevel: collections[0].options?.validationLevel || 'strict',
      validationAction: collections[0].options?.validationAction || 'error'
    }
  } catch (error) {
    log(`DB Operation: Error getting validation for ${collectionName}: ${error.message}`)
    throw error
  }
}

export const getPerformanceMetrics = async () => {
  try {
    const adminDb = mongoClient.db('admin')
    const serverStatus = await adminDb.command({ serverStatus: 1 })
    const profileStats = await currentDb.command({ profile: -1 })

    const currentOps = await adminDb.command({ 
      currentOp: 1, 
      active: true,
      secs_running: { $gt: 1 }
    })

    const perfStats = await currentDb.command({ dbStats: 1 })
    
    return {
      serverStatus: {
        connections: serverStatus.connections,
        network: serverStatus.network,
        opcounters: serverStatus.opcounters,
        wiredTiger: serverStatus.wiredTiger?.cache,
        mem: serverStatus.mem,
        locks: serverStatus.locks
      },
      profileSettings: profileStats,
      currentOperations: currentOps.inprog,
      performance: perfStats
    }
  } catch (error) {
    log(`Error getting performance metrics: ${error.message}`)
    return { error: error.message }
  }
}

export const getDatabaseTriggers = async () => {
  try {
    const changeStreamInfo = {
      supported: true,
      resumeTokenSupported: true,
      updateLookupSupported: true,
      fullDocumentBeforeChangeSupported: true
    }
    
    const triggerCollections = await currentDb.listCollections({ name: /trigger|event|notification/i }).toArray()
    const system = currentDb.collection('system.js')
    const triggerFunctions = await system.find({ _id: /trigger|event|watch|notify/i }).toArray()
    
    return {
      changeStreams: changeStreamInfo,
      triggerCollections,
      triggerFunctions
    }
  } catch (error) {
    log(`Error getting database triggers: ${error.message}`)
    return { 
      error: error.message,
      supported: false
    }
  }
}

export const createUser = async (username, password, roles) => {
  log(`DB Operation: Creating user '${username}' with roles: ${JSON.stringify(roles)}…`)
  try {
    await currentDb.command({
      createUser: username,
      pwd: password,
      roles: roles
    })
    log(`DB Operation: User created successfully.`)
  } catch (error) {
    log(`DB Operation: Failed to create user: ${error.message}`)
    throw error
  }
}

export const dropUser = async (username) => {
  log(`DB Operation: Dropping user '${username}'…`)
  try {
    await currentDb.command({
      dropUser: username
    })
    log(`DB Operation: User dropped successfully.`)
  } catch (error) {
    log(`DB Operation: Failed to drop user: ${error.message}`)
    throw error
  }
}

export const validateCollection = async (collectionName, full = false) => {
  log(`DB Operation: Validating collection '${collectionName}'…`)
  try {
    await throwIfCollectionNotExists(collectionName)    
    const result = await currentDb.command({ validate: collectionName, full })
    if (!result) throw new Error(`Validation returned no result`)
    log(`DB Operation: Collection validation complete.`)
    return result
  } catch (error) {
    log(`DB Operation: Collection validation failed: ${error.message}`)
    throw error
  }
}

export const createCollection = async (name, options = {}) => {
  log(`DB Operation: Creating collection '${name}'…`)
  try {
    const result = await currentDb.createCollection(name, options)
    
    if (!result || !result.collectionName || result.collectionName !== name) {
      const errorMsg = "Collection creation did not return a valid collection"
      log(`DB Operation: Collection creation failed: ${errorMsg}`)
      throw new Error(errorMsg)
    }
    
    log(`DB Operation: Collection created successfully.`)
    return { success: true, name }
  } catch (error) {
    log(`DB Operation: Collection creation failed: ${error.message}`)
    throw error
  }
}

export const dropCollection = async (name) => {
  log(`DB Operation: Dropping collection '${name}'…`)
  try {
    const result = await currentDb.collection(name).drop()

    if (result !== true) {
      const errorMsg = "Collection drop operation did not return success"
      log(`DB Operation: Collection drop failed: ${errorMsg}`)
      throw new Error(errorMsg)
    }

    log(`DB Operation: Collection dropped successfully.`)
    return { success: result, name }
  } catch (error) {
    log(`DB Operation: Collection drop failed: ${error.message}`)
    throw error
  }
}

export const renameCollection = async (oldName, newName, dropTarget = false) => {
  log(`DB Operation: Renaming collection from '${oldName}' to '${newName}'…`)
  try {
    const result = await currentDb.collection(oldName).rename(newName, { dropTarget })

    if (!result || !result.collectionName || result.collectionName !== newName) {
      const errorMsg = "Collection rename did not return a valid collection"
      log(`DB Operation: Collection rename failed: ${errorMsg}`)
      throw new Error(errorMsg)
    }

    log(`DB Operation: Collection renamed successfully.`)
    return { success: true, oldName, newName }
  } catch (error) {
    log(`DB Operation: Collection rename failed: ${error.message}`)
    throw error
  }
}

export const getShardingDbStatus = async (dbName) => {
  try {
    const config = mongoClient.db('config')
    return await config.collection('databases').findOne({ _id: dbName })
  } catch (error) {
    log(`Error getting database sharding status: ${error.message}`)
    return null
  }
}

export const getShardingCollectionStatus = async (dbName, collName) => {
  try {
    const config = mongoClient.db('config')
    return await config.collection('collections').findOne({ _id: `${dbName}.${collName}` })
  } catch (error) {
    log(`Error getting collection sharding status: ${error.message}`)
    return null
  }
}

export const getFileId = async (bucket, filename) => {
  const file = await currentDb.collection(`${bucket}.files`).findOne({ filename })
  if (!file) throw new Error(`File '${filename}' not found`)
  return file._id
}