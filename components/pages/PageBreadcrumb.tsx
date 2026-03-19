'use client';

import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import type { PageRecord } from '@/lib/pages';

interface PageBreadcrumbProps {
  page: PageRecord | null;
  pages: PageRecord[];
}

function buildAncestors(page: PageRecord, pages: PageRecord[]): PageRecord[] {
  const ancestors: PageRecord[] = [];
  let current: PageRecord | undefined = page;

  while (current?.parent_id) {
    const parent = pages.find((p) => p.id === current!.parent_id);
    if (!parent) break;
    ancestors.unshift(parent);
    current = parent;
  }

  return ancestors;
}

export function PageBreadcrumb({ page, pages }: PageBreadcrumbProps) {
  const ancestors = page ? buildAncestors(page, pages) : [];

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/dashboard">Home</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {ancestors.map((ancestor) => (
          <>
            <BreadcrumbSeparator key={`sep-${ancestor.id}`} />
            <BreadcrumbItem key={ancestor.id}>
              <BreadcrumbLink asChild>
                <Link href={`/dashboard/pages/${ancestor.id}`}>
                  {ancestor.icon ? `${ancestor.icon} ` : ''}
                  {ancestor.title || 'Untitled'}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </>
        ))}

        {page && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {page.icon ? `${page.icon} ` : ''}
                {page.title || 'Untitled'}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
