import { NextResponse } from 'next/server'
import { fetchMetaJson, normalizeMetaError } from '@/lib/server/meta-fetch'
import { resolveWorkspaceMetaAccessToken } from '@/lib/server/meta-connection'
import { createAdminClient } from '@/lib/server/supabase-admin'

function normalizeClientKey(value) {
  return String(value || 'unassigned').replace(/^act_/, '') || 'unassigned'
}

async function readSavedCreative(clientKey, adId) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('meta_creative_cache')
    .select('payload, fetched_at')
    .eq('client_key', clientKey)
    .eq('ad_id', adId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  return { ...data.payload, _fetchedAt: data.fetched_at }
}

async function saveCreativeThumbnail(clientKey, adId, savedCreative, imageUrl) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('meta_creative_cache')
    .upsert({
      client_key: clientKey,
      ad_id: adId,
      payload: {
        ...savedCreative,
        adId,
        imageUrl,
      },
      fetched_at: new Date().toISOString(),
    })

  if (error) throw error
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const adId = searchParams.get('ad_id')
    const clientKey = normalizeClientKey(searchParams.get('ad_account_id'))
    const token = await resolveWorkspaceMetaAccessToken(request)

    if (!token || !adId) {
      return NextResponse.json({ error: 'Informe um criativo válido.' }, { status: 400 })
    }

    let imageUrl = null

    const savedCreative = await readSavedCreative(clientKey, adId)
    // Use cache if it's fresh (< 6 hours) — Facebook CDN URLs expire around that window
    const cacheAgeMs = savedCreative?._fetchedAt
      ? Date.now() - new Date(savedCreative._fetchedAt).getTime()
      : Infinity
    if (savedCreative?.imageUrl && cacheAgeMs < 6 * 60 * 60 * 1000) {
      imageUrl = savedCreative.imageUrl
    }

    if (!imageUrl) {
      const params = new URLSearchParams({
        fields: 'creative{thumbnail_url,image_url}',
        access_token: token,
      })
      const adData = await fetchMetaJson(
        `https://graph.facebook.com/v19.0/${adId}?${params.toString()}`,
        'A Meta demorou para responder ao carregar a imagem desse criativo.',
        { cacheContext: { clientKey, resourceKind: 'creative_thumbnail' } }
      )
      const creative = adData?.creative || {}
      imageUrl = creative.image_url || creative.thumbnail_url || ''

      if (!imageUrl) {
        return new NextResponse(null, { status: 404 })
      }

      await saveCreativeThumbnail(clientKey, adId, savedCreative, imageUrl)
    }

    // Redirect browser directly to the Facebook CDN URL — avoids server-side binary proxy
    return NextResponse.redirect(imageUrl, {
      headers: { 'Cache-Control': 'public, max-age=3600' },
    })
  } catch (error) {
    console.error('Meta creative thumbnail error:', error)
    return NextResponse.json(
      { error: normalizeMetaError(error, 'Não foi possível carregar a imagem desse criativo.') },
      { status: 500 }
    )
  }
}
