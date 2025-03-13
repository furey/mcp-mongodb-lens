// src/tools/count-documents.js

import { z } from 'zod'
import { withErrorHandling } from '../core/error-handling.js'
import { countDocuments } from '../db/document.js'
import { log } from '../config/index.js'

/**
 * Implements the 'count-documents' tool for MongoDB Lens
 * Count documents with optional filter
 */
export default function countDocumentsTool(server) {
  server.tool(
    'count-documents',
    'Count documents with optional filter',
    {
      collection: z.string().min(1).describe('Collection name'),
      filter: z.string().default('{}').describe('MongoDB query filter (JSON string)')
    },
    async ({ collection, filter }) => {
      return withErrorHandling(async () => {
        log(`Tool: Counting documents in collection '${collection}'…`)
        log(`Tool: Using filter: ${filter}`)
        
        const parsedFilter = filter ? JSON.parse(filter) : {}
        const count = await countDocuments(collection, parsedFilter)
        log(`Tool: Count result: ${count} documents.`)
        return {
          content: [{
            type: 'text',
            text: `Count: ${count} document(s)`
          }]
        }
      }, `Error counting documents in collection '${collection}'`)
    }
  )
}