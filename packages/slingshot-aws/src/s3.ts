import { S3RequestPresigner } from "@aws-sdk/s3-request-presigner";
import { Hash } from "@smithy/hash-node";
import { HttpRequest } from "@smithy/protocol-http";
import { parseUrl } from "@smithy/url-parser";
import { formatUrl } from "@aws-sdk/util-format-url";

interface CreateSignedUrlArgs {
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
  };
  bucket: string;
  region: string;
  key: string;
}

export const createSignedUrl = async ({
  credentials,
  bucket,
  region,
  key,
}: CreateSignedUrlArgs) => {
  const url = parseUrl(`https://${bucket}.s3.${region}.amazonaws.com/${key}`);
  const presigner = new S3RequestPresigner({
    credentials,
    region,
    sha256: Hash.bind(null, "sha256"),
  });

  const signedUrlObject = await presigner.presign(
    new HttpRequest({ ...url, method: "PUT" })
  );

  return formatUrl(signedUrlObject);
};

export interface SlingshotS3Args {
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
  };
  bucket: string;
  region: string;
}

export const S3Adapter = ({ credentials, bucket, region }: SlingshotS3Args) => {
  return {
    createSignedUrl: (key: string) =>
      createSignedUrl({ credentials, bucket, region, key }),
  };
};
