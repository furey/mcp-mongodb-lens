// src/tools/analyze-schema.js

import { z } from 'zod'
import { withErrorHandling } from '../core/error-handling.js'
import { inferSchema } from '../db/client.js'
import { formatSchema } from '../utils/formatting.js'
import { log } from '../config/index.js'

/**
 * Implements the 'analyze-schema' tool for MongoDB Lens
 * Automatically infer schema from collection
 */
export default function analyzeSchemasTool(server) {
  server.tool(
    'analyze-schema',
    'Automatically infer schema from collection',
    {
      collection: z.string().min(1).describe('Collection name'),
      sampleSize: z.number().int().min(1).default(100).describe('Number of documents to sample')
    },
    async ({ collection, sampleSize }) => {
      return withErrorHandling(async () => {
        log(`Tool: Analyzing schema for collection '${collection}' with sample size ${sampleSize}…`)
        const schema = await inferSchema(collection, sampleSize)
        log(`Tool: Schema analysis complete for '${collection}', found ${Object.keys(schema.fields).length} fields.`)
        return {
          content: [{
            type: 'text',
            text: formatSchema(schema)
          }]
        }
      }, `Error inferring schema for collection '${collection}'`)
    }
  )
}