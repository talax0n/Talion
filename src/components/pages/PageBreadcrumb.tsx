import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import type { PageTreeNode } from '@/types/page'

interface PageBreadcrumbProps {
  page: PageTreeNode
  allPages: PageTreeNode[]
}

function findAncestors(page: PageTreeNode, allPages: PageTreeNode[]): PageTreeNode[] {
  // Flatten tree to map
  const flat = new Map<string, PageTreeNode & { parentId: string | null }>()
  function flatten(nodes: PageTreeNode[]) {
    nodes.forEach(n => {
      flat.set(n.id, n as any)
      if (n.children) flatten(n.children)
    })
  }
  flatten(allPages)

  const ancestors: PageTreeNode[] = []
  let current = flat.get(page.id)
  while (current?.parentId) {
    const parent = flat.get(current.parentId)
    if (parent) ancestors.unshift(parent)
    current = parent
  }
  return ancestors
}

export function PageBreadcrumb({ page, allPages }: PageBreadcrumbProps) {
  const ancestors = findAncestors(page, allPages)

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/dashboard">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        {ancestors.map(ancestor => (
          <>
            <BreadcrumbItem key={ancestor.id}>
              <BreadcrumbLink href={`/pages/${ancestor.id}`}>
                {ancestor.icon && <span className="mr-1">{ancestor.icon}</span>}
                {ancestor.title}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </>
        ))}
        <BreadcrumbItem>
          <BreadcrumbPage>
            {page.icon && <span className="mr-1">{page.icon}</span>}
            {page.title}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
