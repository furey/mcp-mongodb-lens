// src/tools/geo-query.js

import { z } from 'zod'
import { withErrorHandling } from '../core/error-handling.js'
import { 
  throwIfCollectionNotExists,
  getCurrentDb
} from '../db/client.js'
import { formatDocuments } from '../utils/formatting.js'
import { log } from '../config/index.js'

/**
 * Implements the 'geo-query' tool for MongoDB Lens
 * Runs geospatial queries with various operators (near, geoWithin, geoIntersects)
 */
export default function geoQueryTool(server) {
  server.tool(
    'geo-query',
    'Run geospatial queries with various operators',
    {
      collection: z.string().min(1).describe('Collection name'),
      operator: z.enum(['near', 'geoWithin', 'geoIntersects']).describe('Geospatial operator type'),
      field: z.string().min(1).describe('Geospatial field name'),
      geometry: z.string().describe('GeoJSON geometry as JSON string'),
      maxDistance: z.number().optional().describe('Maximum distance in meters (for near queries)'),
      limit: z.number().int().min(1).default(10).describe('Maximum number of documents to return')
    },
    async ({ collection, operator, field, geometry, maxDistance, limit }) => {
      return withErrorHandling(async () => {
        log(`Tool: Running geospatial query on collection '${collection}'…`)
        
        // Verify collection exists
        await throwIfCollectionNotExists(collection)
        
        // Parse geometry
        const geoJson = JSON.parse(geometry)
        
        // Build the query based on the operator
        let query = {}
        if (operator === 'near') {
          query[field] = { $near: { $geometry: geoJson } }
          if (maxDistance) query[field].$near.$maxDistance = maxDistance
        } else if (operator === 'geoWithin') {
          query[field] = { $geoWithin: { $geometry: geoJson } }
        } else if (operator === 'geoIntersects') {
          query[field] = { $geoIntersects: { $geometry: geoJson } }
        }
        
        // Set up and execute query
        const currentDb = getCurrentDb()
        const coll = currentDb.collection(collection)
        const results = await coll.find(query).limit(limit).toArray()
        
        log(`Tool: Geospatial query returned ${results.length} documents.`)
        
        return {
          content: [{
            type: 'text',
            text: formatDocuments(results, limit)
          }]
        }
      }, `Error running geospatial query for collection '${collection}'`)
    }
  )
}