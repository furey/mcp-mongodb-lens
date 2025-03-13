import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { log, transport } from '../config/index.js'

export const createTransport = async () => {
  log('Starting stdio transport…', true)
  const stdioTransport = new StdioServerTransport()
  return stdioTransport
}

export const connectTransport = async (server) => {
  if (!server) {
    throw new Error('Cannot connect transport to uninitialized server')
  }
  
  log('Creating transport…')
  const transportInstance = await createTransport()
  
  log('Connecting MCP server transport…')
  await server.connect(transportInstance)
  
  log('MongoDB Lens server running.', true)
  return transportInstance
}

export const closeTransport = async () => {
  if (transport) {
    try {
      log('Closing transport…')
      await transport.close()
      log('Transport closed.')
      return true
    } catch (error) {
      console.error('Error closing transport:', error)
      return false
    }
  }
  return true
}

export const processAggregationPipeline = (pipeline) => {
  if (!pipeline || !Array.isArray(pipeline)) return pipeline
  
  return pipeline.map(stage => {
    for (const operator in stage) {
      const value = stage[operator]
      if (typeof value === 'object' && value !== null) {
        if (operator === '$match' && value.$text) {
          if (value.$text.$search && typeof value.$text.$search === 'string') {
            value.$text.$search = sanitizeTextSearch(value.$text.$search)
          }
        }
      }
    }
    return stage
  })
}

export const sanitizeTextSearch = (searchText) => {
  if (!searchText) return ''
  return searchText.replace(/\$/g, '').replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
}

export const monitorBinarySize = (size) => {
  const mb = size / (1024 * 1024)
  if (mb > 10) {
    log(`Warning: Large binary data detected (${mb.toFixed(2)} MB)`, true)
  }
  return mb < 50
}