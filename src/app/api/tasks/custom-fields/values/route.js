import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/server/supabase-admin'
import { getAccessContext } from '@/lib/server/access-control'
import { resolveAuthContext } from '@/lib/server/auth-context'

async function getAuthContext() {
  const ctx = await resolveAuthContext()
  if (ctx.errorResponse) return { error: ctx.errorResponse }
  return { user: ctx.user, accessContext: ctx.accessContext, adminSupabase: ctx.adminSupabase, workspaceId: ctx.accessContext.workspaceId }
}

// GET /api/tasks/custom-fields/values?task_id=xxx
export async function GET(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    const taskId = new URL(request.url).searchParams.get('task_id')
    if (!taskId) return NextResponse.json({ error: 'task_id obrigatório.' }, { status: 400 })

    const { data, error } = await ctx.adminSupabase
      .from('task_custom_field_values')
      .select('*, custom_fields(id, name, field_type, config, icon, color)')
      .eq('task_id', taskId)
      .eq('workspace_id', ctx.workspaceId)

    if (error) throw error
    return NextResponse.json({ values: data || [] })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT /api/tasks/custom-fields/values  { task_id, field_id, value }
export async function PUT(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    const body = await request.json()
    const { task_id, field_id, value } = body
    if (!task_id || !field_id) return NextResponse.json({ error: 'task_id e field_id obrigatórios.' }, { status: 400 })

    // Determine column by field type
    const { data: field } = await ctx.adminSupabase.from('custom_fields').select('field_type').eq('id', field_id).single()
    const fieldType = field?.field_type || 'text'

    const row = {
      task_id,
      field_id,
      workspace_id: ctx.workspaceId,
      updated_at: new Date().toISOString(),
      value_text: null, value_number: null, value_date: null, value_bool: null, value_json: null,
    }

    if (['text', 'textarea', 'url', 'email', 'phone', 'select'].includes(fieldType)) row.value_text = value ?? null
    else if (fieldType === 'multiselect') row.value_json = value ?? null
    else if (['number', 'currency'].includes(fieldType)) row.value_number = value ?? null
    else if (fieldType === 'date') row.value_date = value ?? null
    else if (fieldType === 'checkbox') row.value_bool = value ?? null
    else if (fieldType === 'user') row.value_text = value ?? null
    else row.value_text = value != null ? String(value) : null

    const { data, error } = await ctx.adminSupabase
      .from('task_custom_field_values')
      .upsert(row, { onConflict: 'task_id,field_id' })
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json({ value: data })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/tasks/custom-fields/values?task_id=xxx&field_id=yyy
export async function DELETE(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    const url = new URL(request.url)
    const taskId = url.searchParams.get('task_id')
    const fieldId = url.searchParams.get('field_id')
    if (!taskId || !fieldId) return NextResponse.json({ error: 'task_id e field_id obrigatórios.' }, { status: 400 })

    const { error } = await ctx.adminSupabase
      .from('task_custom_field_values')
      .delete()
      .eq('task_id', taskId)
      .eq('field_id', fieldId)
      .eq('workspace_id', ctx.workspaceId)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
