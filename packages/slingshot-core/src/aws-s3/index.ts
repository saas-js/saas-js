export const createSignedUrl = async ({ region, bucket, key }) => {
  // const url = parseUrl(`https://${bucket}.s3.${region}.amazonaws.com/${key}`);
  // const presigner = new S3RequestPresigner({
  //   credentials: fromIni(),
  //   region,
  //   sha256: Hash.bind(null, "sha256"),
  // });

  // const signedUrlObject = await presigner.presign(
  //   new HttpRequest({ ...url, method: "PUT" }),
  // );
  // return formatUrl(signedUrlObject);

  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
};

export default ({ region, bucket }) => {
  return {
    createSignedUrl: (key) => createSignedUrl({ region, bucket, key }),
  };
};
