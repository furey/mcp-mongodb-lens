// src/prompts/index-recommendation.js

import { z } from 'zod'
import { getCurrentDbName } from '../db/client.js'
import { log } from '../config/index.js'

/**
 * Implements the 'index-recommendation' prompt for MongoDB Lens
 * Get index recommendations for query patterns
 */
export default function indexRecommendationPrompt(server) {
  server.prompt(
    'index-recommendation',
    'Get index recommendations for query patterns',
    {
      collection: z.string().min(1).describe('Collection name'),
      queryPattern: z.string().describe('Common query pattern or operation')
    },
    ({ collection, queryPattern }) => {
      log(`Prompt: Initializing indexRecommendation for collection '${collection}' with query pattern: "${queryPattern}".`)
      const currentDbName = getCurrentDbName()
      
      return {
        description: `MongoDB Index Recommendations for ${collection}`,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `I need index recommendations for the '${collection}' collection to optimize this query pattern: "${queryPattern}".

Please provide:
1. Recommended index(es) with proper key specification
2. Explanation of why this index would help
3. The exact command to create this index using the createIndex tool
4. How to verify the index is being used
5. Any potential trade-offs or considerations for this index

Remember: I'm working with the ${currentDbName} database and the ${collection} collection.`
            }
          }
        ]
      }
    }
  )
}