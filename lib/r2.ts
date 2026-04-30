import { S3Client, PutObjectCommand, DeleteObjectCommand, PutBucketCorsCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Cloudflare R2 è S3-compatibile — usa l'endpoint specifico dell'account
const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID!
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY!
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_KEY!
const bucket = process.env.CLOUDFLARE_R2_BUCKET!
const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL! // es. https://pub-xxx.r2.dev

export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
})

export async function uploadToR2(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  await r2.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  }))
  return `${publicUrl}/${key}`
}

// Applica CORS al bucket una volta sola per cold-start
let corsApplied = false
export async function ensureCors(): Promise<void> {
  if (corsApplied) return
  corsApplied = true
  const origins = [
    process.env.NEXT_PUBLIC_APP_URL,
    'http://localhost:3000',
  ].filter(Boolean) as string[]
  await r2.send(new PutBucketCorsCommand({
    Bucket: bucket,
    CORSConfiguration: {
      CORSRules: [{
        AllowedOrigins: origins,
        AllowedMethods: ['GET', 'PUT', 'DELETE', 'HEAD'],
        AllowedHeaders: ['*'],
        ExposeHeaders: ['ETag'],
        MaxAgeSeconds: 3600,
      }],
    },
  }))
}

export async function getPresignedUploadUrl(
  key: string,
  expiresIn = 300, // 5 minuti
): Promise<{ uploadUrl: string; publicUrl: string }> {
  // Non includiamo ContentType nella firma — così Safari/iOS può inviare
  // qualsiasi Content-Type senza invalidare la signature
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
  })
  const uploadUrl = await getSignedUrl(r2, command, { expiresIn })
  return { uploadUrl, publicUrl: `${publicUrl}/${key}` }
}

export async function deleteFromR2(key: string): Promise<void> {
  await r2.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
}
