// src/resources/collections.js

import { listCollections } from '../db/client.js'
import { formatCollectionsList } from '../utils/formatting.js'
import { withErrorHandling } from '../core/error-handling.js'
import { log } from '../config/index.js'

/**
 * Implements the 'collections' resource for MongoDB Lens
 * Lists collections in the current database
 */
export default function collectionsResource(server) {
  server.resource(
    'collections',
    'mongodb://collections',
    { description: 'List of collections in the current database' },
    async () => {
      return withErrorHandling(async () => {
        log(`Resource: Retrieving collections from current database…`)
        const collections = await listCollections()
        log(`Resource: Found ${collections.length} collections.`)
        return {
          contents: [{
            uri: 'mongodb://collections',
            text: formatCollectionsList(collections)
          }]
        }
      }, 'Error listing collections')
    }
  )
}