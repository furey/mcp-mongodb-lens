// src/tools/get-stats.js

import { z } from 'zod'
import { withErrorHandling } from '../core/error-handling.js'
import { log } from '../config/index.js'
import { getDatabaseStats, getCollectionStats } from '../db/client.js'
import { formatStats } from '../utils/formatting.js'

/**
 * Implements the 'get-stats' tool for MongoDB Lens
 * Get database or collection statistics
 */
export default function getStatsTool(server) {
  server.tool(
    'get-stats',
    'Get database or collection statistics',
    {
      target: z.enum(['database', 'collection']).describe('Target type'),
      name: z.string().optional().describe('Collection name (for collection stats)')
    },
    async ({ target, name }) => {
      return withErrorHandling(async () => {
        let stats
        if (target === 'database') {
          log(`Tool: Getting statistics for database…`)
          stats = await getDatabaseStats()
          log(`Tool: Retrieved database statistics.`)
        } else if (target === 'collection') {
          if (!name) throw new Error('Collection name is required for collection stats')
          log(`Tool: Getting statistics for collection '${name}'…`)
          stats = await getCollectionStats(name)
          log(`Tool: Retrieved collection statistics.`)
        }
        
        return {
          content: [{
            type: 'text',
            text: formatStats(stats)
          }]
        }
      }, `Error getting stats for ${target}${target === 'collection' ? ' ' + name : ''}`)
    }
  )
}