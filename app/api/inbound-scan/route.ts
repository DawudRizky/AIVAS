import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('inbound_scan')
    .select(`
      *,
      qr_code (
        id,
        code
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

  const status =
    body.qty_actual > 0 ? 'received' : 'pending'

  const { data, error } = await supabase
    .from('inbound_scan')
    .insert([
      {
        qr_code_id: body.qr_code_id,
        scanned_at: new Date(),
        scanned_by: body.scanned_by,
        qty_actual: body.qty_actual,
        status: status,
        location: body.location,
        device_id: body.device_id,
        notes: body.notes || null
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
    message: 'Inbound Scan berhasil dibuat',
    data
  })
}