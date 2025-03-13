// src/tools/list-collections.js

import { withErrorHandling } from '../core/error-handling.js'
import { getCurrentDbName, listCollections } from '../db/client.js'
import { formatCollectionsList } from '../utils/formatting.js'
import { log } from '../config/index.js'

/**
 * Implements the 'list-collections' tool for MongoDB Lens
 * Lists collections in the current database
 */
export default function listCollectionsTool(server) {
  server.tool(
    'list-collections',
    'List collections in the current database',
    async () => {
      try {
        const dbName = getCurrentDbName()
        log(`Tool: Listing collections in database '${dbName}'…`)
        const collections = await listCollections()
        log(`Tool: Found ${collections.length} collections in database '${dbName}'.`)
        return {
          content: [{
            type: 'text',
            text: formatCollectionsList(collections)
          }]
        }
      } catch (error) {
        console.error('Error listing collections:', error)
        return {
          content: [{
            type: 'text',
            text: `Error listing collections: ${error.message}`
          }],
          isError: true
        }
      }
    }
  )
}