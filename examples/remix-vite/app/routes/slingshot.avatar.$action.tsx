import { createSlingshot } from "@saas-js/slingshot";
import { handle } from "@saas-js/slingshot/remix-node";

const slingshot = createSlingshot({
  profile: "avatar",
  maxSize: 1024,
  allowedFileTypes: ["image/png", "image/jpeg"],
  key: ({ file }) => `avatar/${file.name}`,
});

export const action = handle(slingshot);
