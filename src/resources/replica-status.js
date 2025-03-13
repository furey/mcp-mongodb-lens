// src/resources/replica-status.js

import { getReplicaSetStatus } from '../db/client.js'
import { formatReplicaSetStatus } from '../utils/formatting.js'
import { log } from '../config/index.js'

/**
 * Implements the 'replica-status' resource for MongoDB Lens
 * Provides information about MongoDB replica set status and configuration
 */
export default function replicaStatusResource(server) {
  server.resource(
    'replica-status',
    'mongodb://server/replica',
    { description: 'MongoDB replica set status and configuration' },
    async () => {
      try {
        log('Resource: Retrieving replica set status…')
        const status = await getReplicaSetStatus()
        log('Resource: Retrieved replica set status information.')
        return {
          contents: [{
            uri: 'mongodb://server/replica',
            text: formatReplicaSetStatus(status)
          }]
        }
      } catch (error) {
        console.error('Error retrieving replica set status:', error)
        return {
          contents: [{
            uri: 'mongodb://server/replica',
            text: `Error retrieving replica set status: ${error.message}`
          }]
        }
      }
    }
  )
}