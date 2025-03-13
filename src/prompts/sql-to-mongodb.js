// src/prompts/sql-to-mongodb.js

import { z } from 'zod'
import { getCurrentDbName } from '../db/client.js'
import { log } from '../config/index.js'

/**
 * Implements the 'sql-to-mongodb' prompt for MongoDB Lens
 * Convert SQL queries to MongoDB aggregation pipelines
 */
export default function sqlToMongodbPrompt(server) {
  server.prompt(
    'sql-to-mongodb',
    'Convert SQL queries to MongoDB aggregation pipelines',
    {
      sqlQuery: z.string().min(1).describe('SQL query to convert'),
      targetCollection: z.string().optional().describe('Target MongoDB collection name')
    },
    ({ sqlQuery, targetCollection }) => {
      log(`Prompt: Initializing sqlToMongodb for query: "${sqlQuery}".`)
      const currentDbName = getCurrentDbName()
      
      return {
        description: 'SQL to MongoDB Query Translator',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Please convert this SQL query to MongoDB syntax:\n\n\`\`\`sql\n${sqlQuery}\n\`\`\`\n\n${targetCollection ? `Target collection: ${targetCollection}` : ''}\n\nI need:
  1. The equivalent MongoDB query/aggregation pipeline with proper MongoDB operators
  2. Explanation of how each part of the SQL query maps to MongoDB
  3. How to execute this using MongoDB Lens tools
  4. Any important considerations or MongoDB-specific optimizations
  
  Please provide both the find() query format (if applicable) and the aggregation pipeline format.`
            }
          }
        ]
      }
    }
  )
}