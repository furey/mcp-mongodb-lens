// src/tools/aggregate-data.js

import { z } from 'zod'
import { withErrorHandling } from '../core/error-handling.js'
import { streamResultsToMcp } from '../core/server.js'
import { aggregateData } from '../db/document.js'
import { throwIfCollectionNotExists, getCurrentDb } from '../db/client.js'
import { formatDocuments, serializeDocument } from '../utils/formatting.js'
import { log } from '../config/index.js'

/**
 * Process an aggregation pipeline for sanitization
 */
const processAggregationPipeline = (pipeline) => {
  if (!pipeline || !Array.isArray(pipeline)) return pipeline
  
  return pipeline.map(stage => {
    for (const operator in stage) {
      const value = stage[operator]
      if (typeof value === 'object' && value !== null) {
        if (operator === '$match' && value.$text) {
          if (value.$text.$search && typeof value.$text.$search === 'string') {
            value.$text.$search = sanitizeTextSearch(value.$text.$search)
          }
        }
      }
    }
    return stage
  })
}

/**
 * Sanitize text search input
 */
const sanitizeTextSearch = (searchText) => {
  if (!searchText) return ''
  return searchText.replace(/\$/g, '').replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
}

/**
 * Implements the 'aggregate-data' tool for MongoDB Lens
 * Run aggregation pipelines
 */
export default function aggregateDataTool(server) {
  server.tool(
    'aggregate-data',
    'Run aggregation pipelines',
    {
      collection: z.string().min(1).describe('Collection name'),
      pipeline: z.string().describe('Aggregation pipeline as JSON string array'),
      streaming: z.boolean().default(false).describe('Enable streaming results for large datasets'),
      limit: z.number().int().min(1).default(1000).describe('Maximum number of results to return when streaming')
    },
    async ({ collection, pipeline, streaming, limit }) => {
      return withErrorHandling(async () => {
        log(`Tool: Running aggregation on collection '${collection}'…`)
        log(`Tool: Using pipeline: ${pipeline}`)
        log(`Tool: Streaming: ${streaming}, Limit: ${limit}`)
        
        const parsedPipeline = JSON.parse(pipeline)
        const processedPipeline = processAggregationPipeline(parsedPipeline)
        
        if (streaming) {
          await throwIfCollectionNotExists(collection)
          const currentDb = getCurrentDb()
          const coll = currentDb.collection(collection)
          const cursor = coll.aggregate(processedPipeline, { 
            allowDiskUse: true,
            cursor: { batchSize: 20 }
          })
          
          const resourceUri = `mongodb://aggregation/${collection}`
          const count = await streamResultsToMcp(
            cursor, 
            doc => JSON.stringify(serializeDocument(doc), null, 2),
            resourceUri,
            limit
          )
          
          return {
            content: [{
              type: 'text',
              text: `Streaming ${count} aggregation results from collection '${collection}'.${count === limit ? " Results limited to first " + limit + " documents." : ""}`
            }]
          }
        } else {
          const results = await aggregateData(collection, processedPipeline)
          log(`Tool: Aggregation returned ${results.length} results.`)
          return {
            content: [{
              type: 'text',
              text: formatDocuments(results, 100)
            }]
          }
        }
      }, `Error running aggregation on collection '${collection}'`)
    }
  )
}