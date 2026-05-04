import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export async function GET() {
  const { data, error } = await supabase
    .from('qr_code')
    .select(`
      *,
      item (
        id,
        name,
        sku
      ),
      purchase_order (
        id,
        po_number
      ),
      delivery_order (
        id,
        do_number
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

  const generatedCode = `QR-${uuidv4()}`

  const { data, error } = await supabase
    .from('qr_code')
    .insert([
      {
        code: generatedCode,
        generated_at: new Date(),
        status: 'generated',
        printed_by: body.printed_by,
        item_id: body.item_id,
        purchase_order_id: body.purchase_order_id,
        delivery_order_id: body.delivery_order_id
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
    message: 'QR Code berhasil dibuat',
    data
  })
}