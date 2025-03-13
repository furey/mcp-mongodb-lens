// src/resources/collection-validation.js

import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js'
import { listCollections, getCollectionValidation } from '../db/client.js'
import { formatValidationRules } from '../utils/formatting.js'
import { log } from '../config/index.js'

/**
 * Implements the 'collection-validation' resource for MongoDB Lens
 * Provides validation rules information for MongoDB collections
 */
export default function collectionValidationResource(server) {
  server.resource(
    'collection-validation',
    new ResourceTemplate('mongodb://collection/{name}/validation', {
      list: async () => {
        try {
          log('Resource: Listing collection validation resources…')
          const collections = await listCollections()
          log(`Resource: Preparing validation resources for ${collections.length} collections.`)
          return {
            resources: collections.map(coll => ({
              uri: `mongodb://collection/${coll.name}/validation`,
              name: `${coll.name} Validation`,
              description: `Validation rules for ${coll.name} collection`
            }))
          }
        } catch (error) {
          console.error('Error listing collections for validation:', error)
          return { resources: [] }
        }
      },
      complete: {
        name: async (value) => {
          try {
            log(`Resource: Autocompleting collection name for validation with prefix '${value}'…`)
            const collections = await listCollections()
            const matches = collections
              .map(coll => coll.name)
              .filter(name => name.toLowerCase().includes(value.toLowerCase()))
            log(`Resource: Found ${matches.length} matching collections for validation.`)
            return matches
          } catch (error) {
            console.error('Error completing collection names:', error)
            return []
          }
        }
      }
    }),
    { description: 'Validation rules for a MongoDB collection' },
    async (uri, { name }) => {
      try {
        log(`Resource: Retrieving validation rules for collection '${name}'…`)
        const validation = await getCollectionValidation(name)
        log(`Resource: Retrieved validation rules for collection '${name}'.`)
        return {
          contents: [{
            uri: uri.href,
            text: formatValidationRules(validation)
          }]
        }
      } catch (error) {
        console.error(`Error retrieving validation rules for ${name}:`, error)
        return {
          contents: [{
            uri: uri.href,
            text: `Error retrieving validation rules: ${error.message}`
          }]
        }
      }
    }
  )
}