// app/api/delivery-order/route.ts

import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('delivery_order')
    .select(`
      *,
      vendor (
        id,
        name
      ),
      purchase_order (
        id,
        po_number
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
    .from('delivery_order')
    .insert([
      {
        do_number: body.do_number,
        purchase_order_id: body.purchase_order_id,
        vendor_id: body.vendor_id,
        status: body.status || 'shipped',
        shipped_at: new Date(),
        carrier: body.carrier,
        tracking_number: body.tracking_number
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
    message: 'Delivery Order berhasil dibuat',
    data
  })
}