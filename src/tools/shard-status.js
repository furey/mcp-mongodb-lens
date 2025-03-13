// src/tools/shard-status.js

import { z } from 'zod'
import { withErrorHandling } from '../core/error-handling.js'
import { 
  getShardingDbStatus,
  getShardingCollectionStatus,
  getCurrentDb,
  getCurrentDbName
} from '../db/client.js'
import { 
  formatShardDbStatus,
  formatShardCollectionStatus
} from '../utils/formatting.js'
import { log } from '../config/index.js'
import mongodb from 'mongodb'

const { MongoClient } = mongodb

/**
 * Implements the 'shard-status' tool for MongoDB Lens
 * Shows sharding configuration for databases and collections
 */
export default function shardStatusTool(server) {
  server.tool(
    'shard-status',
    'Get sharding status for database or collections',
    {
      target: z.enum(['database', 'collection']).default('database').describe('Target type'),
      collection: z.string().optional().describe('Collection name (if target is collection)')
    },
    async ({ target, collection }) => {
      return withErrorHandling(async () => {
        log(`Tool: Getting shard status for ${target}${collection ? ` '${collection}'` : ''}`)
        
        // Access admin database
        const currentDb = getCurrentDb()
        const currentDbName = getCurrentDbName()
        const adminDb = currentDb.client.db('admin')
        let result
        
        // Get sharding status based on target type
        if (target === 'database') {
          const listShards = await adminDb.command({ listShards: 1 }).catch(() => ({ shards: [] }))
          const dbStats = await adminDb.command({ dbStats: 1, scale: 1 }).catch(() => ({}))
          const dbShardStatus = await getShardingDbStatus(currentDbName)
          
          result = formatShardDbStatus(listShards, dbStats, dbShardStatus, currentDbName)
        } else {
          if (!collection) throw new Error('Collection name is required when target is collection')
          
          const collStats = await currentDb.command({ collStats: collection }).catch(() => ({ sharded: false }))
          const collShardStatus = await getShardingCollectionStatus(currentDbName, collection)
          
          result = formatShardCollectionStatus(collStats, collShardStatus, collection)
        }
        
        return {
          content: [{
            type: 'text',
            text: result
          }]
        }
      }, `Error getting shard status for ${target}${collection ? ` '${collection}'` : ''}`)
    }
  )
}