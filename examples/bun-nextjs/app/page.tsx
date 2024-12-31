import { FileUpload } from '@/components/file-upload'

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
          meta={{
            postId: '123',
          }}
          uploadOnAccept
        />
      </div>
    </main>
  )
}
