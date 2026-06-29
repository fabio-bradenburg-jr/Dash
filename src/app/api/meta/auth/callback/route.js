import { NextResponse } from 'next/server'
import {
  clearMetaOauthCookie,
  exchangeMetaAuthorizationCode,
  exchangeMetaLongLivedToken,
  getAuthorizedMetaConnectionContext,
  getMetaOauthCookie,
  getMetaProfile,
  getPlatformMetaConnectionContext,
  saveWorkspaceMetaConnection,
} from '@/lib/server/meta-connection'

function buildMetaReturnUrl(request, returnTo) {
  const fallback = new URL('/', request.url)
  fallback.searchParams.set('tab', 'settings')

  if (!returnTo || typeof returnTo !== 'string' || !returnTo.startsWith('/') || returnTo.startsWith('//')) {
    return fallback
  }

  return new URL(returnTo, request.url)
}

export async function GET(request) {
  let redirectUrl = buildMetaReturnUrl(request)

  try {
    const code = request.nextUrl.searchParams.get('code')
    const state = request.nextUrl.searchParams.get('state')
    const oauthCookie = await getMetaOauthCookie()

    if (!code || !state || !oauthCookie?.state || oauthCookie.state !== state) {
      throw new Error('A confirmação da Meta expirou. Tente conectar novamente.')
    }

    let context = null
    try {
      context = await getPlatformMetaConnectionContext({ requireEdit: true })
    } catch {
      context = await getAuthorizedMetaConnectionContext({ requireEdit: true })
    }

    const { adminSupabase, accessContext } = context
    if (!accessContext.canEditIntegrations) {
      throw new Error('Sem permissão para gerenciar a conexão da Meta.')
    }

    if (oauthCookie.workspaceId && oauthCookie.workspaceId !== accessContext.workspaceId) {
      throw new Error('O workspace do retorno da Meta não confere com a sessão atual.')
    }

    const shortLivedToken = await exchangeMetaAuthorizationCode(request, code)
    const longLivedToken = await exchangeMetaLongLivedToken(request, shortLivedToken.access_token)
    const metaProfile = await getMetaProfile(longLivedToken.access_token)

    await saveWorkspaceMetaConnection(adminSupabase, accessContext.workspaceId, {
      metaUserId: metaProfile.id,
      metaUserName: metaProfile.name,
      accessToken: longLivedToken.access_token,
      tokenType: longLivedToken.token_type,
      scope: shortLivedToken.scope || longLivedToken.scope,
      expiryDate: longLivedToken.expires_in
        ? new Date(Date.now() + Number(longLivedToken.expires_in) * 1000).toISOString()
        : null,
    })

    // Targeted update: only set metaConnectionMode in globalIntegrations without
    // touching any other workspace data (clients, operationCards, onboarding, etc.)
    const { data: currentPref } = await adminSupabase
      .from('workspace_preferences')
      .select('payload')
      .eq('workspace_id', accessContext.workspaceId)
      .maybeSingle()

    const currentPayload =
      currentPref?.payload && typeof currentPref.payload === 'object' ? currentPref.payload : {}

    await adminSupabase
      .from('workspace_preferences')
      .upsert(
        {
          workspace_id: accessContext.workspaceId,
          payload: {
            ...currentPayload,
            globalIntegrations: {
              ...(currentPayload.globalIntegrations || {}),
              metaConnectionMode: 'oauth',
            },
          },
        },
        { onConflict: 'workspace_id' }
      )

    redirectUrl = buildMetaReturnUrl(request, oauthCookie.returnTo)
    redirectUrl.searchParams.set('meta_connected', '1')

    const response = NextResponse.redirect(redirectUrl)
    await clearMetaOauthCookie(response)
    return response
  } catch (error) {
    redirectUrl.searchParams.set('meta_error', error.message || 'Não foi possível concluir a conexão com a Meta.')
    const response = NextResponse.redirect(redirectUrl)
    await clearMetaOauthCookie(response)
    return response
  }
}
