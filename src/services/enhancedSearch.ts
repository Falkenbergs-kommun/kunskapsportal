import { searchKnowledgeBase, type SearchResult, type SearchOptions } from './qdrantSearch'
import { getPayload } from 'payload'
import config from '@payload-config'

export interface EnhancedSearchResult extends SearchResult {
  slug: string
  url: string
}

export async function searchWithArticleData({
  query,
  departmentIds = [],
  limit = 5,
}: SearchOptions): Promise<EnhancedSearchResult[]> {
  // Get search results from Qdrant
  const searchResults = await searchKnowledgeBase({
    query,
    departmentIds,
    limit,
  })

  if (searchResults.length === 0) {
    return []
  }

  // Get article IDs
  const articleIds = searchResults.map(r => r.articleId).filter(Boolean)
  
  if (articleIds.length === 0) {
    return searchResults.map(r => ({
      ...r,
      slug: '',
      url: '',
    }))
  }

  try {
    // Fetch article details from Payload
    const payload = await getPayload({ config })
    const articles = await payload.find({
      collection: 'articles',
      where: {
        id: {
          in: articleIds,
        },
      },
      depth: 2, // Include department info
      limit: articleIds.length,
    })

    // Create a map of article ID to article data
    const articleMap = new Map(
      articles.docs.map(article => [article.id, article])
    )

    // Enhance search results with article data
    return searchResults.map(result => {
      const article = articleMap.get(Number(result.articleId))
      
      if (article && article.slug && article.department) {
        // Build the URL path
        const deptSlug = typeof article.department === 'object' 
          ? article.department.slug 
          : article.department
        
        const url = `/articles/${deptSlug}/${article.slug}`
        
        return {
          ...result,
          slug: article.slug,
          url,
        }
      }
      
      // Fallback if no article found
      return {
        ...result,
        slug: '',
        url: '',
      }
    })
  } catch (error) {
    console.error('Error fetching article data:', error)
    // Return results without enhancement
    return searchResults.map(r => ({
      ...r,
      slug: '',
      url: '',
    }))
  }
}