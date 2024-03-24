import type { ActionFunctionArgs } from '@remix-run/node'
import { ClientActionFunctionArgs, Form, useActionData } from '@remix-run/react'

import { createSlingshotClient } from '@saas-js/slingshot/client'

import { FileUpload } from '#components/file-upload'
import { Button } from '#components/ui/button'
import { Container } from '#styled-system/jsx'

const slingshot = createSlingshotClient({
  profile: 'avatar',
  baseUrl: '/slingshot',
})

export async function clientAction({
  request,
  serverAction,
}: ClientActionFunctionArgs) {
  const data = await request.formData()
  const file = data.get('file')
  const postId = data.get('postId') as string

  if (file) {
    const { url } = await slingshot.upload(file as File, {
      postId,
    })

    console.log(url)

    const formData = new FormData()

    formData.append('postId', postId)
    formData.append('avatar', url)

    // const mutatedRequest = new Request(request.url, {
    //   ...request,
    //   body: formData,
    // });
  }

  return null
}

export async function action({ request }: ActionFunctionArgs) {
  const data = await request.formData()

  return {
    id: data.get('postId'),
    title: data.get('title'),
    avatar: data.get('avatar'),
  }
}

export default function Index() {
  const data = useActionData<typeof action>()

  return (
    <Container pt="20">
      <Form method="post" encType="multipart/form-data">
        <FileUpload
          profile="avatar"
          baseUrl="/slingshot"
          maxFiles={1}
          meta={{ postId: 1 }}
        />

        {/* <Button type="submit" colorPalette="accent">
          Submit
        </Button> */}
      </Form>

      <pre>{JSON.stringify(data, undefined, 2)}</pre>
    </Container>
  )
}
