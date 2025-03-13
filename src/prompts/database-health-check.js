// src/prompts/database-health-check.js

import { z } from 'zod'
import { log } from '../config/index.js'
import { 
  getDatabaseStats, 
  listCollections, 
  getServerStatus, 
  getCollectionIndexes,
  getDatabaseUsers
} from '../db/client.js'
import { inferSchema } from '../db/schema.js'

/**
 * Implements the 'database-health-check' prompt for MongoDB Lens
 * Comprehensive database health assessment and recommendations
 */
export default function databaseHealthCheckPrompt(server) {
  server.prompt(
    'database-health-check',
    'Comprehensive database health assessment',
    {
      includePerformance: z.string().default('true').describe('Include performance metrics'),
      includeSchema: z.string().default('true').describe('Include schema analysis'),  
      includeSecurity: z.string().default('true').describe('Include security assessment')
    },
    async ({ includePerformance, includeSchema, includeSecurity }) => {
      const includePerformanceBool = includePerformance.toLowerCase() === 'true'
      const includeSchemaBool = includeSchema.toLowerCase() === 'true'
      const includeSecurityBool = includeSecurity.toLowerCase() === 'true'
      
      log('Prompt: Initializing comprehensive database health check')
   
      const dbStats = await getDatabaseStats()
      const collections = await listCollections()
      
      let serverStatus = null
      let indexes = {}
      let schemaAnalysis = {}
      
      if (includePerformanceBool) {
        serverStatus = await getServerStatus()
        const collectionsToAnalyze = collections.slice(0, 5)
        for (const coll of collectionsToAnalyze) {
          indexes[coll.name] = await getCollectionIndexes(coll.name)
        }
      }
      
      if (includeSchemaBool) {
        const collectionsToAnalyze = collections.slice(0, 3)
        for (const coll of collectionsToAnalyze) {
          schemaAnalysis[coll.name] = await inferSchema(coll.name, 10)
        }
      }
      
      let securityInfo = null
      if (includeSecurityBool) {
        const users = await getDatabaseUsers()
        securityInfo = {
          users,
          auth: serverStatus ? serverStatus.security : null
        }
      }
      
      return {
        description: `MongoDB Health Check`,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Please perform a comprehensive health check on my MongoDB database and provide recommendations for improvements.
    
    Database Statistics:
    ${JSON.stringify(dbStats, null, 2)}
    
    Collections (${collections.length}):
    ${collections.map(c => `- ${c.name}`).join('\n')}
    
    ${includePerformanceBool ? `\nPerformance Metrics:
    ${JSON.stringify(serverStatus ? {
      connections: serverStatus.connections,
      opcounters: serverStatus.opcounters,
      mem: serverStatus.mem
    } : {}, null, 2)}
    
    Indexes:
    ${Object.entries(indexes).map(([coll, idxs]) => 
      `- ${coll}: ${idxs.length} indexes`
    ).join('\n')}` : ''}
    
    ${includeSchemaBool ? `\nSchema Samples:
    ${Object.keys(schemaAnalysis).join(', ')}` : ''}
    
    ${includeSecurityBool ? `\nSecurity Information:
    - Users: ${securityInfo.users.users ? securityInfo.users.users.length : 'N/A'}
    - Authentication: ${securityInfo.auth && securityInfo.auth.authentication ? 
    JSON.stringify(securityInfo.auth.authentication.mechanisms || securityInfo.auth.authentication) : 'N/A'}` : ''}
    
    Please provide:
    1. Overall health assessment
    2. Urgent issues that need addressing
    3. Performance optimization recommendations
    4. Schema design suggestions and improvements
    5. Security best practices and concerns
    6. Monitoring and maintenance recommendations
    7. Specific MongoDB Lens tools to use for implementing your recommendations`
            }
          }
        ]
      }
    }
  )
}