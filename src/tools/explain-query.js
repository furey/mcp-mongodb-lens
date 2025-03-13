// src/tools/explain-query.js

import { z } from 'zod'
import { withErrorHandling } from '../core/error-handling.js'
import { log } from '../config/index.js'
import { explainQuery } from '../db/document.js'
import { formatExplanation } from '../utils/formatting.js'

/**
 * Implements the 'explain-query' tool for MongoDB Lens
 * Analyze query performance
 */
export default function explainQueryTool(server) {
  server.tool(
    'explain-query',
    'Analyze query performance',
    {
      collection: z.string().min(1).describe('Collection name'),
      filter: z.string().describe('MongoDB query filter (JSON string)'),
      verbosity: z.enum(['queryPlanner', 'executionStats', 'allPlansExecution']).default('executionStats').describe('Explain verbosity level')
    },
    async ({ collection, filter, verbosity }) => {
      return withErrorHandling(async () => {
        log(`Tool: Explaining query on collection '${collection}'…`)
        log(`Tool: Filter: ${filter}`)
        log(`Tool: Verbosity level: ${verbosity}`)
        
        const parsedFilter = JSON.parse(filter)
        const explanation = await explainQuery(collection, parsedFilter, verbosity)
        log(`Tool: Query explanation generated.`)
        return {
          content: [{
            type: 'text',
            text: formatExplanation(explanation)
          }]
        }
      }, `Error explaining query on collection '${collection}'`)
    }
  )
}