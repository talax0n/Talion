import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6 text-center">
      <h2 className="text-4xl font-bold">404</h2>
      <p className="text-lg text-muted-foreground">
        This page could not be found.
      </p>
      <Link
        href="/"
        className="text-sm underline underline-offset-4 hover:text-primary transition-colors"
      >
        Go back home
      </Link>
    </div>
  )
}
