// src/resources/collection-stats.js

import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js'
import { listCollections, getCollectionStats } from '../db/client.js'
import { formatStats } from '../utils/formatting.js'
import { log } from '../config/index.js'

/**
 * Implements the 'collection-stats' resource for MongoDB Lens
 * Provides performance statistics for MongoDB collections
 */
export default function collectionStatsResource(server) {
  server.resource(
    'collection-stats',
    new ResourceTemplate('mongodb://collection/{name}/stats', { 
      list: async () => {
        try {
          log('Resource: Listing collection stats resources…')
          const collections = await listCollections()
          log(`Resource: Preparing stats resources for ${collections.length} collections.`)
          return {
            resources: collections.map(coll => ({
              uri: `mongodb://collection/${coll.name}/stats`,
              name: `${coll.name} Stats`,
              description: `Statistics for ${coll.name} collection`
            }))
          }
        } catch (error) {
          console.error('Error listing collections for stats:', error)
          return { resources: [] }
        }
      },
      complete: {
        name: async (value) => {
          try {
            log(`Resource: Autocompleting collection name for stats with prefix '${value}'…`)
            const collections = await listCollections()
            const matches = collections
              .map(coll => coll.name)
              .filter(name => name.toLowerCase().includes(value.toLowerCase()))
            log(`Resource: Found ${matches.length} matching collections for stats.`)
            return matches
          } catch (error) {
            console.error('Error completing collection names:', error)
            return []
          }
        }
      }
    }),
    { description: 'Performance statistics for a MongoDB collection' },
    async (uri, { name }) => {
      try {
        log(`Resource: Retrieving stats for collection '${name}'…`)
        const stats = await getCollectionStats(name)
        log(`Resource: Retrieved stats for collection '${name}'.`)
        return {
          contents: [{
            uri: uri.href,
            text: formatStats(stats)
          }]
        }
      } catch (error) {
        console.error(`Error retrieving stats for ${name}:`, error)
        return {
          contents: [{
            uri: uri.href,
            text: `Error retrieving stats: ${error.message}`
          }]
        }
      }
    }
  )
}