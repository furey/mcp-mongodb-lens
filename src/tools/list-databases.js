// src/tools/list-databases.js

import { z } from 'zod'
import { withErrorHandling } from '../core/error-handling.js'
import { listDatabases } from '../db/client.js'
import { formatDatabasesList } from '../utils/formatting.js'
import { log } from '../config/index.js'

/**
 * Implements the 'list-databases' tool for MongoDB Lens
 * Lists all accessible MongoDB databases with their sizes
 */
export default function listDatabasesTool(server) {
  server.tool(
    'list-databases',
    'List all accessible MongoDB databases',
    async () => {
      return withErrorHandling(async () => {
        log('Tool: Listing databases…')
        const dbs = await listDatabases()
        log(`Tool: Found ${dbs.length} databases.`)
        return {
          content: [{
            type: 'text',
            text: formatDatabasesList(dbs)
          }]
        }
      }, 'Error listing databases')
    }
  )
}