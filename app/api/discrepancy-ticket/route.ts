import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('discrepancy_ticket')
    .select(`
      *,
      inbound_scan (
        id,
        qty_actual,
        status
      ),
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
    .from('discrepancy_ticket')
    .insert([
      {
        inbound_scan_id: body.inbound_scan_id,
        status: 'open',
        created_at: new Date(),
        assigned_to: body.assigned_to,
        notes: body.notes,
        severity: body.severity || 'medium',
        history: 'Ticket created automatically',
        reopen_reason: null
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
    message: 'Discrepancy Ticket berhasil dibuat',
    data
  })
}