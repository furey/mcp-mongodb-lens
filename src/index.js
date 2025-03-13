#!/usr/bin/env node

import { 
  loadConfigFile, 
  log, 
  setupEventListeners,
  exit
} from './config/index.js'
import { initServer } from './core/server.js'
import { connectTransport } from './core/transport.js'
import { registerResources } from './resources/index.js'
import { registerTools } from './tools/index.js'
import { registerPrompts } from './prompts/index.js'

const main = async (mongoUri) => {
  // Load configuration
  loadConfigFile()
  
  // Set up event listeners for clean shutdown
  setupEventListeners()
  
  // Initialize server
  const server = await initServer(mongoUri, {
    registerResources,
    registerTools,
    registerPrompts
  })
  
  if (!server) {
    log('Failed to initialize server. Exiting.', true)
    exit(1)
    return false
  }
  
  // Connect transport
  const transport = await connectTransport(server)
  if (!transport) {
    log('Failed to connect transport. Exiting.', true)
    exit(1)
    return false
  }
  
  return true
}

// Get MongoDB URI from command line arguments or use default
const mongoUri = process.argv[2] || 'mongodb://localhost:27017'

// Run the main function
main(mongoUri).catch(error => {
  console.error('Unhandled error:', error)
  exit(1)
})