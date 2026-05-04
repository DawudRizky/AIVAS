import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('purchase_order_item')
    .select(`
      *,
      purchase_order (
        id,
        po_number
      ),
      item (
        id,
        name,
        sku
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
    .from('purchase_order_item')
    .insert([
      {
        purchase_order_id: body.purchase_order_id,
        item_id: body.item_id,
        quantity_ordered: body.quantity_ordered,
        unit_price: body.unit_price,
        received_qty: 0
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
    message: 'Purchase Order Item berhasil ditambahkan',
    data
  })
}