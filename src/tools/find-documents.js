// src/tools/find-documents.js

import { z } from 'zod'
import { withErrorHandling } from '../core/error-handling.js'
import { streamResultsToMcp } from '../core/server.js'
import { findDocuments, streamQuery } from '../db/document.js'
import { throwIfCollectionNotExists } from '../db/client.js'
import { formatDocuments, serializeDocument } from '../utils/formatting.js'
import { log } from '../config/index.js'

/**
 * Implements the 'find-documents' tool for MongoDB Lens
 * Run queries with filters, projections, sorting and optional streaming
 */
export default function findDocumentsTool(server) {
  server.tool(
    'find-documents',
    'Run queries with filters and projections',
    {
      collection: z.string().min(1).describe('Collection name'),
      filter: z.string().default('{}').describe('MongoDB query filter (JSON string)'),
      projection: z.string().optional().describe('Fields to include/exclude (JSON string)'),
      limit: z.number().int().min(1).default(10).describe('Maximum number of documents to return'),
      skip: z.number().int().min(0).default(0).describe('Number of documents to skip'),
      sort: z.string().optional().describe('Sort specification (JSON string)'),
      streaming: z.boolean().default(false).describe('Enable streaming for large result sets')
    },
    async ({ collection, filter, projection, limit, skip, sort, streaming }) => {
      return withErrorHandling(async () => {
        log(`Tool: Finding documents in collection '${collection}'…`)
        log(`Tool: Using filter: ${filter}`)
        if (projection) log(`Tool: Using projection: ${projection}`)
        if (sort) log(`Tool: Using sort: ${sort}`)
        log(`Tool: Using limit: ${limit}, skip: ${skip}, streaming: ${streaming}`)
        
        const parsedFilter = filter ? JSON.parse(filter) : {}
        const parsedProjection = projection ? JSON.parse(projection) : null
        const parsedSort = sort ? JSON.parse(sort) : null
        
        if (streaming) {
          await throwIfCollectionNotExists(collection)
          const query = await streamQuery(collection, parsedFilter, parsedProjection, limit, skip, parsedSort)
          
          const resourceUri = `mongodb://find/${collection}`
          const count = await streamResultsToMcp(
            query, 
            doc => JSON.stringify(serializeDocument(doc), null, 2),
            resourceUri,
            limit
          )
          
          return {
            content: [{
              type: 'text',
              text: `Streaming ${count} document${count === 1 ? '' : 's'} from collection '${collection}'.`
            }]
          }
        } else {
          const documents = await findDocuments(collection, parsedFilter, parsedProjection, limit, skip, parsedSort)
          log(`Tool: Found ${documents.length} documents in collection '${collection}'.`)
          return {
            content: [{
              type: 'text',
              text: formatDocuments(documents, limit)
            }]
          }
        }
      }, `Error finding documents in collection '${collection}'`)
    }
  )
}