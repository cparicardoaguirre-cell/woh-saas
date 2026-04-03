import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()

  // Filter to supabase cookies only
  const sbCookies = allCookies.filter(c => c.name.includes('sb-'))

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {},
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser()

  return NextResponse.json({
    totalCookies: allCookies.length,
    sbCookies: sbCookies.map(c => ({ name: c.name, valueLength: c.value.length, valuePreview: c.value.substring(0, 50) })),
    user: user ? { id: user.id, email: user.email } : null,
    error: error?.message || null,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  })
}
