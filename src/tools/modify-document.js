// src/tools/modify-document.js

import { z } from 'zod'
import { withErrorHandling } from '../core/error-handling.js'
import { log } from '../config/index.js'
import { modifyDocument } from '../db/document.js'
import { formatModifyResult } from '../utils/formatting.js'

/**
 * Implements the 'modify-document' tool for MongoDB Lens
 * Insert, update, or delete specific documents
 */
export default function modifyDocumentTool(server) {
  server.tool(
    'modify-document',
    'Insert, update, or delete specific documents',
    {
      collection: z.string().min(1).describe('Collection name'),
      operation: z.enum(['insert', 'update', 'delete']).describe('Operation type'),
      document: z.string().describe('Document as JSON string (for insert)'),
      filter: z.string().optional().describe('Filter as JSON string (for update/delete)'),
      update: z.string().optional().describe('Update operations as JSON string (for update)'),
      options: z.string().optional().describe('Options as JSON string')
    },
    async ({ collection, operation, document, filter, update, options }) => {
      return withErrorHandling(async () => {
        log(`Tool: Modifying documents in collection '${collection}' with operation '${operation}'…`)
        
        let result
        const parsedOptions = options ? JSON.parse(options) : {}
        
        if (operation === 'insert') {
          if (!document) throw new Error('Document is required for insert operation')
          const parsedDocument = JSON.parse(document)
          result = await modifyDocument(collection, operation, parsedDocument, null, parsedOptions)
          log(`Tool: Document inserted successfully.`)
        } else if (operation === 'update') {
          if (!filter) throw new Error('Filter is required for update operation')
          if (!update) throw new Error('Update is required for update operation')
          const parsedFilter = JSON.parse(filter)
          const parsedUpdate = JSON.parse(update)
          result = await modifyDocument(collection, operation, parsedUpdate, parsedFilter, parsedOptions)
          log(`Tool: Document(s) updated successfully.`)
        } else if (operation === 'delete') {
          if (!filter) throw new Error('Filter is required for delete operation')
          const parsedFilter = JSON.parse(filter)
          result = await modifyDocument(collection, operation, null, parsedFilter, parsedOptions)
          log(`Tool: Document(s) deleted successfully.`)
        }
        
        return {
          content: [{
            type: 'text',
            text: formatModifyResult(operation, result)
          }]
        }
      }, `Error in ${operation} operation on collection '${collection}'`)
    }
  )
}