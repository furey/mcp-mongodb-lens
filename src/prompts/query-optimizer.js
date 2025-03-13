// src/prompts/query-optimizer.js

import { z } from 'zod'
import { log } from '../config/index.js'
import { getCollectionStats, getCollectionIndexes } from '../db/client.js'
import { formatStats, formatIndexes } from '../utils/formatting.js'

/**
 * Implements the 'query-optimizer' prompt for MongoDB Lens
 * Get optimization advice for slow queries
 */
export default function queryOptimizerPrompt(server) {
  server.prompt(
    'query-optimizer',
    'Get optimization advice for slow queries',
    {
      collection: z.string().min(1).describe('Collection name'),
      query: z.string().describe('The slow query (as a JSON filter)'),
      performance: z.string().optional().describe('Optional: current performance metrics')
    },
    async ({ collection, query, performance }) => {
      log(`Prompt: Initializing queryOptimizer for collection '${collection}' with query: ${query}.`)
      const stats = await getCollectionStats(collection)
      const indexes = await getCollectionIndexes(collection)
      return {
        description: 'MongoDB Query Optimization Advisor',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `I have a slow MongoDB query on the '${collection}' collection and need help optimizing it.

Query filter: ${query}

${performance ? `Current performance: ${performance}\n\n` : ''}
Collection stats:
${formatStats(stats)}

Current indexes:
${formatIndexes(indexes)}

Please provide:
1. Analysis of why this query might be slow
2. Recommend index changes (additions or modifications)
3. Suggest query structure improvements
4. Explain how to verify performance improvements
5. Other optimization techniques I should consider`
            }
          }
        ]
      }
    }
  )
}