import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const { password } = await req.json()

  if (password === process.env.ADMIN_PASSWORD) {
    const cookieStore = cookies()
    cookieStore.set('admin_auth', 'true', {
      httpOnly: true,
      secure: true,
      maxAge: 60 * 60 * 24, // 24 hours
    })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
}

export async function DELETE() {
  const cookieStore = cookies()
  cookieStore.delete('admin_auth')
  return NextResponse.json({ success: true })
}
