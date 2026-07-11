import { NextResponse } from 'next/server'
import { resolveAuthContext } from '@/lib/server/auth-context'

export async function DELETE(_request, context) {
  try {
    const ctx = await resolveAuthContext()
    if (ctx.errorResponse) return ctx.errorResponse
    if (!ctx.accessContext.canManageUsers || !ctx.accessContext.workspaceId) {
      return NextResponse.json({ error: 'Sem permissão para remover predefinições.' }, { status: 403 })
    }

    const { adminSupabase, accessContext } = ctx
    const { presetId } = await context.params

    const { error } = await adminSupabase
      .from('workspace_permission_presets')
      .delete()
      .eq('workspace_id', accessContext.workspaceId)
      .eq('id', presetId)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Preset DELETE error:', error)
    return NextResponse.json({ error: error.message || 'Não foi possível remover a predefinição.' }, { status: 500 })
  }
}
