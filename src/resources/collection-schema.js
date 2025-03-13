// src/resources/collection-schema.js

import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js'
import { listCollections, inferSchema } from '../db/client.js'
import { formatSchema } from '../utils/formatting.js'
import { log } from '../config/index.js'

/**
 * Implements the 'collection-schema' resource for MongoDB Lens
 * Provides schema information for MongoDB collections
 */
export default function collectionSchemaResource(server) {
  server.resource(
    'collection-schema',
    new ResourceTemplate('mongodb://collection/{name}/schema', { 
      list: async () => {
        try {
          log('Resource: Listing collection schemas…')
          const collections = await listCollections()
          log(`Resource: Preparing schema resources for ${collections.length} collections.`)
          return {
            resources: collections.map(coll => ({
              uri: `mongodb://collection/${coll.name}/schema`,
              name: `${coll.name} Schema`,
              description: `Schema for ${coll.name} collection`
            }))
          }
        } catch (error) {
          console.error('Error listing collection schemas:', error)
          return { resources: [] }
        }
      },
      complete: {
        name: async (value) => {
          try {
            log(`Resource: Autocompleting collection name with prefix '${value}'…`)
            const collections = await listCollections()
            const matches = collections
              .map(coll => coll.name)
              .filter(name => name.toLowerCase().includes(value.toLowerCase()))
            log(`Resource: Found ${matches.length} matching collections.`)
            return matches
          } catch (error) {
            console.error('Error completing collection names:', error)
            return []
          }
        }
      }
    }),
    { description: 'Schema information for a MongoDB collection' },
    async (uri, { name }) => {
      try {
        log(`Resource: Inferring schema for collection '${name}'…`)
        const schema = await inferSchema(name)
        log(`Resource: Schema inference complete for '${name}', identified ${Object.keys(schema.fields).length} fields.`)
        return {
          contents: [{
            uri: uri.href,
            text: formatSchema(schema)
          }]
        }
      } catch (error) {
        console.error(`Error inferring schema for ${name}:`, error)
        return {
          contents: [{
            uri: uri.href,
            text: `Error inferring schema: ${error.message}`
          }]
        }
      }
    }
  )
}