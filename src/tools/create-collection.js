// src/tools/create-collection.js

import { z } from 'zod'
import { withErrorHandling } from '../core/error-handling.js'
import { log } from '../config/index.js'
import { createCollection } from '../db/client.js'

/**
 * Implements the 'create-collection' tool for MongoDB Lens
 * Create a new collection with options
 */
export default function createCollectionTool(server) {
  server.tool(
    'create-collection',
    'Create a new collection with options',
    {
      name: z.string().min(1).describe('Collection name'),
      options: z.string().default('{}').describe('Collection options as JSON string (capped, size, etc.)')
    },
    async ({ name, options }) => {
      return withErrorHandling(async () => {
        log(`Tool: Creating collection '${name}'…`)
        log(`Tool: Using options: ${options}`)
        
        const parsedOptions = options ? JSON.parse(options) : {}
        const result = await createCollection(name, parsedOptions)
        log(`Tool: Collection created successfully.`)
        return {
          content: [{
            type: 'text',
            text: `Collection '${name}' created successfully.`
          }]
        }
      }, `Error creating collection '${name}'`)
    }
  )
}