import type { SanitizedConfig } from 'payload'
import { convertLexicalToMarkdown, editorConfigFactory } from '@payloadcms/richtext-lexical'
import OpenAI from 'openai'
import { QdrantClient } from '@qdrant/js-client-rest'
import type { Article } from '../payload-types'
import { v5 as uuidv5 } from 'uuid'
import { promises as fs } from 'fs'
import path from 'path'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

if (!process.env.QDRANT_URL) {
  throw new Error('QDRANT_URL is not defined')
}
const qdrantUrl = new URL(process.env.QDRANT_URL)

const qdrant = new QdrantClient({
  host: qdrantUrl.hostname,
  port: parseInt(qdrantUrl.port, 10) || 443,
  apiKey: process.env.QDRANT_API_KEY,
  checkCompatibility: false,
})

const EMBEDDING_MODEL = 'text-embedding-3-large'
const COLLECTION_NAME = 'articles'
const UUID_NAMESPACE = '3a0a51e2-8777-4f52-bc74-c2cbde0c8b04' // Randomly generated namespace

async function getEmbedding(text: string) {
  const {
    data: [{ embedding }],
  } = await openai.embeddings.create({
    input: text,
    model: EMBEDDING_MODEL,
  })
  return embedding
}

function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  const paragraphs = text.split(/\n\s*\n/)
  const chunks: string[] = []
  let currentChunk = ''

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length + 2 > chunkSize) {
      chunks.push(currentChunk)
      currentChunk = ''
    }
    currentChunk += (currentChunk ? '\n\n' : '') + paragraph
  }

  if (currentChunk) {
    chunks.push(currentChunk)
  }

  return chunks
}

async function ensureCollection() {
  const collections = await qdrant.getCollections()
  const collectionExists = collections.collections.some(
    (collection) => collection.name === COLLECTION_NAME,
  )

  if (!collectionExists) {
    await qdrant.createCollection(COLLECTION_NAME, {
      vectors: {
        size: 3072,
        distance: 'Cosine',
      },
    })
  }
}

export const embed = async (doc: Article, config: SanitizedConfig): Promise<void> => {
  await ensureCollection()

  const editorConfig = await editorConfigFactory.default({
    config,
  })

  if (!doc.content) {
    return
  }

  const markdown = await convertLexicalToMarkdown({
    data: doc.content,
    editorConfig,
  })

  // For debugging, save the markdown to a file
  const debugDir = path.resolve(process.cwd(), 'debug')
  // await fs.mkdir(debugDir, { recursive: true })
  // await fs.writeFile(path.join(debugDir, `${doc.id}.md`), markdown)

  // Delete existing points for this article
  await qdrant.delete(COLLECTION_NAME, {
    filter: {
      must: [
        {
          key: 'articleId',
          match: {
            value: doc.id,
          },
        },
      ],
    },
  })

  const chunks = chunkText(markdown, 4000, 300)

  if (chunks.length > 0) {
    const embeddingBatchSize = 10 // Process embeddings in smaller batches to avoid rate limits
    const qdrantBatchSize = 50 // Smaller batch size for Qdrant to avoid 413 errors

    for (let i = 0; i < chunks.length; i += embeddingBatchSize) {
      const batchChunks = chunks.slice(i, i + embeddingBatchSize)

      // Generate embeddings for this batch with rate limiting
      const batchEmbeddings = []
      for (const chunk of batchChunks) {
        const embedding = await getEmbedding(chunk)
        batchEmbeddings.push(embedding)

        // Add small delay to respect rate limits
        if (batchChunks.length > 1) {
          await new Promise((resolve) => setTimeout(resolve, 100))
        }
      }

      // Upload to Qdrant in smaller sub-batches
      for (let j = 0; j < batchChunks.length; j += qdrantBatchSize) {
        const subBatchChunks = batchChunks.slice(j, j + qdrantBatchSize)
        const subBatchEmbeddings = batchEmbeddings.slice(j, j + qdrantBatchSize)

        await qdrant.upsert(COLLECTION_NAME, {
          points: subBatchChunks.map((chunk, k) => {
            const globalChunkIndex = i + j + k
            return {
              id: uuidv5(chunk, UUID_NAMESPACE),
              vector: subBatchEmbeddings[k],
              payload: {
                text: chunk,
                title: doc.title,
                articleId: doc.id,
                chunkIndex: globalChunkIndex,
                totalChunks: chunks.length,
                chunkPosition: `${globalChunkIndex + 1} of ${chunks.length}`,

                // URL construction fields
                slug: doc.slug || null,
                departmentSlug: typeof doc.department === 'object' ? doc.department?.slug : null,

                // Document metadata
                documentType: doc.documentType || null,
                department: doc.department || null,
                documentStatus: doc.documentStatus || null,
                targetAudience: doc.targetAudience || [],
                securityLevel: doc.securityLevel || null,
                language: doc.language || 'sv',

                // Legal and compliance
                gdprRelevant: doc.gdprRelevant || false,
                accessibilityCompliant: doc.accessibilityCompliant || false,
                legalBasis: doc.legalBasis || [],

                // Content organization
                keywords: doc.keywords?.map((k: any) => k.keyword).filter(Boolean) || [],

                // Lifecycle metadata
                version: doc.version || null,
                reviewInterval: doc.reviewInterval || null,
                appliesTo: doc.appliesTo || null,
                author: doc.author || null,
                authorEmail: doc.authorEmail || null,
                reviewer: doc.reviewer || null,
                approver: doc.approver || null,
                effectiveDate: doc.effectiveDate || null,
                reviewDate: doc.reviewDate || null,
                expiryDate: doc.expiryDate || null,

                // Payload built-in timestamps
                createdAt: doc.createdAt || null,
                updatedAt: doc.updatedAt || null,
              },
            }
          }),
        })
      }
    }
  }
}

export const deleteFromQdrant = async (articleId: string): Promise<void> => {
  await ensureCollection()

  // Delete all points for this article
  await qdrant.delete(COLLECTION_NAME, {
    filter: {
      must: [
        {
          key: 'articleId',
          match: {
            value: articleId,
          },
        },
      ],
    },
  })
}
