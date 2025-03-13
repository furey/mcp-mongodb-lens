// src/tools/text-search.js

import { z } from 'zod'
import { withErrorHandling } from '../core/error-handling.js'
import { log } from '../config/index.js'
import { findDocuments } from '../db/document.js'
import { formatTextSearchResults } from '../utils/formatting.js'

/**
 * Implements the 'text-search' tool for MongoDB Lens
 * Perform full-text search across text-indexed fields
 */
export default function textSearchTool(server) {
  server.tool(
    'text-search',
    'Perform full-text search across text-indexed fields',
    {
      collection: z.string().min(1).describe('Collection name'),
      searchText: z.string().min(1).describe('Text to search for'),
      language: z.string().optional().describe('Optional language for text search'),
      caseSensitive: z.boolean().default(false).describe('Case sensitive search'),
      diacriticSensitive: z.boolean().default(false).describe('Diacritic sensitive search'),
      limit: z.number().int().min(1).default(10).describe('Maximum results to return')
    },
    async ({ collection, searchText, language, caseSensitive, diacriticSensitive, limit }) => {
      return withErrorHandling(async () => {
        log(`Tool: Performing text search in collection '${collection}' for: "${searchText}"`)
        
        const textSearchOptions = {}
        if (language) textSearchOptions.language = language
        if (caseSensitive) textSearchOptions.caseSensitive = true
        if (diacriticSensitive) textSearchOptions.diacriticSensitive = true
        
        const query = { $text: { $search: searchText, ...textSearchOptions } }
        const projection = { score: { $meta: 'textScore' } }
        const sort = { score: { $meta: 'textScore' } }
        
        const results = await findDocuments(collection, query, projection, limit, 0, sort)
        
        return {
          content: [{
            type: 'text',
            text: formatTextSearchResults(results, searchText)
          }]
        }
      }, `Error performing text search in collection '${collection}'`)
    }
  )
}