import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { 
  JSONRPC_ERROR_CODES,
  PACKAGE_VERSION,
  cleanup,
  connectToMongo,
  exit,
  instructions,
  log,
  startWatchdog
} from '../config/index.js'

export const setupServer = () => {
  const server = new McpServer({
    name: 'MongoDB Lens',
    version: PACKAGE_VERSION,
    description: 'MongoDB MCP server for natural language database interaction',
    homepage: 'https://github.com/furey/mongodb-lens',
    license: 'MIT',
    vendor: {
      name: 'James Furey',
      url: 'https://about.me/jamesfurey'
    }
  }, {
    instructions
  })

  server.fallbackRequestHandler = async (request) => {
    log(`Received request for undefined method: ${request.method}`, true)
    const error = new Error(`Method '${request.method}' not found`)
    error.code = JSONRPC_ERROR_CODES.METHOD_NOT_FOUND
    throw error
  }

  return server
}

export const initServer = async (mongoUri, registerFunctions = {}) => {
  log(`MongoDB Lens v${PACKAGE_VERSION} starting…`, true)
  
  const connected = await connectToMongo(mongoUri)
  if (!connected) {
    log('Failed to connect to MongoDB database.', true)
    return false
  }
  
  startWatchdog()
  
  log('Initializing MCP server…')
  const mcpServer = setupServer()
  
  const { registerResources, registerTools, registerPrompts } = registerFunctions
  
  if (registerResources) {
    log('Registering MCP resources…')
    registerResources(mcpServer)
  }
  
  if (registerTools) {
    log('Registering MCP tools…')
    registerTools(mcpServer)
  }
  
  if (registerPrompts) {
    log('Registering MCP prompts…')
    registerPrompts(mcpServer)
  }
  
  return mcpServer
}

export const streamResultsToMcp = async (resultStream, resultFormatter, resourceUri, streamingLimit = 10000) => {
  let count = 0
  const streamId = Math.random().toString(36).substring(2, 15)
  
  try {
    // Get the server instance from the global scope
    const { server } = await import('../config/index.js')
    const stream = server.createStreamingResource(`${resourceUri}?stream=${streamId}`)
    
    for await (const item of resultStream) {
      count++
      
      if (count > streamingLimit) {
        stream.write({
          contents: [{
            uri: resourceUri,
            text: `Reached streaming limit of ${streamingLimit} items. Use a more specific query to reduce result size.`
          }]
        })
        break
      }
      
      const formattedItem = resultFormatter(item)
      
      stream.write({
        contents: [{
          uri: resourceUri,
          text: formattedItem
        }]
      })
    }
    
    stream.end()
    return count
  } catch (error) {
    console.error('Error in streaming results:', error)
    throw error
  }
}

// Event handlers are now imported from config/index.js