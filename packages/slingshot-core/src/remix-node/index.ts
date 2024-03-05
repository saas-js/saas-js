import type { Hono } from "hono";

export function handle(app: Hono) {
  return async function action({
    request,
    context,
  }: {
    request: Request;
    context: any;
  }) {
    const requestInit: RequestInit = {
      headers: request.headers,
      method: "POST",
      body: request.body,
    };

    const url = new URL(request.url);

    url.pathname = "/request"; // @todo parse the url

    const response = await app.fetch(
      new Request(url.toString(), requestInit),
      context
    );

    const json = await response.json();

    return json;
  };
}
