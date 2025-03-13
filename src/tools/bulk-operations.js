// src/tools/bulk-operations.js

import { z } from 'zod'
import { withErrorHandling } from '../core/error-handling.js'
import { log } from '../config/index.js'
import { bulkOperations } from '../db/document.js'
import { formatBulkResult } from '../utils/formatting.js'

/**
 * Implements the 'bulk-operations' tool for MongoDB Lens
 * Perform multiple operations efficiently
 */
export default function bulkOperationsTool(server) {
  server.tool(
    'bulk-operations',
    'Perform multiple operations efficiently',
    {
      collection: z.string().min(1).describe('Collection name'),
      operations: z.string().describe('Array of operations as JSON string'),
      ordered: z.boolean().default(true).describe('Whether operations should be performed in order')
    },
    async ({ collection, operations, ordered }) => {
      return withErrorHandling(async () => {
        log(`Tool: Performing bulk operations on collection '${collection}'…`)
        log(`Tool: Ordered: ${ordered}`)
        
        const parsedOperations = JSON.parse(operations)
        const result = await bulkOperations(collection, parsedOperations, ordered)
        log(`Tool: Bulk operations complete.`)
        
        return {
          content: [{
            type: 'text',
            text: formatBulkResult(result)
          }]
        }
      }, `Error in bulk operations on collection '${collection}'`)
    }
  )
}