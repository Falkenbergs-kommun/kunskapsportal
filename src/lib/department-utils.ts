import type { PayloadRequest } from 'payload'

/**
 * Compute full hierarchical path for a department by recursively fetching parent chain
 *
 * @param parentId - The ID of the parent department
 * @param slug - The slug of the current department
 * @param req - Payload request object for database queries
 * @returns Full slash-separated path (e.g., "HR/Utveckling")
 */
export async function computeFullPath(
  parentId: number | string | null | undefined,
  slug: string,
  req: PayloadRequest,
): Promise<string> {
  if (!parentId) return slug

  try {
    const parent = await req.payload.findByID({
      collection: 'departments',
      id: typeof parentId === 'string' ? parseInt(parentId) : parentId,
      depth: 0,
    })

    if (!parent || !parent.slug) return slug

    // Recursively build the path from the parent chain
    let parentPath = parent.slug
    if (parent.parent) {
      const parentId = typeof parent.parent === 'object' ? parent.parent.id : parent.parent
      parentPath = await computeFullPath(parentId, parent.slug, req)
    }

    return `${parentPath}/${slug}`
  } catch (error) {
    // If parent not found, just return the slug
    return slug
  }
}

/**
 * Update fullPath for all children when parent path changes
 * Recursively updates the entire subtree
 *
 * @param departmentId - The department whose children should be updated
 * @param req - Payload request object for database queries
 */
export async function cascadeUpdateChildrenPaths(
  departmentId: number,
  req: PayloadRequest,
): Promise<void> {
  try {
    // Find all direct children of this department
    const children = await req.payload.find({
      collection: 'departments',
      where: {
        parent: { equals: departmentId },
      },
      limit: 1000,
    })

    // Get the parent department to build the path
    const parent = await req.payload.findByID({
      collection: 'departments',
      id: departmentId,
      depth: 0,
    })

    if (!parent) return

    const parentPath = parent.fullPath || parent.slug

    // Update each child's fullPath
    for (const child of children.docs) {
      const newPath = parentPath ? `${parentPath}/${child.slug}` : child.slug

      await req.payload.update({
        collection: 'departments',
        id: child.id,
        data: {
          fullPath: newPath,
        },
      })

      // Recursively update grandchildren
      await cascadeUpdateChildrenPaths(child.id, req)
    }
  } catch (error) {
    console.error('Error cascading department path updates:', error)
  }
}
