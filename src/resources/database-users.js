// src/resources/database-users.js

import { getDatabaseUsers } from '../db/client.js'
import { formatDatabaseUsers } from '../utils/formatting.js'
import { log } from '../config/index.js'

/**
 * Implements the 'database-users' resource for MongoDB Lens
 * Provides information about MongoDB database users and roles
 */
export default function databaseUsersResource(server) {
  server.resource(
    'database-users',
    'mongodb://database/users',
    { description: 'MongoDB database users and roles' },
    async () => {
      try {
        log('Resource: Retrieving database users…')
        const users = await getDatabaseUsers()
        log(`Resource: Retrieved user information.`)
        return {
          contents: [{
            uri: 'mongodb://database/users',
            text: formatDatabaseUsers(users)
          }]
        }
      } catch (error) {
        console.error('Error retrieving database users:', error)
        return {
          contents: [{
            uri: 'mongodb://database/users',
            text: `Error retrieving database users: ${error.message}`
          }]
        }
      }
    }
  )
}