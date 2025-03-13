// src/tools/collation-query.js

import { z } from 'zod'
import { withErrorHandling } from '../core/error-handling.js'
import { 
  throwIfCollectionNotExists,
  getCurrentDb
} from '../db/client.js'
import { formatCollationResults } from '../utils/formatting.js'
import { log } from '../config/index.js'

/**
 * Implements the 'collation-query' tool for MongoDB Lens
 * Finds documents with language-specific collation rules
 */
export default function collationQueryTool(server) {
  server.tool(
    'collation-query',
    'Find documents with language-specific collation rules',
    {
      collection: z.string().min(1).describe('Collection name'),
      filter: z.string().default('{}').describe('Query filter as JSON string'),
      locale: z.string().min(2).describe('Locale code (e.g., "en", "fr", "de")'),
      strength: z.number().int().min(1).max(5).default(3).describe('Collation strength (1-5)'),
      caseLevel: z.boolean().default(false).describe('Consider case in first-level differences'),
      sort: z.string().optional().describe('Sort specification as JSON string'),
      limit: z.number().int().min(1).default(10).describe('Maximum number of documents to return')
    },
    async ({ collection, filter, locale, strength, caseLevel, sort, limit }) => {
      return withErrorHandling(async () => {
        log(`Tool: Running collation query on collection '${collection}' with locale '${locale}'`)
        
        // Verify collection exists
        await throwIfCollectionNotExists(collection)
        
        // Parse parameters
        const parsedFilter = JSON.parse(filter)
        const parsedSort = sort ? JSON.parse(sort) : null
        
        // Build collation options
        const collationOptions = {
          locale,
          strength,
          caseLevel
        }
        
        // Set up and execute query
        const currentDb = getCurrentDb()
        const coll = currentDb.collection(collection)
        let query = coll.find(parsedFilter).collation(collationOptions)
        
        if (parsedSort) query = query.sort(parsedSort)
        if (limit) query = query.limit(limit)
        
        const results = await query.toArray()
        log(`Tool: Collation query returned ${results.length} documents.`)
        
        return {
          content: [{
            type: 'text',
            text: formatCollationResults(results, locale, strength, caseLevel)
          }]
        }
      }, `Error running collation query for collection '${collection}'`)
    }
  )
}