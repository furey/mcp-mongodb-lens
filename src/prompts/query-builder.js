// src/prompts/query-builder.js

import { z } from 'zod'
import { getCurrentDbName } from '../db/client.js'
import { log } from '../config/index.js'

/**
 * Implements the 'query-builder' prompt for MongoDB Lens
 * Helps users construct MongoDB query filters
 */
export default function queryBuilderPrompt(server) {
  server.prompt(
    'query-builder',
    'Help construct MongoDB query filters',
    {
      collection: z.string().min(1).describe('Collection name to query'),
      condition: z.string().describe('Describe the condition in natural language (e.g. "users older than 30")')
    },
    ({ collection, condition }) => {
      log(`Prompt: Initializing queryBuilder for collection '${collection}' with condition: "${condition}".`)
      const currentDbName = getCurrentDbName()
      
      return {
        description: `MongoDB Query Builder for ${collection}`,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Please help me create a MongoDB query for the '${collection}' collection based on this condition: "${condition}".

I need both the filter object and a complete example showing how to use it with the findDocuments tool.

Guidelines:
1. Create a valid MongoDB query filter as a JSON object
2. Show me how special MongoDB operators work if needed (like $gt, $in, etc.)
3. Provide a complete example of using this with the findDocuments tool
4. Suggest any relevant projections or sort options

Remember: I'm working with the ${currentDbName} database and the ${collection} collection.`
            }
          }
        ]
      }
    }
  )
}