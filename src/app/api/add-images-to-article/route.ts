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
    
    if (!article.content || !article.content.root || !article.content.root.children) {
      return NextResponse.json(
        { error: 'Article has no content' },
        { status: 400 }
      )
    }
    
    console.log(`Adding ${imageIds.length} images to article ${articleId}`)
    
    // Create upload blocks for each image with proper Lexical structure
    const uploadBlocks = imageIds.map((imageId: number) => ({
      type: 'upload',
      version: 1,
      value: {
        id: imageId
      },
      relationTo: 'media',
      fields: {}
    }))
    
    // Add a separator before images
    const separator = {
      type: 'horizontalRule',
      version: 1,
      children: []
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