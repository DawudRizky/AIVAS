import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('inventory_record')
    .select(`
      *,
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
    .from('inventory_record')
    .insert([
      {
        item_id: body.item_id,
        quantity: body.quantity,
        reserved_qty: body.reserved_qty || 0,
        location: body.location,
        last_updated: new Date(),
        last_counted_at: new Date()
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
    message: 'Inventory Record berhasil dibuat',
    data
  })
}