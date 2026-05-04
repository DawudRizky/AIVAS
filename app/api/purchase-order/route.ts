import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('purchase_order')
    .select(`
      *,
      vendor (
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
    .from('purchase_order')
    .insert([
      {
        po_number: body.po_number,
        date: new Date(),
        status: 'submitted',
        created_by: body.created_by,
        vendor_id: body.vendor_id,
        received_by: body.received_by || null,
        total_amount: body.total_amount,
        currency: 'IDR'
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
    message: 'Purchase Order berhasil dibuat',
    data
  })
}