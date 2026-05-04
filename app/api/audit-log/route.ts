import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('audit_log')
    .select(`
      *,
      users (
        id,
        name
      )
    `)

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const body = await req.json()

  const { data, error } = await supabase
    .from('audit_log')
    .insert([
      {
        entity_type: body.entity_type,
        entity_id: body.entity_id,
        action: body.action,
        details: body.details,
        performed_by: body.performed_by,
        ip_address: body.ip_address || '127.0.0.1',
        timestamp: new Date()
      }
    ])
    .select()

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({
    message: 'Audit Log berhasil dibuat',
    data
  })
}