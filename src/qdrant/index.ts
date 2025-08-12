import type { SanitizedConfig } from 'payload'
import { convertLexicalToMarkdown, editorConfigFactory } from '@payloadcms/richtext-lexical'
import OpenAI from 'openai'
import { QdrantClient } from '@qdrant/js-client-rest'
import type { Article } from '../payload-types'
import { v5 as uuidv5 } from 'uuid'

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
  const chunks: string[] = []
  let start = 0
  while (start < text.length) {
    const end = start + chunkSize
    chunks.push(text.slice(start, end))
    if (end >= text.length) {
      break
    }
    start += chunkSize - overlap
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
  const embeddings = await Promise.all(chunks.map(getEmbedding))

  if (chunks.length > 0) {
    await qdrant.upsert(COLLECTION_NAME, {
      points: chunks.map((chunk, i) => ({
        id: uuidv5(chunk, UUID_NAMESPACE),
        vector: embeddings[i],
        payload: {
          text: chunk,
          title: doc.title,
          slug: doc.slug,
          articleId: doc.id,
        },
      })),
    })
  }
}
