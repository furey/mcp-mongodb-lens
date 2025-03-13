// src/resources/server-status.js

import { getServerStatus } from '../db/client.js'
import { formatServerStatus } from '../utils/formatting.js'
import { log } from '../config/index.js'

/**
 * Implements the 'server-status' resource for MongoDB Lens
 * Provides MongoDB server status information
 */
export default function serverStatusResource(server) {
  server.resource(
    'server-status',
    'mongodb://server/status',
    { description: 'MongoDB server status information' },
    async () => {
      try {
        log('Resource: Retrieving server status…')
        const status = await getServerStatus()
        log('Resource: Retrieved server status information.')
        return {
          contents: [{
            uri: 'mongodb://server/status',
            text: formatServerStatus(status)
          }]
        }
      } catch (error) {
        console.error('Error retrieving server status:', error)
        return {
          contents: [{
            uri: 'mongodb://server/status',
            text: `Error retrieving server status: ${error.message}`
          }]
        }
      }
    }
  )
}