import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await authenticateRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const productId = parseInt(id);

  try {
    const body = await req.json();
    const { name, sku, barcode, unit, categoryId, minStock, description } = body;

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        sku: sku !== undefined ? sku.trim() : undefined,
        barcode: barcode !== undefined ? barcode.trim() : undefined,
        unit: unit !== undefined ? unit : undefined,
        minStock: minStock !== undefined ? Number(minStock) : undefined,
        description: description !== undefined ? description.trim() : undefined,
        categoryId: categoryId !== undefined ? (categoryId ? parseInt(categoryId) : null) : undefined,
      },
      include: { category: true, batches: true },
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (error: any) {
    console.error('Update product error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await authenticateRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const productId = parseInt(id);

  try {
    await prisma.product.delete({
      where: { id: productId },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete product error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete product' }, { status: 500 });
  }
}
