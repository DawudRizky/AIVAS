// app/api/photo-evidence/route.ts

import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('photo_evidence')
    .select(`
      *,
      inbound_scan (
        id,
        qty_actual,
        status
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
    .from('photo_evidence')
    .insert([
      {
        inbound_scan_id: body.inbound_scan_id,
        url: body.url,
        timestamp: new Date(),
        mime_type: body.mime_type,
        thumbnail_url: body.thumbnail_url
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
    message: 'Photo Evidence berhasil dibuat',
    data
  })
}