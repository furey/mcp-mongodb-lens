// src/prompts/security-audit.js

import { getServerStatus, getDatabaseUsers } from '../db/client.js'
import { formatServerStatus, formatDatabaseUsers } from '../utils/formatting.js'
import { log } from '../config/index.js'

/**
 * Implements the 'security-audit' prompt for MongoDB Lens
 * Provides security analysis and recommendations for MongoDB deployments
 */
export default function securityAuditPrompt(server) {
  server.prompt(
    'security-audit',
    'Get MongoDB security recommendations',
    {},
    async () => {
      log('Prompt: Initializing securityAudit.')
      
      // Get server and user information for the security audit
      const serverStatus = await getServerStatus()
      const users = await getDatabaseUsers()
      
      return {
        description: 'MongoDB Security Audit',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Please help me perform a security audit on my MongoDB deployment.

Server information:
${formatServerStatus(serverStatus)}

User information:
${formatDatabaseUsers(users)}

Please provide:
1. Potential security vulnerabilities in my current setup
2. Recommendations for improving security
3. Authentication and authorization best practices
4. Network security considerations
5. Data encryption options
6. Audit logging recommendations
7. Backup security considerations`
            }
          }
        ]
      }
    }
  )
}