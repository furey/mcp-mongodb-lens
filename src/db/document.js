// src/db/document.js

import mongodb from 'mongodb'
import { 
  currentDb, 
  log
} from '../config/index.js'
import { 
  throwIfCollectionNotExists 
} from './client.js'

const { ObjectId } = mongodb

/**
 * Finds documents in a collection with the given parameters
 */
export const findDocuments = async (collectionName, filter = {}, projection = null, limit = 10, skip = 0, sort = null) => {
  log(`DB Operation: Finding documents in collection '${collectionName}'...`)
  try {
    await throwIfCollectionNotExists(collectionName)
    const collection = currentDb.collection(collectionName)
    let query = collection.find(filter)
    
    if (projection) query = query.project(projection)
    if (skip) query = query.skip(skip)
    if (limit) query = query.limit(limit)
    if (sort) query = query.sort(sort)
    
    const results = await query.toArray()
    log(`DB Operation: Found ${results.length} documents.`)
    return results
  } catch (error) {
    log(`DB Operation: Failed to find documents: ${error.message}`)
    throw error
  }
}

/**
 * Counts documents in a collection matching the given filter
 */
export const countDocuments = async (collectionName, filter = {}) => {
  log(`DB Operation: Counting documents in collection '${collectionName}'...`)
  try {
    await throwIfCollectionNotExists(collectionName)
    const collection = currentDb.collection(collectionName)
    const count = await collection.countDocuments(filter)
    log(`DB Operation: Count result: ${count} documents.`)
    return count
  } catch (error) {
    log(`DB Operation: Failed to count documents: ${error.message}`)
    throw error
  }
}

/**
 * Prepare a stream query for large result sets
 */
export const streamQuery = async (collectionName, filter = {}, projection = null, limit = null, skip = 0, sort = null) => {
  log(`DB Operation: Setting up streaming query for collection '${collectionName}'...`)
  try {
    await throwIfCollectionNotExists(collectionName)
    const collection = currentDb.collection(collectionName)
    
    let query = collection.find(filter)
    
    if (projection) query = query.project(projection)
    if (skip) query = query.skip(skip)
    if (limit) query = query.limit(limit)
    if (sort) query = query.sort(sort)
    
    query = query.batchSize(20)
    
    return query
  } catch (error) {
    log(`DB Operation: Failed to set up streaming query: ${error.message}`)
    throw error
  }
}

/**
 * Modifies a document in the collection (insert, update, delete)
 */
export const modifyDocument = async (collectionName, operation, document, filter = null, options = {}) => {
  log(`DB Operation: ${operation.charAt(0).toUpperCase() + operation.slice(1)}ing document in collection '${collectionName}'...`)
  try {
    await throwIfCollectionNotExists(collectionName)
    const collection = currentDb.collection(collectionName)
    let result
    
    switch (operation.toLowerCase()) {
      case 'insert':
        result = await collection.insertOne(document, options)
        log(`DB Operation: Document inserted with ID ${result.insertedId}`)
        return result
        
      case 'update':
        if (!filter) throw new Error('Filter is required for update operations')
        result = await collection.updateOne(filter, document, options)
        log(`DB Operation: ${result.matchedCount} document(s) matched, ${result.modifiedCount} document(s) modified.`)
        return result
        
      case 'delete':
        if (!filter) throw new Error('Filter is required for delete operations')
        result = await collection.deleteOne(filter, options)
        log(`DB Operation: ${result.deletedCount} document(s) deleted.`)
        return result
        
      default:
        throw new Error(`Unsupported operation: ${operation}`)
    }
  } catch (error) {
    log(`DB Operation: Failed to modify document: ${error.message}`)
    throw error
  }
}

/**
 * Performs a bulk write operation
 */
export const bulkOperations = async (collectionName, operations, ordered = true) => {
  log(`DB Operation: Performing bulk operations on collection '${collectionName}'...`)
  try {
    await throwIfCollectionNotExists(collectionName)
    const collection = currentDb.collection(collectionName)
    const bulk = ordered ? collection.initializeOrderedBulkOp() : collection.initializeUnorderedBulkOp()
    
    for (const op of operations) {
      if (op.insertOne) {
        bulk.insert(op.insertOne.document)
      } else if (op.updateOne) {
        bulk.find(op.updateOne.filter).updateOne(op.updateOne.update)
      } else if (op.updateMany) {
        bulk.find(op.updateMany.filter).update(op.updateMany.update)
      } else if (op.deleteOne) {
        bulk.find(op.deleteOne.filter).deleteOne()
      } else if (op.deleteMany) {
        bulk.find(op.deleteMany.filter).delete()
      } else if (op.replaceOne) {
        bulk.find(op.replaceOne.filter).replaceOne(op.replaceOne.replacement)
      }
    }

    const result = await bulk.execute()

    if (!result || !result.acknowledged) {
      throw new Error("Bulk operations were not acknowledged by MongoDB")
    }
    
    log(`DB Operation: Bulk operations complete.`)
    return result
  } catch (error) {
    log(`DB Operation: Bulk operations failed: ${error.message}`)
    throw error
  }
}

/**
 * Performs an aggregation on the collection
 */
export const aggregateData = async (collectionName, pipeline, options = {}) => {
  log(`DB Operation: Running aggregation on collection '${collectionName}'...`)
  try {
    await throwIfCollectionNotExists(collectionName)
    log(`DB Operation: Pipeline has ${pipeline.length} stages.`)
    
    const collection = currentDb.collection(collectionName)
    const results = await collection.aggregate(pipeline, {
      allowDiskUse: true,
      ...options
    }).toArray()
    
    log(`DB Operation: Aggregation returned ${results.length} results.`)
    return results
  } catch (error) {
    log(`DB Operation: Failed to run aggregation: ${error.message}`)
    throw error
  }
}

/**
 * Gets distinct values for a field in the collection
 */
export const getDistinctValues = async (collectionName, field, filter = {}) => {
  log(`DB Operation: Getting distinct values for field '${field}' in collection '${collectionName}'...`)
  try {
    await throwIfCollectionNotExists(collectionName)
    const collection = currentDb.collection(collectionName)
    const values = await collection.distinct(field, filter)
    log(`DB Operation: Found ${values.length} distinct values.`)
    return values
  } catch (error) {
    log(`DB Operation: Failed to get distinct values: ${error.message}`)
    throw error
  }
}

/**
 * Explains a query execution plan
 */
export const explainQuery = async (collectionName, filter = {}, verbosity = 'executionStats') => {
  log(`DB Operation: Explaining query on collection '${collectionName}'...`)
  try {
    await throwIfCollectionNotExists(collectionName)
    const collection = currentDb.collection(collectionName)
    const explanation = await collection.find(filter).explain(verbosity)
    log(`DB Operation: Query explanation generated.`)
    return explanation
  } catch (error) {
    log(`DB Operation: Failed to explain query: ${error.message}`)
    throw error
  }
}