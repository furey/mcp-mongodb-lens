// src/prompts/index.js

import queryBuilderPrompt from './query-builder.js'
import schemaAnalysisPrompt from './schema-analysis.js'
import aggregationBuilderPrompt from './aggregation-builder.js'
import indexRecommendationPrompt from './index-recommendation.js'
import mongoShellPrompt from './mongo-shell.js'
import dataModelingPrompt from './data-modeling.js'
import queryOptimizerPrompt from './query-optimizer.js'
import sqlToMongodbPrompt from './sql-to-mongodb.js'
import databaseHealthCheckPrompt from './database-health-check.js'
import securityAuditPrompt from './security-audit.js'
import backupStrategyPrompt from './backup-strategy.js'
import migrationGuidePrompt from './migration-guide.js'
import inspectorGuidePrompt from './inspector-guide.js'
import multiTenantDesignPrompt from './multi-tenant-design.js'
import schemaVersioningPrompt from './schema-versioning.js'

export function registerPrompts(server) {
  queryBuilderPrompt(server)
  schemaAnalysisPrompt(server)
  aggregationBuilderPrompt(server)
  indexRecommendationPrompt(server)
  mongoShellPrompt(server)
  dataModelingPrompt(server)
  queryOptimizerPrompt(server)
  sqlToMongodbPrompt(server)
  databaseHealthCheckPrompt(server)
  securityAuditPrompt(server)
  backupStrategyPrompt(server)
  migrationGuidePrompt(server)
  inspectorGuidePrompt(server)
  multiTenantDesignPrompt(server)
  schemaVersioningPrompt(server)
}