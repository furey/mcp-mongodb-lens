// src/resources/stored-functions.js

import { getStoredFunctions } from '../db/client.js'
import { formatStoredFunctions } from '../utils/formatting.js'
import { log } from '../config/index.js'

/**
 * Implements the 'stored-functions' resource for MongoDB Lens
 * Provides information about MongoDB stored JavaScript functions
 */
export default function storedFunctionsResource(server) {
  server.resource(
    'stored-functions',
    'mongodb://database/functions',
    { description: 'MongoDB stored JavaScript functions' },
    async () => {
      try {
        log('Resource: Retrieving stored JavaScript functions…')
        const functions = await getStoredFunctions()
        log(`Resource: Retrieved stored functions.`)
        return {
          contents: [{
            uri: 'mongodb://database/functions',
            text: formatStoredFunctions(functions)
          }]
        }
      } catch (error) {
        console.error('Error retrieving stored functions:', error)
        return {
          contents: [{
            uri: 'mongodb://database/functions',
            text: `Error retrieving stored functions: ${error.message}`
          }]
        }
      }
    }
  )
}