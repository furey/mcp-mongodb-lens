// src/tools/create-index.js

import { z } from 'zod'
import { withErrorHandling } from '../core/error-handling.js'
import { log } from '../config/index.js'
import { throwIfCollectionNotExists, getCurrentDb } from '../db/client.js'

/**
 * Create a new index on a collection
 */
async function createIndex(collectionName, keys, options = {}) {
  log(`DB Operation: Creating index on collection '${collectionName}'…`)
  log(`DB Operation: Index keys: ${JSON.stringify(keys)}`)
  if (Object.keys(options).length > 0) log(`DB Operation: Index options: ${JSON.stringify(options)}`)
  
  try {
    const currentDb = getCurrentDb()
    const collection = currentDb.collection(collectionName)
    const result = await collection.createIndex(keys, options)

    if (!result || typeof result !== 'string') {
      const errorMsg = "Index creation did not return a valid index name"
      log(`DB Operation: Index creation failed: ${errorMsg}`)
      throw new Error(errorMsg)
    }

    log(`DB Operation: Index created successfully: ${result}`)
    return result
  } catch (error) {
    log(`DB Operation: Index creation failed: ${error.message}`)
    throw error
  }
}

/**
 * Implements the 'create-index' tool for MongoDB Lens
 * Create new index on collection
 */
export default function createIndexTool(server) {
  server.tool(
    'create-index',
    'Create new index on collection',
    {
      collection: z.string().min(1).describe('Collection name'),
      keys: z.string().describe('Index keys as JSON object'),
      options: z.string().optional().describe('Index options as JSON object')
    },
    async ({ collection, keys, options }) => {
      return withErrorHandling(async () => {
        log(`Tool: Creating index on collection '${collection}'…`)
        log(`Tool: Index keys: ${keys}`)
        if (options) log(`Tool: Index options: ${options}`)
        
        await throwIfCollectionNotExists(collection)
        
        const parsedKeys = JSON.parse(keys)
        const parsedOptions = options ? JSON.parse(options) : {}
        
        const result = await createIndex(collection, parsedKeys, parsedOptions)
        log(`Tool: Index created successfully: ${result}`)
        return {
          content: [{
            type: 'text',
            text: `Index created: ${result}`
          }]
        }
      }, `Error creating index on collection '${collection}'`)
    }
  )
}