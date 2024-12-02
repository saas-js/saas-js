import { FileUpload } from '@/components/file-upload'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function Home() {
  return (
    <main className="min-h-screen justify-between p-8">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <h1 className="font-medium text-2xl">Next.js + Slingshot</h1>
      </div>

      <div className="py-8">
        <FileUpload
          profile="cover"
          maxFiles={1}
          baseUrl="/api/slingshot"
          // uploadOnAccept
        />
      </div>
    </main>
  )
}
