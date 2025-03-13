// src/prompts/migration-guide.js

import { z } from 'zod'
import { log } from '../config/index.js'

/**
 * Implements the 'migration-guide' prompt for MongoDB Lens
 * Provides step-by-step guidance for MongoDB version migrations
 */
export default function migrationGuidePrompt(server) {
  server.prompt(
    'migration-guide',
    'Generate MongoDB migration steps between versions',
    {
      sourceVersion: z.string().describe('Source MongoDB version'),
      targetVersion: z.string().describe('Target MongoDB version'),
      features: z.string().optional().describe('Optional: specific features you use')
    },
    ({ sourceVersion, targetVersion, features }) => {
      log(`Prompt: Initializing migrationGuide from ${sourceVersion} to ${targetVersion}.`)
      
      return {
        description: 'MongoDB Version Migration Guide',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `I need to migrate my MongoDB deployment from version ${sourceVersion} to ${targetVersion}.

${features ? `Key features I'm using: ${features}\n\n` : ''}
Please provide:
1. Step-by-step migration plan
2. Pre-migration checks and preparations
3. Breaking changes and deprecated features to be aware of
4. New features or improvements I can leverage
5. Common pitfalls and how to avoid them
6. Performance considerations
7. Rollback strategy in case of issues`
            }
          }
        ]
      }
    }
  )
}