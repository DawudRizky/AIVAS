// app/api/geo-tag/route.ts

import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('geo_tag')
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
    .from('geo_tag')
    .insert([
      {
        inbound_scan_id: body.inbound_scan_id,
        latitude: body.latitude,
        longitude: body.longitude,
        timestamp: new Date(),
        accuracy: body.accuracy
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
    message: 'Geo Tag berhasil dibuat',
    data
  })
}