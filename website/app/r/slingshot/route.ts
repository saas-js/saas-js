import { promises as fs } from 'fs'

export async function GET() {
  const content = await fs.readFile(
    process.cwd() + '/app/r/components/file-upload.txt',
    'utf-8',
  )

  return Response.json({
    name: 'slingshot',
    type: 'registry:ui',
    dependencies: ['@saas-js/slingshot', '@saas-js/slingshot-react'],
    files: [
      {
        path: '/components/ui/file-upload.tsx',
        content,
        type: 'registry:ui',
        target: '',
      },
    ],
  })
}
