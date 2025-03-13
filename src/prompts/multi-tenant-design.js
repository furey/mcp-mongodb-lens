// src/prompts/multi-tenant-design.js

import { z } from 'zod'
import { getMongoClient } from '../db/client.js'
import { log } from '../config/index.js'

/**
 * Implements the 'multi-tenant-design' prompt for MongoDB Lens
 * Provides guidance on MongoDB multi-tenant database architecture design
 */
export default function multiTenantDesignPrompt(server) {
  server.prompt(
    'multi-tenant-design',
    'Design MongoDB multi-tenant database architecture',
    {
      tenantIsolation: z.enum(['database', 'collection', 'field']).describe('Level of tenant isolation required'),
      estimatedTenants: z.string().describe('Estimated number of tenants'),
      sharedFeatures: z.string().describe('Features/data that will be shared across tenants'),
      tenantSpecificFeatures: z.string().describe('Features/data unique to each tenant'),
      scalingPriorities: z.string().optional().describe('Primary scaling concerns (e.g., read-heavy, write-heavy)')
    },
    ({ tenantIsolation, estimatedTenants, sharedFeatures, tenantSpecificFeatures, scalingPriorities }) => {
      const estimatedTenantsNum = parseInt(estimatedTenants, 10) || 1
      log(`Prompt: Initializing multiTenantDesign with ${tenantIsolation} isolation level for ${estimatedTenantsNum} tenants.`)
      
      const mongoClient = getMongoClient()
      const mongoVersion = mongoClient.topology?.lastIsMaster?.version || 'recent'
      
      return {
        description: 'MongoDB Multi-Tenant Architecture Design',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `I need to design a multi-tenant MongoDB architecture with the following requirements:
  
  - Tenant isolation level: ${tenantIsolation}
  - Estimated number of tenants: ${estimatedTenants}
  - Shared features/data: ${sharedFeatures}
  - Tenant-specific features/data: ${tenantSpecificFeatures}
  ${scalingPriorities ? `- Scaling priorities: ${scalingPriorities}` : ''}
  
  Please provide:
  1. Recommended multi-tenant architecture for MongoDB
  2. Data model with collection structures and relationships
  3. Schema examples (in JSON) for each collection
  4. Indexing strategy for optimal tenant isolation and performance
  5. Security considerations and access control patterns
  6. Scaling approach as tenant count and data volume grow
  7. Query patterns to efficiently retrieve tenant-specific data
  8. Specific MongoDB features to leverage for multi-tenancy
  9. Potential challenges and mitigation strategies
  
  For context, I'm using MongoDB version ${mongoVersion} and want to ensure my architecture follows best practices.`
            }
          }
        ]
      }
    }
  )
}