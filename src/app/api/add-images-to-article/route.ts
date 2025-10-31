import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '../../../payload.config'

export async function POST(request: NextRequest) {
  try {
    const { articleId, imageIds } = await request.json()
    
    if (!articleId || !imageIds || !Array.isArray(imageIds)) {
      return NextResponse.json(
        { error: 'Missing articleId or imageIds array' },
        { status: 400 }
      )
    }
    
    const payload = await getPayload({ config })
    
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
    
    return NextResponse.json({
      success: true,
      message: `Added ${imageIds.length} images to article ${articleId}`,
      imageIds
    })
    
  } catch (error) {
    console.error('Error adding images to article:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}