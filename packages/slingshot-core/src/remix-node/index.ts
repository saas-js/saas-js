import type { Hono } from 'hono'

export function handle(app: Hono) {
  return async function action({
    request,
    context,
  }: {
    request: Request
    context: any
  }) {
    try {
      const requestInit: RequestInit = {
        headers: request.headers,
        method: 'POST',
        body: request.body,
      }

      const url = new URL(request.url)

      const pathname = url.pathname.split('/').slice(-1) ?? 'request'

      url.pathname = `/${pathname}`

      const response = await app.fetch(
        new Request(url.toString(), requestInit),
        context,
      )

      const json = await response.json()

      return new Response(JSON.stringify(json), {
        status: response.status,
      })
    } catch (err) {
      console.error(err)

      return new Response(err.message, {
        status: 500,
      })
    }
  }
}
