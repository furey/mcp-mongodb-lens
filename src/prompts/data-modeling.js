// src/prompts/data-modeling.js

import { z } from 'zod'
import { log } from '../config/index.js'

/**
 * Implements the 'data-modeling' prompt for MongoDB Lens
 * Get MongoDB data modeling advice for specific use cases
 */
export default function dataModelingPrompt(server) {
  server.prompt(
    'data-modeling',
    'Get MongoDB data modeling advice for specific use cases',
    {
      useCase: z.string().describe('Describe your application or data use case'),
      requirements: z.string().describe('Key requirements (performance, access patterns, etc.)'),
      existingData: z.string().optional().describe('Optional: describe any existing data structure')
    },
    ({ useCase, requirements, existingData }) => {
      log(`Prompt: Initializing dataModeling for use case: "${useCase}".`)
      return {
        description: 'MongoDB Data Modeling Guide',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `I need help designing a MongoDB data model for this use case: "${useCase}".

Key requirements:
${requirements}

${existingData ? `Existing data structure:\n${existingData}\n\n` : ''}
Please provide:
1. Recommended data model with collection structures
2. Sample document structures in JSON format
3. Explanation of design decisions and trade-offs
4. Appropriate indexing strategy
5. Any MongoDB-specific features or patterns I should consider
6. How this model addresses the stated requirements`
            }
          }
        ]
      }
    }
  )
}