// src/tools/index.js

import listDatabasesTool from './list-databases.js'
import currentDatabaseTool from './current-database.js'
import useDatabaseTool from './use-database.js'
import listCollectionsTool from './list-collections.js'
import findDocumentsTool from './find-documents.js'
import countDocumentsTool from './count-documents.js'
import analyzeSchemasTool from './analyze-schema.js'
import createIndexTool from './create-index.js'
import modifyDocumentTool from './modify-document.js'
import aggregateDataTool from './aggregate-data.js'
import getStatsTool from './get-stats.js'
import distinctValuesTool from './distinct-values.js'
import explainQueryTool from './explain-query.js'
import validateCollectionTool from './validate-collection.js'
import createCollectionTool from './create-collection.js'
import dropCollectionTool from './drop-collection.js'
import renameCollectionTool from './rename-collection.js'
import bulkOperationsTool from './bulk-operations.js'
import textSearchTool from './text-search.js'
import watchChangesTool from './watch-changes.js'
import exportDataTool from './export-data.js'
import collationQueryTool from './collation-query.js'
import geoQueryTool from './geo-query.js'
import shardStatusTool from './shard-status.js'
// Import other tools as they are created
// etc.

export function registerTools(server) {
  listDatabasesTool(server)
  currentDatabaseTool(server)
  useDatabaseTool(server)
  listCollectionsTool(server)
  findDocumentsTool(server)
  countDocumentsTool(server)
  analyzeSchemasTool(server)
  createIndexTool(server)
  modifyDocumentTool(server)
  aggregateDataTool(server)
  getStatsTool(server)
  distinctValuesTool(server)
  explainQueryTool(server)
  validateCollectionTool(server)
  createCollectionTool(server)
  dropCollectionTool(server)
  renameCollectionTool(server)
  bulkOperationsTool(server)
  textSearchTool(server)
  watchChangesTool(server)
  exportDataTool(server)
  collationQueryTool(server)
  geoQueryTool(server)
  shardStatusTool(server)
  // Register other tools as they are added
  // etc.
}