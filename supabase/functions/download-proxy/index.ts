const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, range',
  'Access-Control-Expose-Headers': 'content-type, content-length, content-range, accept-ranges, content-disposition',
}

const SUDAGOSPEL_ORIGIN = 'https://sudagospel.net'

const resolveSudagospelTrackUrl = async (rawUrl: string) => {
  const parsedUrl = new URL(rawUrl)

  if (parsedUrl.hostname !== 'sudagospel.net' || !parsedUrl.pathname.includes('get-track.php')) {
    return rawUrl
  }

  const trackId = parsedUrl.searchParams.get('id')
  if (!trackId) {
    throw new Error('Missing track id')
  }

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
    return contentUrlMatch[1]
  }

  const uploadMatch = html.match(/https:\/\/sudagospel\.net\/upload\/audio\/[^\s"'<>]+\.mp3[^\s"'<>]*/i)
  if (uploadMatch?.[0]) {
    return uploadMatch[0]
  }

  throw new Error('Could not resolve playable MP3 URL')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const fileUrl = url.searchParams.get('url')
  const filename = url.searchParams.get('filename')

  if (!fileUrl) {
    return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const resolvedUrl = await resolveSudagospelTrackUrl(fileUrl)
    const rangeHeader = req.headers.get('range')

    const response = await fetch(resolvedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LovableBot/1.0)',
        Referer: `${SUDAGOSPEL_ORIGIN}/`,
        ...(rangeHeader ? { Range: rangeHeader } : {}),
      },
    })

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch file' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const headers = new Headers(corsHeaders)
    headers.set('Content-Type', response.headers.get('content-type') || 'application/octet-stream')

    const passthroughHeaders = ['content-length', 'content-range', 'accept-ranges']
    for (const header of passthroughHeaders) {
      const value = response.headers.get(header)
      if (value) headers.set(header, value)
    }

    if (filename) {
      headers.set('Content-Disposition', `attachment; filename="${filename}"`)
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
