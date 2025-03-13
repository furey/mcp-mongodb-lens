// src/tools/validate-collection.js

import { z } from 'zod'
import { withErrorHandling } from '../core/error-handling.js'
import { log } from '../config/index.js'
import { validateCollection } from '../db/client.js'
import { formatValidationResults } from '../utils/formatting.js'

/**
 * Implements the 'validate-collection' tool for MongoDB Lens
 * Run validation on a collection to check for inconsistencies
 */
export default function validateCollectionTool(server) {
  server.tool(
    'validate-collection',
    'Run validation on a collection to check for inconsistencies',
    {
      collection: z.string().min(1).describe('Collection name'),
      full: z.boolean().default(false).describe('Perform full validation (slower but more thorough)')
    },
    async ({ collection, full }) => {
      return withErrorHandling(async () => {
        log(`Tool: Validating collection '${collection}'…`)
        log(`Tool: Full validation: ${full}`)
        
        const results = await validateCollection(collection, full)
        log(`Tool: Validation complete.`)
        return {
          content: [{
            type: 'text',
            text: formatValidationResults(results)
          }]
        }
      }, `Error validating collection '${collection}'`)
    }
  )
}