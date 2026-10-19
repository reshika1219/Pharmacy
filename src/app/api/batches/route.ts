import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await authenticateRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('productId');

  const batches = await prisma.batch.findMany({
    where: productId ? { productId: parseInt(productId) } : undefined,
    include: {
      product: {
        include: { category: true },
      },
    },
    orderBy: { id: 'desc' },
  });

  return NextResponse.json(batches);
}

export async function POST(req: NextRequest) {
  const session = await authenticateRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      productId,
      batchRef,
      qtyReceived,
      costPrice = 0,
      sellPrice = 0,
      supplier = '',
      notes = '',
    } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const qty = parseInt(qtyReceived) || 0;
    if (qty <= 0) {
      return NextResponse.json({ error: 'Quantity received must be greater than 0' }, { status: 400 });
    }

    const batch = await prisma.batch.create({
      data: {
        productId: parseInt(productId),
        batchRef: batchRef ? batchRef.trim() : `BAT-${Date.now().toString().slice(-6)}`,
        qtyReceived: qty,
        qtyRemaining: qty,
        costPrice: parseFloat(costPrice) || 0,
        sellPrice: parseFloat(sellPrice) || 0,
        supplier: supplier ? supplier.trim() : null,
        notes: notes ? notes.trim() : null,
        dateAdded: new Date().toISOString().split('T')[0],
      },
      include: {
        product: true,
      },
    });

    return NextResponse.json({ success: true, batch });
  } catch (error: any) {
    console.error('Error creating batch:', error);
    return NextResponse.json({ error: error.message || 'Failed to intake stock' }, { status: 500 });
  }
}
