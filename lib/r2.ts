import { S3Client, PutObjectCommand, DeleteObjectCommand, PutBucketCorsCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Cloudflare R2 è S3-compatibile — usa l'endpoint specifico dell'account
const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID!.trim()
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY!.trim()
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_KEY!.trim()
const bucket = process.env.CLOUDFLARE_R2_BUCKET!.trim()
const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL!.trim() // es. https://pub-xxx.r2.dev

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

export async function ensureCors(): Promise<{ ok: boolean; error?: string }> {
  const origins = [
    process.env.NEXT_PUBLIC_APP_URL,
    'http://localhost:3000',
  ].filter(Boolean) as string[]
  try {
    await r2.send(new PutBucketCorsCommand({
      Bucket: bucket,
      CORSConfiguration: {
        CORSRules: [{
          AllowedOrigins: origins,
          AllowedMethods: ['GET', 'PUT', 'DELETE', 'HEAD'],
          AllowedHeaders: ['*'],
          ExposeHeaders: ['ETag'],
          MaxAgeSeconds: 86400,
        }],
      },
    }))
    console.log('[R2] CORS applicata per origini:', origins)
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[R2] Errore PutBucketCors:', msg)
    return { ok: false, error: msg }
  }
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
