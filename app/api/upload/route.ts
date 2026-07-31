import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const artist = formData.get('artist') as string
    const duration = formData.get('duration') as string
    const bucketId = formData.get('bucket_id') as string
    const isTrending = formData.get('is_trending') === 'true'

    if (!file || !bucketId) {
      return NextResponse.json({ error: 'Missing file or bucket' }, { status: 400 })
    }

    // Get bucket credentials from Supabase
    const { data: bucket } = await supabaseAdmin
      .from('buckets')
      .select('*')
      .eq('id', bucketId)
      .single()

    if (!bucket) {
      return NextResponse.json({ error: 'Bucket not found' }, { status: 404 })
    }

    // Upload to Backblaze B2 using S3-compatible API
    const fileKey = `songs/${Date.now()}-${file.name.replace(/\s+/g, '-')}`
    const fileBuffer = await file.arrayBuffer()
    const fileSizeMB = file.size / (1024 * 1024)

    // B2 S3-compatible upload
    const uploadUrl = `https://${bucket.endpoint}/${bucket.bucket_id}/${fileKey}`

    const authString = Buffer.from(`${bucket.key_id}:${bucket.app_key}`).toString('base64')

    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(file.size),
      },
      body: fileBuffer,
    })

    if (!uploadRes.ok) {
      const errText = await uploadRes.text()
      return NextResponse.json({ error: `Upload failed: ${errText}` }, { status: 500 })
    }

    const audioUrl = `https://${bucket.endpoint}/${bucket.bucket_id}/${fileKey}`

    // Save to Supabase
    await supabaseAdmin.from('songs').insert([{
      title,
      artist,
      duration,
      bucket_id: parseInt(bucketId),
      file_key: fileKey,
      audio_url: audioUrl,
      is_trending: isTrending,
      plays: 0,
    }])

    // Update bucket used size
    await supabaseAdmin
      .from('buckets')
      .update({ used_size_gb: bucket.used_size_gb + (fileSizeMB / 1024) })
      .eq('id', bucketId)

    return NextResponse.json({ success: true, url: audioUrl })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export const config = {
  api: { bodyParser: false },
}
