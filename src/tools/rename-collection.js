// src/tools/rename-collection.js

import { z } from 'zod'
import { withErrorHandling } from '../core/error-handling.js'
import { log } from '../config/index.js'
import { renameCollection } from '../db/client.js'

/**
 * Implements the 'rename-collection' tool for MongoDB Lens
 * Rename an existing collection
 */
export default function renameCollectionTool(server) {
  server.tool(
    'rename-collection',
    'Rename an existing collection',
    {
      oldName: z.string().min(1).describe('Current collection name'),
      newName: z.string().min(1).describe('New collection name'),
      dropTarget: z.boolean().default(false).describe('Whether to drop target collection if it exists')
    },
    async ({ oldName, newName, dropTarget }) => {
      return withErrorHandling(async () => {
        log(`Tool: Renaming collection from '${oldName}' to '${newName}'…`)
        log(`Tool: Drop target if exists: ${dropTarget}`)
        
        const result = await renameCollection(oldName, newName, dropTarget)
        log(`Tool: Collection renamed successfully.`)
        return {
          content: [{
            type: 'text',
            text: `Collection '${oldName}' renamed to '${newName}' successfully.`
          }]
        }
      }, `Error renaming collection from '${oldName}' to '${newName}'`)
    }
  )
}