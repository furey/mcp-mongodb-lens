// src/prompts/inspector-guide.js

import { log } from '../config/index.js'

/**
 * Implements the 'inspector-guide' prompt for MongoDB Lens
 * Provides help on using MongoDB Lens with MCP Inspector
 */
export default function inspectorGuidePrompt(server) {
  server.prompt(
    'inspector-guide',
    'Get help using MongoDB Lens with MCP Inspector',
    {},
    () => {
      log('Prompt: Initializing inspectorGuide.')
      
      return {
        description: 'MongoDB Lens Inspector Guide',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `I'm using the MCP Inspector with MongoDB Lens. How can I best use these tools together?

Please provide:
1. An overview of the most useful Inspector features for MongoDB
2. Tips for debugging MongoDB queries
3. Common workflows for exploring a database
4. How to use the Inspector features with MongoDB Lens resources and tools`
            }
          }
        ]
      }
    }
  )
}