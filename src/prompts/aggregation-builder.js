// src/prompts/aggregation-builder.js

import { z } from 'zod'
import { getCurrentDbName } from '../db/client.js'
import { log } from '../config/index.js'

/**
 * Implements the 'aggregation-builder' prompt for MongoDB Lens
 * Helps users construct MongoDB aggregation pipelines
 */
export default function aggregationBuilderPrompt(server) {
  server.prompt(
    'aggregation-builder',
    'Help construct MongoDB aggregation pipelines',
    {
      collection: z.string().min(1).describe('Collection name for aggregation'),
      goal: z.string().describe('What you want to calculate or analyze')
    },
    ({ collection, goal }) => {
      log(`Prompt: Initializing aggregationBuilder for collection '${collection}' with goal: "${goal}".`)
      const currentDbName = getCurrentDbName()
      
      return {
        description: `MongoDB Aggregation Pipeline Builder for ${collection}`,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `I need to create a MongoDB aggregation pipeline for the '${collection}' collection to ${goal}.

Please help me create:
1. A complete aggregation pipeline as a JSON array
2. An explanation of each stage in the pipeline
3. How to execute this with the aggregateData tool

Remember: I'm working with the ${currentDbName} database and the ${collection} collection.`
            }
          }
        ]
      }
    }
  )
}