import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const uploadSchema = z.object({
  file: z.object({
    name: z.string(),
    type: z.string(),
    size: z.number(),
  }),
  meta: z.record(z.string(), z.number()).optional(),
});

export type UploadSchema = z.infer<typeof uploadSchema>;

export interface CreateSlingshotProps {
  profile: string;
  maxSize?: number;
  allowedFileTypes?: string[];
  key?: (ctx: { file: File; meta?: UploadSchema["meta"] }) => string;
  adapter?: () => (app: Hono) => any;
}

export const createSlingshot = (props: CreateSlingshotProps) => {
  const adapter = props?.adapter ? props?.adapter() : (app: Hono) => app;

  const app = new Hono();

  const route = app
    .post("/validate", zValidator("json", uploadSchema), (c) => {
      return c.json({ success: true }, 200);
    })
    .post("/request", zValidator("json", uploadSchema), async (c) => {
      const json = await c.req.json();
      const key = props.key
        ? props.key(json)
        : `${props.profile}/${json.file.name}`;
      return c.json(
        {
          url: `https://s3.amazonaws.com/${key}`,
        },
        200
      );
    });

  return route;
};

export type SlingshotRoutes = ReturnType<typeof createSlingshot>;
