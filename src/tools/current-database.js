// src/tools/current-database.js

import { getCurrentDbName } from '../db/client.js'
import { withErrorHandling } from '../core/error-handling.js'
import { log } from '../config/index.js'

/**
 * Implements the 'current-database' tool for MongoDB Lens
 * Shows the name of the current database
 */
export default function currentDatabaseTool(server) {
  server.tool(
    'current-database',
    'Get the name of the current database',
    async () => {
      return withErrorHandling(async () => {
        log('Tool: Getting current database name…')
        const dbName = getCurrentDbName()
        return {
          content: [{
            type: 'text',
            text: `Current database: ${dbName}`
          }]
        }
      }, 'Error getting current database')
    }
  )
}