import { notFound } from 'next/navigation'
import { validateShareLink } from '@/lib/share-links'
import { EditorContent } from '@/components/editor/EditorContent'
import { SharePasswordForm } from '@/components/access/SharePasswordForm'
import { PageAccess, Page } from '@prisma/client'

type AccessWithPage = PageAccess & { page: Page }

interface SharePageProps {
  params: { token: string }
  searchParams: { password?: string }
}

export default async function SharePage({ params, searchParams }: SharePageProps) {
  const { token } = params
  const { password } = searchParams

  const result = await validateShareLink(token, password)

  if (result === null) {
    notFound()
  }

  if ('requiresPassword' in result && result.requiresPassword) {
    return <SharePasswordForm token={token} />
  }

  const access = result as AccessWithPage

  if (!access.page) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold">{access.page.title}</h1>
      <EditorContent contentHtml={access.page.contentHtml} />
    </div>
  )
}
