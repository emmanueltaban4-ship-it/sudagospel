import { createClient } from 'npm:@supabase/supabase-js@2.57.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, range',
  'Access-Control-Expose-Headers': 'content-type, content-length, content-range, accept-ranges, content-disposition',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

// Strict allowlist for proxy targets — prevents SSRF.
const ALLOWED_HOSTS = new Set(['sudagospel.net', 'www.sudagospel.net', 'sudagospel.com', 'www.sudagospel.com'])
const isAllowedHost = (hostname: string) =>
  ALLOWED_HOSTS.has(hostname) || [...ALLOWED_HOSTS].some((h) => hostname.endsWith('.' + h))

// Strip CR/LF and quotes to prevent header injection.
const sanitizeFilename = (name: string) =>
  name.replace(/[\r\n"\\]/g, '').replace(/[^\x20-\x7E]/g, '_').slice(0, 200)


const SUDAGOSPEL_ORIGIN = 'https://sudagospel.net'

// In-memory URL resolution cache (TTL: 30 minutes)
const urlCache = new Map<string, { url: string; expiry: number }>()
const CACHE_TTL = 30 * 60 * 1000

const getCachedUrl = (key: string): string | null => {
  const entry = urlCache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiry) {
    urlCache.delete(key)
    return null
  }
  return entry.url
}

const setCachedUrl = (key: string, url: string) => {
  // Evict oldest entries if cache grows too large
  if (urlCache.size > 500) {
    const oldest = urlCache.keys().next().value
    if (oldest) urlCache.delete(oldest)
  }
  urlCache.set(key, { url, expiry: Date.now() + CACHE_TTL })
}

const resolveSudagospelTrackUrl = async (rawUrl: string) => {
  const parsedUrl = new URL(rawUrl)

  if (parsedUrl.hostname !== 'sudagospel.net' || !parsedUrl.pathname.includes('get-track.php')) {
    return rawUrl
  }

  const trackId = parsedUrl.searchParams.get('id')
  if (!trackId) throw new Error('Missing track id')

  // Check cache first
  const cached = getCachedUrl(trackId)
  if (cached) return cached

  const trackPageResponse = await fetch(`${SUDAGOSPEL_ORIGIN}/track/${trackId}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; LovableBot/1.0)',
      Referer: `${SUDAGOSPEL_ORIGIN}/`,
    },
  })

  if (!trackPageResponse.ok) {
    throw new Error(`Failed to load track page: ${trackPageResponse.status}`)
  }

  const html = await trackPageResponse.text()
  const contentUrlMatch = html.match(/"contentUrl"\s*:\s*"([^"]+\.mp3[^"]*)"/i)
  if (contentUrlMatch?.[1]) {
    setCachedUrl(trackId, contentUrlMatch[1])
    return contentUrlMatch[1]
  }

  const uploadMatch = html.match(/https:\/\/sudagospel\.net\/upload\/audio\/[^\s"'<>]+\.mp3[^\s"'<>]*/i)
  if (uploadMatch?.[0]) {
    setCachedUrl(trackId, uploadMatch[0])
    return uploadMatch[0]
  }

  throw new Error('Could not resolve playable MP3 URL')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // No Bearer JWT required: this endpoint is consumed by <audio> elements which
  // cannot send Authorization headers. SSRF and header injection are mitigated
  // by the strict allowlist + filename sanitization below.

  const url = new URL(req.url)
  const fileUrl = url.searchParams.get('url')
  const rawFilename = url.searchParams.get('filename')

  if (!fileUrl) {
    return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Validate the requested URL — http(s) only, allowlisted hosts only.
  let parsedRequested: URL
  try {
    parsedRequested = new URL(fileUrl)
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid url' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  if (!['http:', 'https:'].includes(parsedRequested.protocol) || !isAllowedHost(parsedRequested.hostname)) {
    return new Response(JSON.stringify({ error: 'Disallowed host' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const resolvedUrl = await resolveSudagospelTrackUrl(fileUrl)
    // Re-validate after resolution in case rewrite returned an unexpected host.
    const parsedResolved = new URL(resolvedUrl)
    if (!['http:', 'https:'].includes(parsedResolved.protocol) || !isAllowedHost(parsedResolved.hostname)) {
      return new Response(JSON.stringify({ error: 'Disallowed resolved host' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const rangeHeader = req.headers.get('range')

    const response = await fetch(resolvedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LovableBot/1.0)',
        Referer: `${SUDAGOSPEL_ORIGIN}/`,
        ...(rangeHeader ? { Range: rangeHeader } : {}),
      },
      redirect: 'manual',
    })

    if (!response.ok && response.status !== 206) {
      return new Response(JSON.stringify({ error: 'Failed to fetch file' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const headers = new Headers(corsHeaders)
    headers.set('Content-Type', response.headers.get('content-type') || 'audio/mpeg')
    headers.set('Accept-Ranges', 'bytes')
    headers.set('Cache-Control', 'public, max-age=2592000, s-maxage=2592000, immutable, stale-while-revalidate=86400')
    headers.set('Vary', 'Range')
    headers.set('X-Content-Type-Options', 'nosniff')

    const passthroughHeaders = ['content-length', 'content-range', 'etag', 'last-modified']
    for (const header of passthroughHeaders) {
      const value = response.headers.get(header)
      if (value) headers.set(header, value)
    }

    if (rawFilename) {
      const safe = sanitizeFilename(rawFilename)
      if (safe) headers.set('Content-Disposition', `attachment; filename="${safe}"`)
    }

    return new Response(response.body, {
      status: response.status,
      headers,
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
