// src/tools/watch-changes.js

import { z } from 'zod'
import { withErrorHandling } from '../core/error-handling.js'
import { throwIfCollectionNotExists, getCurrentDb } from '../db/client.js'
import { formatChangeStreamResults } from '../utils/formatting.js'
import { log } from '../config/index.js'

/**
 * Implements the 'watch-changes' tool for MongoDB Lens
 * Watches for changes in a collection using MongoDB change streams
 */
export default function watchChangesTool(server) {
  server.tool(
    'watch-changes',
    'Watch for changes in a collection using change streams',
    {
      collection: z.string().min(1).describe('Collection name'),
      operations: z.array(z.enum(['insert', 'update', 'delete', 'replace'])).default(['insert', 'update', 'delete']).describe('Operations to watch'),
      duration: z.number().int().min(1).max(60).default(10).describe('Duration to watch in seconds'),
      fullDocument: z.boolean().default(false).describe('Include full document in update events')
    },
    async ({ collection, operations, duration, fullDocument }) => {
      return withErrorHandling(async () => {
        log(`Tool: Watching collection '${collection}' for changes…`)
        
        // Verify the collection exists
        await throwIfCollectionNotExists(collection)
        
        // Create matching pipeline for the operations we want to watch
        const pipeline = [
          { $match: { 'operationType': { $in: operations } } }
        ]
        
        // Set options based on parameters
        const options = {}
        if (fullDocument) options.fullDocument = 'updateLookup'
        
        // Get the collection and create a change stream
        const currentDb = getCurrentDb()
        const coll = currentDb.collection(collection)
        const changeStream = coll.watch(pipeline, options)
        
        // Track changes and set a timeout to close the stream
        const changes = []
        const timeout = setTimeout(() => {
          changeStream.close()
        }, duration * 1000)
        
        // Add changes to our array as they occur
        changeStream.on('change', change => {
          changes.push(change)
        })
        
        // Return a promise that resolves when the stream closes
        return new Promise(resolve => {
          changeStream.on('close', () => {
            clearTimeout(timeout)
            resolve({
              content: [{
                type: 'text',
                text: formatChangeStreamResults(changes, duration)
              }]
            })
          })
        })
      }, `Error watching for changes in collection '${collection}'`)
    }
  )
}