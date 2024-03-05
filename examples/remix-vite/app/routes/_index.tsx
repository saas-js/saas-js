import type { MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { createSlingshotClient } from "@saas-js/slingshot/client";

const slingshot = createSlingshotClient({
  profile: "avatar",
  baseUrl: "/slingshot",
});

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export async function clientLoader() {
  const response = await slingshot.request(new File([""], "blyat.png"));

  return response ?? {};
}

export default function Index() {
  const data = useLoaderData<typeof clientLoader>();
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <pre>{JSON.stringify(data, undefined, 2)}</pre>
    </div>
  );
}
