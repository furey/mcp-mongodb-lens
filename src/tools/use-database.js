// src/tools/use-database.js

import { z } from 'zod'
import { switchDatabase } from '../db/client.js'
import { log } from '../config/index.js'

/**
 * Implements the 'use-database' tool for MongoDB Lens
 * Switches to a specific database
 */
export default function useDatabaseTool(server) {
  server.tool(
    'use-database',
    'Switch to a specific database',
    {
      database: z.string().min(1).describe('Database name to use')
    },
    async ({ database }) => {
      try {
        log(`Tool: Switching to database '${database}'…`)
        await switchDatabase(database)
        log(`Tool: Successfully switched to database '${database}'.`)
        return {
          content: [{
            type: 'text',
            text: `Switched to database: ${database}`
          }]
        }
      } catch (error) {
        console.error('Error switching database:', error)
        return {
          content: [{
            type: 'text',
            text: `Error switching database: ${error.message}`
          }],
          isError: true
        }
      }
    }
  )
}