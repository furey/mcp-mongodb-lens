// src/prompts/schema-analysis.js

import { z } from 'zod'
import { log } from '../config/index.js'
import { inferSchema } from '../db/client.js'
import { formatSchema } from '../utils/formatting.js'

/**
 * Implements the 'schema-analysis' prompt for MongoDB Lens
 * Analyze collection schema and recommend improvements
 */
export default function schemaAnalysisPrompt(server) {
  server.prompt(
    'schema-analysis',
    'Analyze collection schema and recommend improvements',
    {
      collection: z.string().min(1).describe('Collection name to analyze')
    },
    async ({ collection }) => {
      log(`Prompt: Initializing schemaAnalysis for collection '${collection}'…`)
      const schema = await inferSchema(collection)
      log(`Prompt: Retrieved schema for '${collection}' with ${Object.keys(schema.fields).length} fields.`)
      return {
        description: `MongoDB Schema Analysis for ${collection}`,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Please analyze the schema of the '${collection}' collection and provide recommendations:

Here's the current schema:
${formatSchema(schema)}

Could you help with:
1. Identifying any schema design issues or inconsistencies
2. Suggesting schema improvements for better performance
3. Recommending appropriate indexes based on the data structure
4. Best practices for this type of data model
5. Any potential MongoDB-specific optimizations`
            }
          }
        ]
      }
    }
  )
}