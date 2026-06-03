import { S3Client } from "@aws-sdk/client-s3";
import { env } from "./env";

// S3 chỉ khởi tạo nếu có credentials. Nếu không, fallback sang local storage.
const hasAwsCreds =
  Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

export const s3Client = hasAwsCreds
  ? new S3Client({
      region: env.aws.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    })
  : null;

export const S3_BUCKET = env.aws.s3Bucket;
export const S3_ENABLED = hasAwsCreds;
