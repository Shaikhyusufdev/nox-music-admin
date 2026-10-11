import { NextRequest, NextResponse } from 'next/server'
import { putObject } from '@/lib/s3upload'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'file nahi mili' }, { status: 400 })
    if (!file.type.startsWith('image/'))
      return NextResponse.json({ error: 'Sirf image allowed hai' }, { status: 400 })
    if (file.size > 3 * 1024 * 1024)
      return NextResponse.json({ error: 'Image 3MB se badi hai' }, { status: 400 })

    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
    const folder = process.env.S3_FOLDER || 'NOXMUSIC'
    const key = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    const url = await putObject(key, Buffer.from(await file.arrayBuffer()), file.type)
    return NextResponse.json({ url })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Upload fail' }, { status: 500 })
  }
}
