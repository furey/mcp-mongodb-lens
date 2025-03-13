import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync, existsSync } from 'fs'
import { 
  CACHE_TTL, 
  initMemoryCache, 
  monitorMemoryUsage, 
  getCachedData, 
  setCachedData, 
  clearMemoryCache 
} from './cache.js'
import { connectionOptions, connect, reconnect, extractDbNameFromConnectionString } from './connection.js'
import { Transform } from 'stream'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(dirname(dirname(__filename)))
const packageJson = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf8'))

// Environment & configuration
export const PACKAGE_VERSION = packageJson.version
export const VERBOSE_LOGGING = process.env.VERBOSE_LOGGING === 'true'
export const CONFIG_PATH = process.env.CONFIG_PATH || join(process.env.HOME || __dirname, '.mongodb-lens.json')

// Cache settings
export { 
  CACHE_TTL, 
  initMemoryCache, 
  getCachedData, 
  setCachedData,
  clearMemoryCache
}
export const memoryCache = initMemoryCache()

// Connection settings
export { connectionOptions, extractDbNameFromConnectionString }

// State variables
export let server = null
export let watchdog = null
export let transport = null
export let currentDb = null
export let configFile = null
export let mongoClient = null
export let currentDbName = null
export let connectionRetries = 0

// Error codes
export const JSONRPC_ERROR_CODES = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  SERVER_ERROR_START: -32000,
  SERVER_ERROR_END: -32099,
  MONGODB_CONNECTION_ERROR: -32050,
  MONGODB_QUERY_ERROR: -32051,
  MONGODB_SCHEMA_ERROR: -32052,
  RESOURCE_NOT_FOUND: -32040,
  RESOURCE_ACCESS_DENIED: -32041
}

// Server instruction text
export const instructions = `
MongoDB Lens is an MCP server that lets you interact with MongoDB databases through natural language.

Core capabilities include:

- Database exploration: List databases, view collections, analyze schemas
- Querying: Find documents, count, aggregate data, full-text search, geospatial queries
- Data management: Insert, update, delete documents, bulk operations, transactions
- Performance tools: Create indexes, explain queries, analyze patterns, view metrics
- Administration: Monitor server status, users, replication, sharding

Use tools like \`list-databases\`, \`find-documents\`, \`aggregate-data\`, \`create-index\`, and \`modify-document\` to interact with your data.

For complex tasks, use prompts like \`query-builder\`, \`schema-analysis\`, \`data-modeling\`, and \`sql-to-mongodb\` to get expert assistance.

Stream large result sets with \`streaming: true\` parameter and monitor real-time database changes with \`watch-changes\`.

For full documentation and examples, see: https://github.com/furey/mongodb-lens
`

// Utility functions
export const log = (message, forceLog = false) => {
  if (forceLog || VERBOSE_LOGGING) console.error(message)
}

export const loadConfigFile = () => {
  if (existsSync(CONFIG_PATH)) {
    try {
      const loadedConfig = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'))
      configFile = loadedConfig
      return loadedConfig
    } catch (error) {
      console.error(`Error loading config file: ${error.message}`)
      return null
    }
  }
  return null
}

export const attemptReconnect = async () => {
  const result = await reconnect(mongoClient, connectionRetries, log)
  connectionRetries = result.connectionRetries
  return result.success
}

export const connectToMongo = async (uri) => {
  const result = await connect(uri, configFile, memoryCache, log)
  if (result.connected) {
    mongoClient = result.mongoClient
    currentDb = result.currentDb
    currentDbName = result.currentDbName
  }
  return result.connected
}

export const startWatchdog = () => {
  if (watchdog) clearInterval(watchdog)
  
  watchdog = setInterval(() => {
    monitorMemoryUsage(memoryCache, 2000, 1500, log)

    const isClientConnected = mongoClient && mongoClient.topology && mongoClient.topology.isConnected()
    if (!isClientConnected) {
      log('Detected MongoDB disconnection. Attempting reconnect…', true)
      attemptReconnect()
    }
  }, 30000)
}

export const createStreamingResultStream = () => {
  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      callback(null, chunk)
    }
  })
}

// Event handling
export const setupEventListeners = () => {
  process.on('SIGTERM', async () => {
    log('Received SIGTERM, shutting down…')
    await cleanup()
    exit()
  })
  
  process.on('SIGINT', async () => {
    log('Received SIGINT, shutting down…')
    await cleanup()
    exit()
  })
}

export const cleanup = async () => {
  if (watchdog) {
    clearInterval(watchdog)
    watchdog = null
  }
  
  if (server) {
    try {
      log('Closing MCP server…')
      await server.close()
      log('MCP server closed.')
    } catch (error) {
      console.error('Error closing MCP server:', error)
    }
  }
  
  if (transport) {
    try {
      log('Closing transport…')
      await transport.close()
      log('Transport closed.')
    } catch (error) {
      console.error('Error closing transport:', error)
    }
  }
  
  if (mongoClient) {
    try {
      log('Closing MongoDB client…')
      await mongoClient.close()
      log('MongoDB client closed.')
    } catch (error) {
      console.error('Error closing MongoDB client:', error)
    }
  }
  
  clearMemoryCache(memoryCache)
}

export const exit = (exitCode = 1) => {
  log('Exiting…', true)
  process.exit(exitCode)
}