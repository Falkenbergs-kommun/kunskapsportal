import { getPayload } from 'payload'
import config from '../payload.config'

// Function to add upload blocks to an article
export async function addImagesToArticle(articleId: string, imageIds: number[]) {
  const payload = await getPayload({ config })
  
  try {
    // Get the current article
    const article = await payload.findByID({
      collection: 'articles',
      id: articleId,
    })

    const currentContent = typeof article.content === 'string' ? article.content : ''

    console.log(`Adding ${imageIds.length} images to article ${articleId}`)

    // Fetch image details to create markdown references
    const images = await Promise.all(
      imageIds.map(async (imageId: number) => {
        try {
          const media = await payload.findByID({
            collection: 'media',
            id: imageId,
          })
          return media
        } catch (error) {
          console.error(`Failed to fetch image ${imageId}:`, error)
          return null
        }
      })
    )

    // Create markdown image syntax for each image
    const imageMarkdown = images
      .filter((img) => img !== null)
      .map((img) => `![${img.filename || 'Image'}](${img.url || ''})`)
      .join('\n\n')

    // Add a separator and images to the content
    const newContent = `${currentContent}\n\n---\n\n${imageMarkdown}`

    // Update the article
    await payload.update({
      collection: 'articles',
      id: articleId,
      data: {
        content: newContent
      }
    })
    
    console.log(`✅ Successfully added ${imageIds.length} images to article ${articleId}`)
    return { success: true, message: `Added ${imageIds.length} images` }
    
  } catch (error) {
    console.error(`❌ Error adding images to article ${articleId}:`, error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Script to run if called directly
if (require.main === module) {
  const articleId = process.argv[2]
  const imageIdsStr = process.argv[3]
  
  if (!articleId || !imageIdsStr) {
    console.log('Usage: npm run script addImagesToArticle.ts <articleId> <imageIds>')
    console.log('Example: npm run script addImagesToArticle.ts 4 "166,167,168,169,170"')
    process.exit(1)
  }
  
  const imageIds = imageIdsStr.split(',').map(id => parseInt(id.trim()))
  
  addImagesToArticle(articleId, imageIds)
    .then(result => {
      console.log('Result:', result)
      process.exit(result.success ? 0 : 1)
    })
    .catch(error => {
      console.error('Script error:', error)
      process.exit(1)
    })
}