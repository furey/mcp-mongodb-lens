// src/tools/distinct-values.js

import { z } from 'zod'
import { withErrorHandling } from '../core/error-handling.js'
import { log } from '../config/index.js'
import { getDistinctValues } from '../db/document.js'
import { formatDistinctValues } from '../utils/formatting.js'

/**
 * Implements the 'distinct-values' tool for MongoDB Lens
 * Get unique values for a field
 */
export default function distinctValuesTool(server) {
  server.tool(
    'distinct-values',
    'Get unique values for a field',
    {
      collection: z.string().min(1).describe('Collection name'),
      field: z.string().min(1).describe('Field name to get distinct values for'),
      filter: z.string().default('{}').describe('Optional filter as JSON string')
    },
    async ({ collection, field, filter }) => {
      return withErrorHandling(async () => {
        log(`Tool: Getting distinct values for field '${field}' in collection '${collection}'…`)
        log(`Tool: Using filter: ${filter}`)
        
        const parsedFilter = filter ? JSON.parse(filter) : {}
        const values = await getDistinctValues(collection, field, parsedFilter)
        log(`Tool: Found ${values.length} distinct values.`)
        return {
          content: [{
            type: 'text',
            text: formatDistinctValues(field, values)
          }]
        }
      }, `Error getting distinct values for field '${field}' in collection '${collection}'`)
    }
  )
}