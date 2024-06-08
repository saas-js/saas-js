import { FileUpload } from '@/components/file-upload'
import { Input } from '@/components/ui/input'

export default function Home() {
  return (
    <main className="min-h-screen justify-between p-8">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          Next.js + Slingshot
        </p>
      </div>

      <div className="py-8">
        <Input name="title" />

        <FileUpload
          profile="cover"
          maxFiles={1}
          baseUrl="/api/slingshot"
          uploadOnAccept
        />
      </div>
    </main>
  )
}
