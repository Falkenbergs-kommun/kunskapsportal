#!/usr/bin/env tsx

// Load environment variables first
import 'dotenv/config'

import { getPayload } from 'payload'
import type { Article } from '../payload-types'

/**
 * Sync Qdrant to only contain documents with 'active' status
 * This script will:
 * 1. Get all articles from the database
 * 2. Embed only active articles in Qdrant
 * 3. Remove non-active articles from Qdrant
 */
async function syncQdrantActiveDocuments() {
  console.log('🚀 Starting Qdrant active documents sync...')

  try {
    // Dynamic imports to avoid loading modules with env requirements at startup
    const configModule = await import('../payload.config.js')
    const config = configModule.default
    const { embed, deleteFromQdrant } = await import('../qdrant/index.js')
    
    const payload = await getPayload({ config })
    
    // Get all articles from the database
    const { docs: articles } = await payload.find({
      collection: 'articles',
      limit: 1000, // Adjust as needed
      depth: 2, // Include department relationship
    })

    console.log(`📋 Found ${articles.length} articles in database`)

    let activeCount = 0
    let removedCount = 0
    let errors = 0

    for (const article of articles as Article[]) {
      try {
        if (article.documentStatus === 'active') {
          console.log(`✅ Embedding active article: ${article.title} (ID: ${article.id})`)
          await embed(article, payload.config)
          activeCount++
        } else {
          console.log(`🗑️  Removing non-active article: ${article.title} (ID: ${article.id}) [Status: ${article.documentStatus || 'undefined'}]`)
          await deleteFromQdrant(String(article.id))
          removedCount++
        }
      } catch (error) {
        console.error(`❌ Error processing article ${article.id}:`, error)
        errors++
      }
    }

    console.log('\n📊 Sync Summary:')
    console.log(`   Active documents embedded: ${activeCount}`)
    console.log(`   Non-active documents removed: ${removedCount}`)
    console.log(`   Errors: ${errors}`)
    console.log(`   Total processed: ${articles.length}`)

    if (errors === 0) {
      console.log('✅ Sync completed successfully!')
    } else {
      console.log(`⚠️  Sync completed with ${errors} errors`)
    }

  } catch (error) {
    console.error('💥 Fatal error during sync:', error)
    process.exit(1)
  }
}

// Check if QDRANT_ENABLED is true
if (process.env.QDRANT_ENABLED !== 'true') {
  console.log('⚠️  QDRANT_ENABLED is not set to "true". Qdrant sync skipped.')
  process.exit(0)
}

syncQdrantActiveDocuments()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })