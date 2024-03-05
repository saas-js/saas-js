import { hc } from "hono/client";
import type { SlingshotRoutes, UploadSchema } from "./";

interface CreateSlingshotClientProps {
  profile: string;
  baseUrl?: string;
}

export const createSlingshotClient = (props: CreateSlingshotClientProps) => {
  const { profile, baseUrl = "http://localhost:3000" } = props;
  const slingshot = hc<SlingshotRoutes>(`${baseUrl}/${profile}`);

  return {
    validate: async (file: File, meta?: UploadSchema["meta"]) => {
      return slingshot.validate.$post({
        json: {
          file: {
            name: file.name,
            type: file.type,
            size: file.size,
          },
          meta,
        },
      });
    },
    request: async (file: File, meta?: UploadSchema["meta"]) => {
      return slingshot.request.$post({
        json: {
          file: {
            name: file.name,
            type: file.type,
            size: file.size,
          },
          meta,
        },
      });
    },
    upload: async (file: File, meta?: UploadSchema["meta"]) => {
      const formData = new FormData();
      formData.append("file", file);
      const { url } = await slingshot.request.$post({
        json: {
          file: {
            name: file.name,
            type: file.type,
            size: file.size,
          },
          meta,
        },
      });

      const response = await fetch(url, {
        method: "PUT",
        body: file,
      });
    },
  };
};
