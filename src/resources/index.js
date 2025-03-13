// src/resources/index.js

import databasesResource from './databases.js'
import collectionsResource from './collections.js'
import collectionSchemaResource from './collection-schema.js'
import collectionStatsResource from './collection-stats.js'
import collectionIndexesResource from './collection-indexes.js'
import collectionValidationResource from './collection-validation.js'
import serverStatusResource from './server-status.js'
import replicaStatusResource from './replica-status.js'
import databaseUsersResource from './database-users.js'
import storedFunctionsResource from './stored-functions.js'
import performanceMetricsResource from './performance-metrics.js'
import databaseTriggersResource from './database-triggers.js'
// Import other resources as they are created
// etc.

export function registerResources(server) {
  databasesResource(server)
  collectionsResource(server)
  collectionSchemaResource(server)
  collectionStatsResource(server)
  collectionIndexesResource(server)
  collectionValidationResource(server)
  serverStatusResource(server)
  replicaStatusResource(server)
  databaseUsersResource(server)
  storedFunctionsResource(server)
  performanceMetricsResource(server)
  databaseTriggersResource(server)
  // Register other resources as they are added
  // etc.
}