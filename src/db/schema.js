// src/db/schema.js

import { log, memoryCache, CACHE_TTL } from '../config/index.js'
import { currentDb } from '../config/index.js'
import { 
  throwIfCollectionNotExists 
} from './client.js'
import mongodb from 'mongodb'

const { ObjectId } = mongodb

export const inferSchema = async (collectionName, sampleSize = 100) => {
  log(`DB Operation: Inferring schema for collection '${collectionName}' with sample size ${sampleSize}…`)
  try {
    await throwIfCollectionNotExists(collectionName)
    
    const cacheKey = `${currentDb.databaseName}.${collectionName}.${sampleSize}`
    const cachedSchema = memoryCache.schemas.get(cacheKey)
    
    if (cachedSchema && 
        (Date.now() - cachedSchema.timestamp) < CACHE_TTL.SCHEMAS) {
      log(`DB Operation: Using cached schema for '${collectionName}'`)
      return cachedSchema.data
    }
    
    const collection = currentDb.collection(collectionName)
    
    const pipeline = [
      { $sample: { size: sampleSize } }
    ]
    
    const cursor = collection.aggregate(pipeline, { 
      allowDiskUse: true,
      cursor: { batchSize: 50 }
    })
    
    const documents = []
    const fieldPaths = new Set()
    const schema = {}
    let processed = 0
    
    for await (const doc of cursor) {
      documents.push(doc)
      collectFieldPaths(doc, '', fieldPaths)
      processed++
      
      if (processed % 50 === 0) {
        log(`DB Operation: Processed ${processed} documents for schema inference…`)
      }
    }
    
    log(`DB Operation: Retrieved ${documents.length} sample documents for schema inference.`)
    
    if (documents.length === 0) throw new Error(`Collection '${collectionName}' is empty`)
    
    fieldPaths.forEach(path => {
      schema[path] = {
        types: new Set(),
        count: 0,
        sample: null,
        path: path
      }
    })
    
    documents.forEach(doc => {
      fieldPaths.forEach(path => {
        const value = getNestedValue(doc, path)
        if (value !== undefined) {
          if (!schema[path].sample) {
            schema[path].sample = value
          }
          schema[path].types.add(getTypeName(value))
          schema[path].count++
        }
      })
    })

    for (const key in schema) {
      schema[key].types = Array.from(schema[key].types)
      schema[key].coverage = Math.round((schema[key].count / documents.length) * 100)
    }
    
    const result = { 
      collectionName,
      sampleSize: documents.length,
      fields: schema,
      timestamp: new Date().toISOString()
    }
    
    memoryCache.schemas.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    })
    
    const fieldsArray = Object.keys(schema)
    log(`DB Operation: Schema inference complete, identified ${fieldsArray.length} fields.`)
    
    memoryCache.fields.set(`${currentDb.databaseName}.${collectionName}`, {
      data: fieldsArray,
      timestamp: Date.now()
    })
    
    return result
  } catch (error) {
    log(`DB Operation: Failed to infer schema: ${error.message}`)
    throw error
  }
}

export const getTypeName = (value) => {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (Array.isArray(value)) return 'array'
  if (value instanceof ObjectId) return 'ObjectId'
  if (value instanceof Date) return 'Date'
  return typeof value
}

export const collectFieldPaths = (obj, prefix = '', paths = new Set()) => {
  if (!obj || typeof obj !== 'object') return
  
  Object.entries(obj).forEach(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    paths.add(path)
    
    if (value && typeof value === 'object') {
      if (Array.isArray(value)) {
        if (value.length > 0) {
          if (typeof value[0] === 'object' && value[0] !== null) {
            collectFieldPaths(value[0], `${path}[]`, paths)
          }
        }
      } else if (!(value instanceof ObjectId) && !(value instanceof Date)) {
        collectFieldPaths(value, path, paths)
      }
    }
  })
  
  return paths
}

export const getNestedValue = (obj, path) => {
  const parts = path.split('.')
  let current = obj
  
  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined
    }
    current = current[part]
  }
  
  return current
}

export const compareSchemas = (sourceSchema, targetSchema) => {
  const result = {
    source: sourceSchema.collectionName,
    target: targetSchema.collectionName,
    commonFields: [],
    sourceOnlyFields: [],
    targetOnlyFields: [],
    typeDifferences: []
  }

  const sourceFields = Object.keys(sourceSchema.fields)
  const targetFields = Object.keys(targetSchema.fields)

  sourceFields.forEach(field => {
    if (targetFields.includes(field)) {
      const sourceTypes = sourceSchema.fields[field].types
      const targetTypes = targetSchema.fields[field].types

      const typesMatch = arraysEqual(sourceTypes, targetTypes)
      
      result.commonFields.push({
        name: field,
        sourceTypes,
        targetTypes,
        typesMatch
      })
      
      if (!typesMatch) {
        result.typeDifferences.push({
          field,
          sourceTypes,
          targetTypes
        })
      }
    } else {
      result.sourceOnlyFields.push({
        name: field,
        types: sourceSchema.fields[field].types
      })
    }
  })

  targetFields.forEach(field => {
    if (!sourceFields.includes(field)) {
      result.targetOnlyFields.push({
        name: field,
        types: targetSchema.fields[field].types
      })
    }
  })

  result.stats = {
    sourceFieldCount: sourceFields.length,
    targetFieldCount: targetFields.length,
    commonFieldCount: result.commonFields.length,
    mismatchCount: result.typeDifferences.length
  }
  
  return result
}

export const arraysEqual = (a, b) => {
  if (a.length !== b.length) return false
  const sortedA = [...a].sort()
  const sortedB = [...b].sort()
  return sortedA.every((item, i) => item === sortedB[i])
}

export const generateJsonSchemaValidator = (schema, strictness) => {
  const validator = {
    $jsonSchema: {
      bsonType: "object",
      required: [],
      properties: {}
    }
  }

  const requiredThreshold = 
    strictness === 'strict' ? 90 :
    strictness === 'moderate' ? 75 :
    60
  
  Object.entries(schema.fields).forEach(([fieldPath, info]) => {
    if (fieldPath.includes('.')) return

    const cleanFieldPath = fieldPath.replace('[]', '')

    let bsonTypes = []
    info.types.forEach(type => {
      switch(type) {
        case 'string':
          bsonTypes.push('string')
          break
        case 'number':
          bsonTypes.push('number', 'double', 'int')
          break
        case 'boolean':
          bsonTypes.push('bool')
          break
        case 'array':
          bsonTypes.push('array')
          break
        case 'object':
          bsonTypes.push('object')
          break
        case 'null':
          bsonTypes.push('null')
          break
        case 'Date':
          bsonTypes.push('date')
          break
        case 'ObjectId':
          bsonTypes.push('objectId')
          break
      }
    })

    const fieldSchema = bsonTypes.length === 1 
      ? { bsonType: bsonTypes[0] }
      : { bsonType: bsonTypes }

    validator.$jsonSchema.properties[cleanFieldPath] = fieldSchema

    const coverage = info.coverage || Math.round((info.count / schema.sampleSize) * 100)
    if (coverage >= requiredThreshold && !info.types.includes('null')) {
      validator.$jsonSchema.required.push(cleanFieldPath)
    }
  })

  if (strictness === 'strict') {
    validator.$jsonSchema.additionalProperties = false
  }
  
  return validator
}