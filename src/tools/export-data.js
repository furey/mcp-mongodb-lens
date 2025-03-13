// src/tools/export-data.js

import { z } from 'zod'
import { withErrorHandling } from '../core/error-handling.js'
import { 
  throwIfCollectionNotExists,
  getCurrentDb
} from '../db/client.js'
import { 
  getNestedValue
} from '../utils/schema.js'
import { 
  formatCsvValue,
  serializeForExport
} from '../utils/formatting.js' 
import { log } from '../config/index.js'

/**
 * Implements the 'export-data' tool for MongoDB Lens
 * Exports query results to formatted JSON or CSV
 */
export default function exportDataTool(server) {
  server.tool(
    'export-data',
    'Export query results to formatted JSON or CSV',
    {
      collection: z.string().min(1).describe('Collection name'),
      filter: z.string().default('{}').describe('Filter as JSON string'),
      format: z.enum(['json', 'csv']).default('json').describe('Export format'),
      fields: z.string().optional().describe('Comma-separated list of fields to include (for CSV)'),
      limit: z.number().int().min(1).default(1000).describe('Maximum documents to export'),
      sort: z.string().optional().describe('Sort specification as JSON string (e.g. {"date": -1} for descending)')
    },
    async ({ collection, filter, format, fields, limit, sort }) => {
      return withErrorHandling(async () => {
        log(`Tool: Exporting data from collection '${collection}' in ${format} format…`)
        log(`Tool: Using filter: ${filter}`)
        if (sort) log(`Tool: Using sort: ${sort}`)
        log(`Tool: Max documents: ${limit}`)
        
        // Verify collection exists
        await throwIfCollectionNotExists(collection)
        
        // Parse parameters
        const parsedFilter = filter ? JSON.parse(filter) : {}
        const parsedSort = sort ? JSON.parse(sort) : null
        let fieldsArray = fields ? fields.split(',').map(f => f.trim()) : null
        
        // Set up and execute query
        const currentDb = getCurrentDb()
        const coll = currentDb.collection(collection)
        let query = coll.find(parsedFilter)
        
        if (parsedSort) query = query.sort(parsedSort)
        query = query.limit(limit)
        
        const documents = await query.toArray()
        log(`Tool: Found ${documents.length} documents to export.`)
        
        // Format the data for export
        const exportData = await formatExport(documents, format, fieldsArray)
        log(`Tool: Data exported successfully in ${format} format.`)
        
        return {
          content: [{
            type: 'text',
            text: exportData
          }]
        }
      }, `Error exporting data from collection '${collection}'`)
    }
  )
}

/**
 * Format documents for export in the requested format
 */
async function formatExport(documents, format, fields = null) {
  log(`DB Operation: Formatting ${documents.length} documents for export in ${format} format…`)
  try {
    if (format === 'json') {
      return JSON.stringify(documents, (key, value) => serializeForExport(value), 2)
    } else if (format === 'csv') {
      if (!fields || !fields.length) {
        if (documents.length > 0) {
          fields = Object.keys(documents[0])
        } else {
          return 'No documents found for export'
        }
      }
      
      let csv = fields.join(',') + '\n'
      
      for (const doc of documents) {
        const row = fields.map(field => {
          const value = getNestedValue(doc, field)
          return formatCsvValue(value)
        })
        csv += row.join(',') + '\n'
      }
      
      return csv
    }
    
    throw new Error(`Unsupported export format: ${format}`)
  } catch (error) {
    log(`DB Operation: Export formatting failed: ${error.message}`)
    throw error
  }
}