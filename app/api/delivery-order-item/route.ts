import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('delivery_order_item')
    .select(`
      *,
      delivery_order (
        id,
        do_number
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
    .from('delivery_order_item')
    .insert([
      {
        delivery_order_id: body.delivery_order_id,
        item_id: body.item_id,
        quantity: body.quantity
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
    message: 'Delivery Order Item berhasil ditambahkan',
    data
  })
}