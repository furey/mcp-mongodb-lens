// src/resources/databases.js

import { listDatabases } from '../db/client.js'
import { formatDatabasesList } from '../utils/formatting.js'
import { withErrorHandling } from '../core/error-handling.js'
import { log } from '../config/index.js'

/**
 * Implements the 'databases' resource for MongoDB Lens
 * Lists all accessible MongoDB databases with their sizes
 */
export default function databasesResource(server) {
  server.resource(
    'databases',
    'mongodb://databases',
    { description: 'List of all accessible MongoDB databases' },
    async () => {
      return withErrorHandling(async () => {
        log('Resource: Retrieving list of databases…')
        const dbs = await listDatabases()
        log(`Resource: Found ${dbs.length} databases.`)
        return {
          contents: [{
            uri: 'mongodb://databases',
            text: formatDatabasesList(dbs)
          }]
        }
      }, 'Error listing databases')
    }
  )
}