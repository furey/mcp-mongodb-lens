// src/resources/performance-metrics.js

import { getPerformanceMetrics } from '../db/client.js'
import { formatPerformanceMetrics } from '../utils/formatting.js'
import { log } from '../config/index.js'

/**
 * Implements the 'performance-metrics' resource for MongoDB Lens
 * Provides real-time MongoDB performance metrics and profiling data
 */
export default function performanceMetricsResource(server) {
  server.resource(
    'performance-metrics',
    'mongodb://server/metrics',
    { description: 'Real-time MongoDB performance metrics and profiling data' },
    async () => {
      try {
        log('Resource: Retrieving performance metrics…')
        const metrics = await getPerformanceMetrics()
        log('Resource: Retrieved performance metrics information.')
        return {
          contents: [{
            uri: 'mongodb://server/metrics',
            text: formatPerformanceMetrics(metrics)
          }]
        }
      } catch (error) {
        console.error('Error retrieving performance metrics:', error)
        return {
          contents: [{
            uri: 'mongodb://server/metrics',
            text: `Error retrieving performance metrics: ${error.message}`
          }]
        }
      }
    }
  )
}