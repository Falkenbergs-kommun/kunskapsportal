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
    
    if (!article.content || !article.content.root || !article.content.root.children) {
      throw new Error('Article has no content')
    }
    
    console.log(`Adding ${imageIds.length} images to article ${articleId}`)
    
    // Create upload blocks for each image
    const uploadBlocks = imageIds.map(imageId => ({
      type: 'upload',
      version: 1,
      value: {
        id: imageId.toString()
      },
      relationTo: 'media'
    }))
    
    // Add a separator before images
    const separator = {
      type: 'horizontalRule',
      version: 1
    }
    
    // Add the separator and upload blocks to the content
    const newContent = {
      ...article.content,
      root: {
        ...article.content.root,
        children: [
          ...article.content.root.children,
          separator,
          ...uploadBlocks
        ]
      }
    }
    
    // Update the article
    await payload.update({
      collection: 'articles',
      id: articleId,
      data: {
        content: newContent as any
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