// app/api/item/route.ts

import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('item')
    .select('*')

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
    .from('item')
    .insert([
      {
        sku: body.sku,
        name: body.name,
        unit: body.unit,
        description: body.description,
        unit_price: body.unit_price,
        weight: body.weight,
        dimensions: body.dimensions,
        category: body.category
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
    message: 'Item berhasil dibuat',
    data
  })
}