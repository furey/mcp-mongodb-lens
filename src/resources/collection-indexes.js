// src/resources/collection-indexes.js

import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js'
import { listCollections, getCollectionIndexes } from '../db/client.js'
import { formatIndexes } from '../utils/formatting.js'
import { log } from '../config/index.js'

/**
 * Implements the 'collection-indexes' resource for MongoDB Lens
 * Provides index information for MongoDB collections
 */
export default function collectionIndexesResource(server) {
  server.resource(
    'collection-indexes',
    new ResourceTemplate('mongodb://collection/{name}/indexes', { 
      list: async () => {
        try {
          log('Resource: Listing collection indexes resources…')
          const collections = await listCollections()
          log(`Resource: Preparing index resources for ${collections.length} collections.`)
          return {
            resources: collections.map(coll => ({
              uri: `mongodb://collection/${coll.name}/indexes`,
              name: `${coll.name} Indexes`,
              description: `Indexes for ${coll.name} collection`
            }))
          }
        } catch (error) {
          console.error('Error listing collections for indexes:', error)
          return { resources: [] }
        }
      },
      complete: {
        name: async (value) => {
          try {
            log(`Resource: Autocompleting collection name for indexes with prefix '${value}'…`)
            const collections = await listCollections()
            const matches = collections
              .map(coll => coll.name)
              .filter(name => name.toLowerCase().includes(value.toLowerCase()))
            log(`Resource: Found ${matches.length} matching collections for indexes.`)
            return matches
          } catch (error) {
            console.error('Error completing collection names:', error)
            return []
          }
        }
      }
    }),
    { description: 'Index information for a MongoDB collection' },
    async (uri, { name }) => {
      try {
        log(`Resource: Retrieving indexes for collection '${name}'…`)
        const indexes = await getCollectionIndexes(name)
        log(`Resource: Retrieved ${indexes.length} indexes for collection '${name}'.`)
        return {
          contents: [{
            uri: uri.href,
            text: formatIndexes(indexes)
          }]
        }
      } catch (error) {
        console.error(`Error retrieving indexes for ${name}:`, error)
        return {
          contents: [{
            uri: uri.href,
            text: `Error retrieving indexes: ${error.message}`
          }]
        }
      }
    }
  )
}