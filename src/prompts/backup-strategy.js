// src/prompts/backup-strategy.js

import { z } from 'zod'
import { getCurrentDbName } from '../db/client.js'
import { log } from '../config/index.js'

/**
 * Implements the 'backup-strategy' prompt for MongoDB Lens
 * Provides advice on MongoDB backup and recovery approaches
 */
export default function backupStrategyPrompt(server) {
  server.prompt(
    'backup-strategy',
    'Get advice on MongoDB backup and recovery approaches',
    {
      databaseSize: z.string().optional().describe('Optional: database size information'),
      uptime: z.string().optional().describe('Optional: uptime requirements (e.g. "99.9%")'),
      rpo: z.string().optional().describe('Optional: recovery point objective'),
      rto: z.string().optional().describe('Optional: recovery time objective')
    },
    ({ databaseSize, uptime, rpo, rto }) => {
      log('Prompt: Initializing backupStrategy.')
      const currentDbName = getCurrentDbName()

      return {
        description: 'MongoDB Backup & Recovery Strategy',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `I need recommendations for a MongoDB backup and recovery strategy.

${databaseSize ? `Database size: ${databaseSize}\n` : ''}${uptime ? `Uptime requirement: ${uptime}\n` : ''}${rpo ? `Recovery Point Objective (RPO): ${rpo}\n` : ''}${rto ? `Recovery Time Objective (RTO): ${rto}\n` : ''}
Current database: ${currentDbName}

Please provide:
1. Recommended backup methods for my scenario
2. Backup frequency and retention recommendations
3. Storage considerations and best practices
4. Restoration procedures and testing strategy
5. Monitoring and validation approaches
6. High availability considerations
7. Tools and commands for implementing the strategy`
            }
          }
        ]
      }
    }
  )
}