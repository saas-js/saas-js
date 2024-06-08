import type { ActionFunctionArgs } from '@remix-run/node'
import { Form, useActionData } from '@remix-run/react'

import { FileUpload } from '#components/file-upload'
import { Button } from '#components/ui/button'
import { Input } from '#components/ui/input'
import { css } from '#styled-system/css'
import { Container, Stack } from '#styled-system/jsx'

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

  const postId = 1

  return (
    <Container pt="20">
      <h1
        className={css({
          fontSize: '2xl',
          fontWeight: 'bold',
          textAlign: 'center',
          mb: 8,
        })}
      >
        Remix + Slingshot
      </h1>
      <Form method="post">
        <Stack>
          <Input type="hidden" name="postId" value={postId} />
          <Input type="text" name="title" placeholder="Title" />

          <FileUpload
            profile="avatar"
            maxFiles={1}
            baseUrl="/slingshot"
            uploadOnAccept
            meta={{ postId }}
          />

          <Button type="submit" colorPalette="accent">
            Submit
          </Button>
        </Stack>
      </Form>

      <pre>{JSON.stringify(data, undefined, 2)}</pre>
    </Container>
  )
}
