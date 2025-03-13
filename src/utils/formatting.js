import mongodb from 'mongodb'
import { currentDbName } from '../config/index.js'

const { ObjectId } = mongodb

// Document serialization
export const serializeDocument = (doc) => {
  const result = {}
  
  for (const [key, value] of Object.entries(doc)) {
    if (value instanceof ObjectId) {
      result[key] = `ObjectId("${value.toString()}")`
    } else if (value instanceof Date) {
      result[key] = `ISODate("${value.toISOString()}")`
    } else if (typeof value === 'object' && value !== null) {
      result[key] = serializeDocument(value)
    } else {
      result[key] = value
    }
  }
  
  return result
}

export const serializeForExport = (value) => {
  if (value instanceof ObjectId) {
    return value.toString()
  } else if (value instanceof Date) {
    return value.toISOString()
  }
  return value
}

// Utility formatters
export const formatSize = (sizeInBytes) => {
  if (sizeInBytes < 1024) return `${sizeInBytes} bytes`
  if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(2)} KB`
  if (sizeInBytes < 1024 * 1024 * 1024) return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`
  return `${(sizeInBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export const formatUptime = (seconds) => {
  if (seconds === undefined) return 'Unknown'
  
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  
  const parts = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (remainingSeconds > 0 || parts.length === 0) parts.push(`${remainingSeconds}s`)
  
  return parts.join(' ')
}

export const formatValue = (value) => {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  
  return String(value)
}

export const formatCsvValue = (value) => {
  if (value === null || value === undefined) return ''
  
  const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value)
  
  if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  
  return stringValue
}

export const getStrengthDescription = (strength) => {
  const descriptions = {
    1: 'Primary - base characters only',
    2: 'Secondary - base + accents',
    3: 'Tertiary - base + accents + case + variants',
    4: 'Quaternary - base + accents + case + variants + punctuation',
    5: 'Identical - exact matches only'
  }
  return descriptions[strength] || 'Custom'
}

// Collection formatting functions
export const formatDatabasesList = (databases) => {
  return `Databases (${databases.length}):\n` + 
    databases.map(db => `- ${db.name} (${formatSize(db.sizeOnDisk)})`).join('\n')
}

export const formatCollectionsList = (collections) => {
  if (!collections || collections.length === 0) {
    return `No collections found in database '${currentDbName}'`
  }
  
  return `Collections in ${currentDbName} (${collections.length}):\n` +
    collections.map(coll => `- ${coll.name} (${coll.type})`).join('\n')
}

export const formatDocuments = (documents, limit) => {
  if (!documents || documents.length === 0) {
    return 'No documents found'
  }
  
  const count = documents.length
  let result = `${count} document${count === 1 ? '' : 's'}`
  if (count === limit) {
    result += ` (limit: ${limit})`
  }
  result += ':\n'
  
  result += documents.map(doc => JSON.stringify(serializeDocument(doc), null, 2)).join('\n\n')
  return result
}

export const formatSchema = (schema) => {
  const { collectionName, sampleSize, fields } = schema
  let result = `Schema for '${collectionName}' (sampled ${sampleSize} documents):\n`
  
  for (const [field, info] of Object.entries(fields)) {
    const types = info.types.join(' | ')
    const coverage = Math.round((info.count / sampleSize) * 100)
    let sample = ''
    
    if (info.sample !== null && info.sample !== undefined) {
      if (typeof info.sample === 'object') {
        sample = JSON.stringify(serializeDocument(info.sample))
      } else {
        sample = String(info.sample)
      }
      
      if (sample.length > 50) {
        sample = sample.substring(0, 47) + '…'
      }
      
      sample = ` (example: ${sample})`
    }
    
    result += `- ${field}: ${types} (${coverage}% coverage)${sample}\n`
  }
  
  return result
}

export const formatStats = (stats) => {
  if (!stats) return 'No statistics available'
  
  const keyMetrics = [
    ['ns', 'Namespace'],
    ['count', 'Document Count'],
    ['size', 'Data Size'],
    ['avgObjSize', 'Average Object Size'],
    ['storageSize', 'Storage Size'],
    ['totalIndexSize', 'Total Index Size'],
    ['nindexes', 'Number of Indexes']
  ]
  
  let result = 'Statistics:\n'
  
  for (const [key, label] of keyMetrics) {
    if (stats[key] !== undefined) {
      let value = stats[key]
      if (key.toLowerCase().includes('size')) {
        value = formatSize(value)
      }
      result += `- ${label}: ${value}\n`
    }
  }
  
  return result
}

export const formatIndexes = (indexes) => {
  if (!indexes || indexes.length === 0) {
    return 'No indexes found'
  }
  
  let result = `Indexes (${indexes.length}):\n`
  
  for (const idx of indexes) {
    const keys = Object.entries(idx.key)
      .map(([field, direction]) => `${field}: ${direction}`)
      .join(', ')
    
    result += `- ${idx.name}: { ${keys} }`
    
    if (idx.unique) result += ' (unique)'
    if (idx.sparse) result += ' (sparse)'
    if (idx.background) result += ' (background)'
    
    result += '\n'
  }
  
  return result
}

export const formatExplanation = (explanation) => {
  let result = 'Query Explanation:\n'
  
  if (explanation.queryPlanner) {
    result += '\nQuery Planner:\n'
    result += `- Namespace: ${explanation.queryPlanner.namespace}\n`
    result += `- Index Filter: ${JSON.stringify(explanation.queryPlanner.indexFilterSet) || 'None'}\n`
    result += `- Winning Plan: ${JSON.stringify(explanation.queryPlanner.winningPlan, null, 2)}\n`
  }
  
  if (explanation.executionStats) {
    result += '\nExecution Stats:\n'
    result += `- Execution Success: ${explanation.executionStats.executionSuccess}\n`
    result += `- Documents Examined: ${explanation.executionStats.totalDocsExamined}\n`
    result += `- Keys Examined: ${explanation.executionStats.totalKeysExamined}\n`
    result += `- Execution Time: ${explanation.executionStats.executionTimeMillis}ms\n`
  }
  
  return result
}

export const formatServerStatus = (status) => {
  if (!status) return 'Server status information not available'
  
  let result = 'MongoDB Server Status:\n'
  
  if (status.error) {
    result += `Note: Limited information available. ${status.error}\n\n`
  }

  result += '## Server Information\n'
  result += `- Host: ${status.host || 'Unknown'}\n`
  result += `- Version: ${status.version || 'Unknown'}\n`
  result += `- Process: ${status.process || 'Unknown'}\n`
  result += `- Uptime: ${formatUptime(status.uptime)}\n`

  if (status.connections) {
    result += '\n## Connections\n'
    result += `- Current: ${status.connections.current}\n`
    result += `- Available: ${status.connections.available}\n`
    result += `- Total Created: ${status.connections.totalCreated}\n`
  }

  if (status.mem) {
    result += '\n## Memory Usage\n'
    result += `- Resident: ${formatSize(status.mem.resident * 1024 * 1024)}\n`
    result += `- Virtual: ${formatSize(status.mem.virtual * 1024 * 1024)}\n`
    result += `- Page Faults: ${status.extra_info?.page_faults || 'N/A'}\n`
  }

  if (status.opcounters) {
    result += '\n## Operation Counters\n'
    result += `- Insert: ${status.opcounters.insert}\n`
    result += `- Query: ${status.opcounters.query}\n`
    result += `- Update: ${status.opcounters.update}\n`
    result += `- Delete: ${status.opcounters.delete}\n`
    result += `- Getmore: ${status.opcounters.getmore}\n`
    result += `- Command: ${status.opcounters.command}\n`
  }

  return result
}

export const formatReplicaSetStatus = (status) => {
  if (!status) return 'Replica set status information not available'
  
  if (status.error) {
    return `Replica Set Status: Not available (${status.info})\n\n${status.error}`
  }
  
  let result = `Replica Set: ${status.set}\n`
  result += `Status: ${status.myState === 1 ? 'PRIMARY' : status.myState === 2 ? 'SECONDARY' : 'OTHER'}\n`
  result += `Current Time: ${new Date(status.date.$date || status.date).toISOString()}\n\n`
  
  result += '## Members:\n'
  if (status.members) {
    for (const member of status.members) {
      result += `- ${member.name} (${member.stateStr})\n`
      result += `  Health: ${member.health}\n`
      result += `  Uptime: ${formatUptime(member.uptime)}\n`
      if (member.syncingTo) {
        result += `  Syncing to: ${member.syncingTo}\n`
      }
      result += '\n'
    }
  }
  
  return result
}

export const formatValidationRules = (validation) => {
  if (!validation) return 'Validation information not available'
  
  if (!validation.hasValidation) {
    return 'This collection does not have any validation rules configured.'
  }
  
  let result = 'Collection Validation Rules:\n'
  result += `- Validation Level: ${validation.validationLevel}\n`
  result += `- Validation Action: ${validation.validationAction}\n\n`
  
  result += 'Validator:\n'
  result += JSON.stringify(validation.validator, null, 2)
  
  return result
}

export const formatDatabaseUsers = (usersInfo) => {
  if (!usersInfo) return 'User information not available'
  
  if (usersInfo.error) {
    return `Users: Not available\n\n${usersInfo.info}\n${usersInfo.error}`
  }
  
  const users = usersInfo.users || []
  if (users.length === 0) {
    return 'No users found in the current database.'
  }
  
  let result = `Users in database '${currentDbName}' (${users.length}):\n\n`
  
  for (const user of users) {
    result += `## ${user.user}${user.customData ? ' (' + JSON.stringify(user.customData) + ')' : ''}\n`
    result += `- User ID: ${user._id || 'N/A'}\n`
    result += `- Database: ${user.db}\n`
    
    if (user.roles && user.roles.length > 0) {
      result += '- Roles:\n'
      for (const role of user.roles) {
        result += `  - ${role.role} on ${role.db}\n`
      }
    } else {
      result += '- Roles: None\n'
    }
    
    result += '\n'
  }
  
  return result
}

export const formatStoredFunctions = (functions) => {
  if (!functions || !Array.isArray(functions)) return 'Stored functions information not available'
  
  if (functions.length === 0) {
    return 'No stored JavaScript functions found in the current database.'
  }
  
  let result = `Stored Functions in database '${currentDbName}' (${functions.length}):\n\n`
  
  for (const func of functions) {
    result += `## ${func._id}\n`
    
    if (typeof func.value === 'function') {
      result += `${func.value.toString()}\n\n`
    } else {
      result += `${func.value}\n\n`
    }
  }
  
  return result
}

export const formatDistinctValues = (field, values) => {
  if (!values || !Array.isArray(values)) return `No distinct values found for field '${field}'`
  let result = `Distinct values for field '${field}' (${values.length}):\n`
  for (const value of values) result += `- ${formatValue(value)}\n`
  return result
}

export const formatValidationResults = (results) => {
  if (!results) return 'Validation results not available'
  
  let result = 'Collection Validation Results:\n'
  result += `- Collection: ${results.ns}\n`
  result += `- Valid: ${results.valid}\n`
  
  if (results.errors && results.errors.length > 0) {
    result += `- Errors: ${results.errors}\n`
  }
  
  if (results.warnings && results.warnings.length > 0) {
    result += `- Warnings: ${results.warnings}\n`
  }
  
  if (results.nrecords !== undefined) {
    result += `- Records Validated: ${results.nrecords}\n`
  }
  
  if (results.nInvalidDocuments !== undefined) {
    result += `- Invalid Documents: ${results.nInvalidDocuments}\n`
  }
  
  if (results.advice) {
    result += `- Advice: ${results.advice}\n`
  }
  
  return result
}

export const formatModifyResult = (operation, result) => {
  if (!result) return `${operation} operation result not available`
  
  let output = ''
  
  switch (operation) {
    case 'insert':
      output = `Document inserted successfully\n`
      output += `- ID: ${result.insertedId}\n`
      output += `- Acknowledged: ${result.acknowledged}\n`
      break
    case 'update':
      output = `Document update operation complete\n`
      output += `- Matched: ${result.matchedCount}\n`
      output += `- Modified: ${result.modifiedCount}\n`
      output += `- Acknowledged: ${result.acknowledged}\n`
      if (result.upsertedId) {
        output += `- Upserted ID: ${result.upsertedId}\n`
      }
      break
    case 'delete':
      output = `Document delete operation complete\n`
      output += `- Deleted: ${result.deletedCount}\n`
      output += `- Acknowledged: ${result.acknowledged}\n`
      break
    default:
      output = `Operation ${operation} completed\n`
      output += JSON.stringify(result, null, 2)
  }
  
  return output
}

export const formatMapReduceResults = (results) => {
  if (!results || !Array.isArray(results)) return 'MapReduce results not available'
  let output = `MapReduce Results (${results.length} entries):\n`
  for (const result of results) {
    output += `- Key: ${formatValue(result._id)}\n`
    output += `  Value: ${formatValue(result.value)}\n`
  }
  return output
}

export const formatBulkResult = (result) => {
  if (!result) return 'Bulk operation results not available'
  
  let output = 'Bulk Operations Results:\n'
  output += `- Acknowledged: ${result.acknowledged}\n`
  
  if (result.insertedCount) output += `- Inserted: ${result.insertedCount}\n`
  if (result.matchedCount) output += `- Matched: ${result.matchedCount}\n`
  if (result.modifiedCount) output += `- Modified: ${result.modifiedCount}\n`
  if (result.deletedCount) output += `- Deleted: ${result.deletedCount}\n`
  if (result.upsertedCount) output += `- Upserted: ${result.upsertedCount}\n`
  
  if (result.insertedIds && Object.keys(result.insertedIds).length > 0) {
    output += '- Inserted IDs:\n'
    for (const [index, id] of Object.entries(result.insertedIds)) {
      output += `  - Index ${index}: ${id}\n`
    }
  }
  
  if (result.upsertedIds && Object.keys(result.upsertedIds).length > 0) {
    output += '- Upserted IDs:\n'
    for (const [index, id] of Object.entries(result.upsertedIds)) {
      output += `  - Index ${index}: ${id}\n`
    }
  }
  
  return output
}

export const formatChangeStreamResults = (changes, duration) => {
  if (changes.length === 0) {
    return `No changes detected during ${duration} second window.`
  }
  
  let result = `Detected ${changes.length} changes during ${duration} second window:\n\n`
  
  for (const change of changes) {
    result += `Operation: ${change.operationType}\n`
    result += `Timestamp: ${new Date(change.clusterTime.high * 1000).toISOString()}\n`
    
    if (change.documentKey) {
      result += `Document ID: ${JSON.stringify(change.documentKey)}\n`
    }
    
    if (change.fullDocument) {
      result += `Document: ${JSON.stringify(change.fullDocument, null, 2)}\n`
    }
    
    if (change.updateDescription) {
      result += `Updated Fields: ${JSON.stringify(change.updateDescription.updatedFields, null, 2)}\n`
      result += `Removed Fields: ${JSON.stringify(change.updateDescription.removedFields)}\n`
    }
    
    result += '\n'
  }
  
  return result
}

export const formatTextSearchResults = (results, searchText) => {
  if (results.length === 0) {
    return `No documents found matching: "${searchText}"`
  }
  
  let output = `Found ${results.length} documents matching: "${searchText}"\n\n`
  
  for (const doc of results) {
    const score = doc.score
    delete doc.score
    output += `Score: ${score.toFixed(2)}\n`
    output += `Document: ${JSON.stringify(serializeDocument(doc), null, 2)}\n\n`
  }
  
  output += `Note: Make sure text indexes exist on relevant fields. Create with: create-index {"collection": "yourCollection", "keys": "{\\"fieldName\\": \\"text\\"}"}`
  
  return output
}

export const formatTransactionResults = (results) => {
  let output = 'Transaction completed successfully:\n\n'
  
  for (const result of results) {
    output += `Step ${result.step}: ${result.operation}\n`
    
    if (result.operation === 'insert') {
      output += `- Inserted ID: ${result.result.insertedId}\n`
    } else if (result.operation === 'update') {
      output += `- Matched: ${result.result.matchedCount}\n`
      output += `- Modified: ${result.result.modifiedCount}\n`
    } else if (result.operation === 'delete') {
      output += `- Deleted: ${result.result.deletedCount}\n`
    } else if (result.operation === 'find') {
      output += `- Document: ${JSON.stringify(serializeDocument(result.result), null, 2)}\n`
    }
    
    output += '\n'
  }
  
  return output
}

export const formatGridFSList = (files) => {
  if (files.length === 0) {
    return 'No files found in GridFS'
  }
  
  let result = `GridFS Files (${files.length}):\n\n`
  
  for (const file of files) {
    result += `Filename: ${file.filename}\n`
    result += `Size: ${formatSize(file.length)}\n`
    result += `Upload Date: ${file.uploadDate.toISOString()}\n`
    result += `ID: ${file._id}\n`
    if (file.metadata) result += `Metadata: ${JSON.stringify(file.metadata)}\n`
    result += '\n'
  }
  
  return result
}

export const formatGridFSInfo = (file) => {
  let result = 'GridFS File Information:\n\n'
  
  result += `Filename: ${file.filename}\n`
  result += `Size: ${formatSize(file.length)}\n`
  result += `Chunk Size: ${formatSize(file.chunkSize)}\n`
  result += `Upload Date: ${file.uploadDate.toISOString()}\n`
  result += `ID: ${file._id}\n`
  result += `MD5: ${file.md5}\n`
  
  if (file.contentType) result += `Content Type: ${file.contentType}\n`
  if (file.aliases && file.aliases.length > 0) result += `Aliases: ${file.aliases.join(', ')}\n`
  if (file.metadata) result += `Metadata: ${JSON.stringify(file.metadata, null, 2)}\n`
  
  return result
}

export const formatCollationResults = (results, locale, strength, caseLevel) => {
  if (results.length === 0) {
    return 'No documents found matching the query with the specified collation'
  }
  
  let output = `Found ${results.length} documents using collation:\n`
  output += `- Locale: ${locale}\n`
  output += `- Strength: ${strength} (${getStrengthDescription(strength)})\n`
  output += `- Case Level: ${caseLevel}\n\n`
  
  output += results.map(doc => JSON.stringify(serializeDocument(doc), null, 2)).join('\n\n')
  return output
}

export const formatShardDbStatus = (shards, dbStats, dbShardStatus, dbName) => {
  let result = `Sharding Status for Database: ${dbName}\n\n`
  
  if (!shards || !shards.shards || shards.shards.length === 0) {
    return result + 'This MongoDB deployment is not a sharded cluster.'
  }
  
  result += `Cluster consists of ${shards.shards.length} shards:\n`
  for (const shard of shards.shards) {
    result += `- ${shard._id}: ${shard.host}\n`
  }
  result += '\n'
  
  if (dbShardStatus) {
    result += `Database Sharding Status: ${dbShardStatus.partitioned ? 'Enabled' : 'Not Enabled'}\n`
    if (dbShardStatus.primary) result += `Primary Shard: ${dbShardStatus.primary}\n\n`
  } else {
    result += 'Database is not sharded.\n\n'
  }
  
  if (dbStats && dbStats.raw) {
    result += 'Data Distribution:\n'
    for (const shard in dbStats.raw) {
      result += `- ${shard}: ${formatSize(dbStats.raw[shard].totalSize)} (${dbStats.raw[shard].objects} objects)\n`
    }
  }
  
  return result
}

export const formatShardCollectionStatus = (stats, shardStatus, collName) => {
  let result = `Sharding Status for Collection: ${collName}\n\n`
  
  if (!stats.sharded) {
    return result + 'This collection is not sharded.'
  }
  
  result += 'Collection is sharded.\n\n'
  
  if (shardStatus) {
    result += `Shard Key: ${JSON.stringify(shardStatus.key)}\n`
    if (shardStatus.unique) result += 'Unique: true\n'
    result += `Distribution Mode: ${shardStatus.dropped ? 'Dropped' : shardStatus.distributionMode || 'hashed'}\n\n`
  }
  
  if (stats.shards) {
    result += 'Data Distribution:\n'
    for (const shard in stats.shards) {
      result += `- ${shard}: ${formatSize(stats.shards[shard].size)} (${stats.shards[shard].count} documents)\n`
    }
  }
  
  if (stats.chunks) {
    result += `\nTotal Chunks: ${stats.chunks}\n`
  }
  
  return result
}

export const formatPerformanceMetrics = (metrics) => {
  let result = 'MongoDB Performance Metrics:\n\n'
  
  if (metrics.error) {
    return `Error retrieving metrics: ${metrics.error}`
  }

  result += '## Server Status\n'
  if (metrics.serverStatus.connections) {
    result += `- Current Connections: ${metrics.serverStatus.connections.current}\n`
    result += `- Available Connections: ${metrics.serverStatus.connections.available}\n`
  }
  
  if (metrics.serverStatus.opcounters) {
    result += '\n## Operation Counters (since server start)\n'
    for (const [op, count] of Object.entries(metrics.serverStatus.opcounters)) {
      result += `- ${op}: ${count}\n`
    }
  }
  
  if (metrics.serverStatus.wiredTiger) {
    result += '\n## Cache Utilization\n'
    result += `- Pages Read: ${metrics.serverStatus.wiredTiger.pages_read}\n`
    result += `- Max Bytes: ${formatSize(metrics.serverStatus.wiredTiger.maximum_bytes_configured)}\n`
    result += `- Current Bytes: ${formatSize(metrics.serverStatus.wiredTiger.bytes_currently_in_cache)}\n`
    result += `- Dirty Bytes: ${formatSize(metrics.serverStatus.wiredTiger.tracked_dirty_bytes)}\n`
  }

  result += '\n## Database Profiling\n'
  result += `- Profiling Level: ${metrics.profileSettings.was}\n`
  result += `- Slow Query Threshold: ${metrics.profileSettings.slowms}ms\n`

  if (metrics.currentOperations && metrics.currentOperations.length > 0) {
    result += '\n## Long-Running Operations\n'
    for (const op of metrics.currentOperations) {
      result += `- Op: ${op.op} running for ${op.secs_running}s\n`
      result += `  - Namespace: ${op.ns}\n`
      if (op.query) result += `  - Query: ${JSON.stringify(op.query)}\n`
      if (op.command) result += `  - Command: ${JSON.stringify(op.command)}\n`
      result += '\n'
    }
  }
  
  return result
}

export const formatTriggerConfiguration = (triggers) => {
  if (triggers.error) {
    return `Trigger information not available: ${triggers.error}`
  }
  
  let result = 'MongoDB Event Trigger Configuration:\n\n'

  result += '## Change Stream Support\n'
  if (triggers.changeStreams.supported) {
    result += '- Change streams are supported in this MongoDB version\n'
    result += `- Resume token support: ${triggers.changeStreams.resumeTokenSupported ? 'Yes' : 'No'}\n`
    result += `- Update lookup support: ${triggers.changeStreams.updateLookupSupported ? 'Yes' : 'No'}\n`
    result += `- Full document before change: ${triggers.changeStreams.fullDocumentBeforeChangeSupported ? 'Yes' : 'No'}\n`
  } else {
    result += '- Change streams are not supported in this MongoDB version\n'
  }

  result += '\n## Potential Trigger Collections\n'
  if (triggers.triggerCollections && triggers.triggerCollections.length > 0) {
    for (const coll of triggers.triggerCollections) {
      result += `- ${coll.name} (${coll.type})\n`
    }
  } else {
    result += '- No collections found with trigger-related naming\n'
  }

  result += '\n## Stored Trigger Functions\n'
  if (triggers.triggerFunctions && triggers.triggerFunctions.length > 0) {
    for (const func of triggers.triggerFunctions) {
      result += `- ${func._id}\n`
      if (typeof func.value === 'function') {
        result += `  ${func.value.toString().split('\n')[0]}…\n`
      }
    }
  } else {
    result += '- No stored JavaScript functions with trigger-related naming found\n'
  }
  
  result += '\n## Usage\n'
  result += '- To set up change streams monitoring, use the `watch-changes` tool\n'
  result += '- Example: `watch-changes {"collection": "orders", "operations": ["insert", "update"], "duration": 30}`\n'
  
  return result
}

export const formatSchemaComparison = (comparison, sourceCollection, targetCollection) => {
  const { source, target, commonFields, sourceOnlyFields, targetOnlyFields, typeDifferences, stats } = comparison
  
  let result = `# Schema Comparison: '${source}' vs '${target}'\n\n`

  result += `## Summary\n`
  result += `- Source Collection: ${source} (${stats.sourceFieldCount} fields)\n`
  result += `- Target Collection: ${target} (${stats.targetFieldCount} fields)\n`
  result += `- Common Fields: ${stats.commonFieldCount}\n`
  result += `- Fields Only in Source: ${sourceOnlyFields.length}\n`
  result += `- Fields Only in Target: ${targetOnlyFields.length}\n`
  result += `- Type Mismatches: ${typeDifferences.length}\n\n`

  if (typeDifferences.length > 0) {
    result += `## Type Differences\n`
    typeDifferences.forEach(diff => {
      result += `- ${diff.field}: ${diff.sourceTypes.join(', ')} (${source}) vs ${diff.targetTypes.join(', ')} (${target})\n`
    })
    result += '\n'
  }

  if (sourceOnlyFields.length > 0) {
    result += `## Fields Only in ${source}\n`
    sourceOnlyFields.forEach(field => {
      result += `- ${field.name}: ${field.types.join(', ')}\n`
    })
    result += '\n'
  }

  if (targetOnlyFields.length > 0) {
    result += `## Fields Only in ${target}\n`
    targetOnlyFields.forEach(field => {
      result += `- ${field.name}: ${field.types.join(', ')}\n`
    })
    result += '\n'
  }

  if (stats.commonFieldCount > 0) {
    result += `## Common Fields\n`
    commonFields.forEach(field => {
      const statusSymbol = field.typesMatch ? '✓' : '✗'
      result += `- ${statusSymbol} ${field.name}\n`
    })
  }
  
  return result
}

export const formatQueryAnalysis = (analysis) => {
  const { collection, indexRecommendations, queryOptimizations, unusedIndexes, schemaIssues, queryStats } = analysis
  
  let result = `# Query Pattern Analysis for '${collection}'\n\n`

  if (indexRecommendations.length > 0) {
    result += `## Index Recommendations\n`
    indexRecommendations.forEach((rec, i) => {
      result += `### ${i+1}. Create index on: ${rec.fields.join(', ')}\n`
      if (rec.filter && !rec.automatic) {
        result += `- Based on query filter: ${rec.filter}\n`
        if (rec.millis) {
          result += `- Current execution time: ${rec.millis}ms\n`
        }
      } else if (rec.automatic) {
        result += `- Automatic recommendation based on field name patterns\n`
      }
      result += `- Create using: \`create-index {"collection": "${collection}", "keys": "{\\"${rec.fields[0]}\\": 1}"}\`\n\n`
    })
  }

  if (unusedIndexes.length > 0) {
    result += `## Unused Indexes\n`
    result += 'The following indexes appear to be unused and could potentially be removed:\n'
    unusedIndexes.forEach((idx) => {
      result += `- ${idx.name} on fields: ${idx.fields.join(', ')}\n`
    })
    result += '\n'
  }

  if (schemaIssues.length > 0) {
    result += `## Schema Concerns\n`
    schemaIssues.forEach((issue) => {
      result += `- ${issue.field}: ${issue.issue} - ${issue.description}\n`
    })
    result += '\n'
  }

  if (queryStats.length > 0) {
    result += `## Recent Queries\n`
    result += 'Most recent query patterns observed:\n'
    
    const uniquePatterns = {}
    queryStats.forEach(stat => {
      const key = stat.filter
      if (!uniquePatterns[key]) {
        uniquePatterns[key] = {
          filter: stat.filter,
          fields: stat.fields,
          count: 1,
          totalTime: stat.millis,
          avgTime: stat.millis,
          scanType: stat.scanType
        }
      } else {
        uniquePatterns[key].count++
        uniquePatterns[key].totalTime += stat.millis
        uniquePatterns[key].avgTime = uniquePatterns[key].totalTime / uniquePatterns[key].count
      }
    })
    
    Object.values(uniquePatterns)
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 5)
      .forEach(pattern => {
        result += `- Filter: ${pattern.filter}\n`
        result += `  - Fields: ${pattern.fields.join(', ')}\n`
        result += `  - Count: ${pattern.count}\n`
        result += `  - Avg Time: ${pattern.avgTime.toFixed(2)}ms\n`
        result += `  - Scan Type: ${pattern.scanType}\n\n`
      })
  }
  
  return result
}