import crypto from 'crypto'

const sha256hex = (d: crypto.BinaryLike) =>
  crypto.createHash('sha256').update(d).digest('hex')
const hmac = (key: crypto.BinaryLike, d: string) =>
  crypto.createHmac('sha256', key).update(d).digest()

export async function putObject(key: string, body: Buffer, contentType: string) {
  const endpoint = process.env.S3_ENDPOINT!
  const region = process.env.S3_REGION!
  const bucket = process.env.S3_BUCKET!
  const accessKey = process.env.S3_ACCESS_KEY!
  const secretKey = process.env.S3_SECRET_KEY!
  if (!endpoint || !region || !bucket || !accessKey || !secretKey) {
    throw new Error('S3 env variables set nahi hain')
  }

  const encodedKey = key.split('/').map(encodeURIComponent).join('/')
  const path = `/${bucket}/${encodedKey}`
  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '')
  const dateStamp = amzDate.slice(0, 8)
  const payloadHash = sha256hex(body)

  const headers: Record<string, string> = {
    'content-type': contentType,
    host: endpoint,
    'x-amz-acl': 'public-read',
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
  }
  const names = Object.keys(headers).sort()
  const signedHeaders = names.join(';')
  const canonicalHeaders = names.map((k) => `${k}:${headers[k]}\n`).join('')
  const canonicalRequest = ['PUT', path, '', canonicalHeaders, signedHeaders, payloadHash].join('\n')

  const scope = `${dateStamp}/${region}/s3/aws4_request`
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha256hex(canonicalRequest)].join('\n')
  const kSigning = hmac(hmac(hmac(hmac('AWS4' + secretKey, dateStamp), region), 's3'), 'aws4_request')
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex')

  const sendHeaders: Record<string, string> = { ...headers }
  delete sendHeaders.host
  sendHeaders.Authorization = `AWS4-HMAC-SHA256 Credential=${accessKey}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  const res = await fetch(`https://${endpoint}${path}`, {
    method: 'PUT',
    headers: sendHeaders,
    body: new Uint8Array(body),
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`AceCloud ${res.status}: ${txt.slice(0, 200)}`)
  }

  const base = process.env.S3_PUBLIC_BASE || `https://${endpoint}/${bucket}`
  return `${base}/${encodedKey}`
}
