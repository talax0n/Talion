export interface PageTreeNode {
  id: string
  workspaceId: string
  parentId: string | null
  title: string
  slug: string
  icon?: string | null
  status: string
  position: number
  children: PageTreeNode[]
  tags: Array<{ tagId: string; tag: { id: string; name: string; color: string } }>
}

export interface CreatePageInput {
  workspaceId: string
  parentId?: string | null
  title?: string
  authorId: string
}

export interface UpdatePageInput {
  title?: string
  contentMd?: string
  contentHtml?: string
  status?: string
  visibility?: string
  icon?: string
  parentId?: string | null
  position?: number
}
