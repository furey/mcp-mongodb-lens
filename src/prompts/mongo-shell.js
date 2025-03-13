// src/prompts/mongo-shell.js

import { z } from 'zod'
import { getCurrentDbName } from '../db/client.js'
import { log } from '../config/index.js'

/**
 * Implements the 'mongo-shell' prompt for MongoDB Lens
 * Generate MongoDB shell commands
 */
export default function mongoShellPrompt(server) {
  server.prompt(
    'mongo-shell',
    'Generate MongoDB shell commands',
    {
      operation: z.string().describe('Operation you want to perform'),
      details: z.string().optional().describe('Additional details about the operation')
    },
    ({ operation, details }) => {
      log(`Prompt: Initializing mongoShell for operation: "${operation}" with${details ? ' details: "' + details + '"' : 'out details'}.`)
      const currentDbName = getCurrentDbName()
      
      return {
        description: 'MongoDB Shell Command Generator',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Please generate MongoDB shell commands to ${operation}${details ? ` with these details: ${details}` : ''}.

I need:
1. The exact MongoDB shell command(s)
2. Explanation of each part of the command
3. How this translates to using MongoDB Lens tools
4. Any important considerations or variations

Current database: ${currentDbName}`
            }
          }
        ]
      }
    }
  )
}