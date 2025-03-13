// src/prompts/schema-versioning.js

import { z } from 'zod'
import { inferSchema } from '../db/client.js'
import { formatSchema } from '../utils/formatting.js'
import { log } from '../config/index.js'

/**
 * Implements the 'schema-versioning' prompt for MongoDB Lens
 * Provides guidance on schema evolution and versioning in MongoDB
 */
export default function schemaVersioningPrompt(server) {
  server.prompt(
    'schema-versioning',
    'Manage schema evolution in MongoDB applications',
    {
      collection: z.string().min(1).describe('Collection name to version'),
      currentSchema: z.string().describe('Current schema structure (brief description)'),
      plannedChanges: z.string().describe('Planned schema changes'),
      migrationConstraints: z.string().optional().describe('Migration constraints (e.g., zero downtime)')
    },
    async ({ collection, currentSchema, plannedChanges, migrationConstraints }) => {
      log(`Prompt: Initializing schemaVersioning for collection '${collection}'…`)

      const schema = await inferSchema(collection)
      
      return {
        description: 'MongoDB Schema Versioning Strategy',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `I need to implement schema versioning/evolution for the '${collection}' collection in MongoDB. Please help me design a strategy.
  
  Current Schema Information:
  ${formatSchema(schema)}
  
  Current Schema Description: 
  ${currentSchema}
  
  Planned Schema Changes:
  ${plannedChanges}
  
  ${migrationConstraints ? `Migration Constraints: ${migrationConstraints}` : ''}
  
  Please provide:
  1. Recommended approach to schema versioning in MongoDB
  2. Step-by-step migration plan for these specific changes
  3. Code examples showing how to handle both old and new schema versions
  4. Schema validation rules to enforce the new schema
  5. Performance considerations during migration
  6. Rollback strategy if needed
  7. Testing approach to validate the migration
  8. MongoDB Lens tools and commands to use for the migration process
  
  I want to ensure backward compatibility during this transition.`
            }
          }
        ]
      }
    }
  )
}