import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const token = url.searchParams.get('token')

  if (!process.env.WOH_AUTO_LOGIN_TOKEN || token !== process.env.WOH_AUTO_LOGIN_TOKEN) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const autoLoginEmail = process.env.WOH_AUTO_LOGIN_EMAIL
  const autoLoginPassword = process.env.WOH_AUTO_LOGIN_PASSWORD

  if (!autoLoginEmail || !autoLoginPassword) {
    return NextResponse.json({ error: 'Auto-login not configured' }, { status: 500 })
  }

  const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
    email: autoLoginEmail,
    password: autoLoginPassword,
  })

  if (signInError || !signInData.session) {
    return NextResponse.json({ error: signInError?.message || 'No session' }, { status: 500 })
  }

  const session = signInData.session
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL!.match(/\/\/([^.]+)/)?.[1] || ''
  const cookieBase = `sb-${projectRef}-auth-token`

  // Build the session payload that @supabase/ssr expects
  const sessionPayload = JSON.stringify({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
    expires_in: session.expires_in,
    token_type: session.token_type,
    user: session.user,
  })

  // @supabase/ssr chunks cookies at 3180 chars
  const CHUNK_SIZE = 3180
  const chunks: string[] = []
  for (let i = 0; i < sessionPayload.length; i += CHUNK_SIZE) {
    chunks.push(sessionPayload.substring(i, i + CHUNK_SIZE))
  }

  const response = NextResponse.redirect(new URL('/', request.url))

  // Set chunked cookies exactly as @supabase/ssr does
  if (chunks.length === 1) {
    response.cookies.set(cookieBase, chunks[0], {
      path: '/',
      sameSite: 'lax',
      httpOnly: false,
      secure: true,
      maxAge: 60 * 60 * 24 * 365, // 1 year - never expire per user request
    })
  } else {
    for (let i = 0; i < chunks.length; i++) {
      response.cookies.set(`${cookieBase}.${i}`, chunks[i], {
        path: '/',
        sameSite: 'lax',
        httpOnly: false,
        secure: true,
        maxAge: 60 * 60 * 24 * 365,
      })
    }
  }

  return response
}
