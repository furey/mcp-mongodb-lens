// src/tools/drop-collection.js

import { z } from 'zod'
import { withErrorHandling } from '../core/error-handling.js'
import { log } from '../config/index.js'
import { dropCollection } from '../db/client.js'

/**
 * Implements the 'drop-collection' tool for MongoDB Lens
 * Remove a collection
 */
export default function dropCollectionTool(server) {
  server.tool(
    'drop-collection',
    'Remove a collection',
    {
      name: z.string().min(1).describe('Collection name')
    },
    async ({ name }) => {
      return withErrorHandling(async () => {
        log(`Tool: Dropping collection '${name}'…`)
        
        const result = await dropCollection(name)
        log(`Tool: Collection dropped successfully.`)
        return {
          content: [{
            type: 'text',
            text: `Collection '${name}' dropped successfully.`
          }]
        }
      }, `Error dropping collection '${name}'`)
    }
  )
}