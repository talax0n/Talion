'use client'

import { SearchResultItem } from './SearchResultItem'

interface SearchResult {
  id: string
  title: string
  contentMd: string
  status: string
  updatedAt: string
  workspace?: { name: string }
  tags?: Array<{ tag: { name: string; color: string } }>
}

interface SearchResultsProps {
  results: SearchResult[]
  query: string
}

export function SearchResults({ results, query }: SearchResultsProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          {query ? `Results for "${query}"` : 'Recent pages'}
        </h2>
        <span className="text-sm text-muted-foreground">
          {results.length} result{results.length !== 1 ? 's' : ''}
        </span>
      </div>
      {results.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No pages found{query ? ` for "${query}"` : ''}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {results.map(result => (
            <SearchResultItem key={result.id} result={result} query={query} />
          ))}
        </div>
      )}
    </div>
  )
}
