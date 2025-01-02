import Link from 'next/link'
import { redirect } from 'next/navigation'

export default function HomePage() {
  redirect('/docs')

  return (
    <main className="flex flex-1 flex-col justify-center text-center">
      <div className="flex flex-col items-center justify-center mb-4">
        <img src="/logo.svg" alt="Saas.js logo" width={140} />
        <h1 className="mb-4 text-2xl font-bold hidden">Saas.js</h1>
      </div>

      <p className="text-fd-muted-foreground mb-4">
        A collection of full-stack React components for building SaaS products.
      </p>

      <Link href="/docs" className="text-fd-foreground font-semibold underline">
        View Documentation
      </Link>
    </main>
  )
}
