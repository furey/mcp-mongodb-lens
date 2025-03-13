// src/resources/database-triggers.js

import { getDatabaseTriggers } from '../db/client.js'
import { formatTriggerConfiguration } from '../utils/formatting.js'
import { log } from '../config/index.js'

/**
 * Implements the 'database-triggers' resource for MongoDB Lens
 * Provides information about database change streams and event triggers
 */
export default function databaseTriggersResource(server) {
  server.resource(
    'database-triggers',
    'mongodb://database/triggers',
    { description: 'Database change streams and event triggers configuration' },
    async () => {
      try {
        log('Resource: Retrieving database triggers and event configuration…')
        const triggers = await getDatabaseTriggers()
        log('Resource: Retrieved database triggers information.')
        return {
          contents: [{
            uri: 'mongodb://database/triggers',
            text: formatTriggerConfiguration(triggers)
          }]
        }
      } catch (error) {
        console.error('Error retrieving database triggers:', error)
        return {
          contents: [{
            uri: 'mongodb://database/triggers',
            text: `Error retrieving database triggers: ${error.message}`
          }]
        }
      }
    }
  )
}