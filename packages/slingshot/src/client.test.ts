import { createSlingshotClient } from "./client";

const client = createSlingshotClient({ profile: "avatar" });

const file = new File([""], "avatar.png");

client.validate(file); // validate and authorize

client.upload(file); // authorize, get url and upload file
