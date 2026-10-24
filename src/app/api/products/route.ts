import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await authenticateRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.toLowerCase();
  const categoryId = searchParams.get('categoryId');
  const lowStockOnly = searchParams.get('lowStock') === 'true';

  const whereClause: any = {};

  if (categoryId && categoryId !== 'all') {
    whereClause.categoryId = parseInt(categoryId);
  }

  if (search) {
    whereClause.OR = [
      { name: { contains: search } },
      { sku: { contains: search } },
      { barcode: { contains: search } },
      { description: { contains: search } },
    ];
  }

  const products = await prisma.product.findMany({
    where: whereClause,
    include: {
      category: true,
      batches: {
        orderBy: { id: 'desc' },
      },
    },
    orderBy: { name: 'asc' },
  });

  const formatted = products.map((p) => {
    const totalStock = p.batches.reduce((sum, b) => sum + b.qtyRemaining, 0);
    const latestBatch = p.batches[0];
    const sellPrice = latestBatch?.sellPrice ?? 0;
    const costPrice = latestBatch?.costPrice ?? 0;

    let stockStatus: 'out_of_stock' | 'low_stock' | 'in_stock' = 'in_stock';
    if (totalStock === 0) stockStatus = 'out_of_stock';
    else if (totalStock <= p.minStock) stockStatus = 'low_stock';

    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      barcode: p.barcode,
      unit: p.unit,
      description: p.description,
      minStock: p.minStock,
      trackInventory: p.trackInventory,
      category: p.category,
      categoryId: p.categoryId,
      totalStock,
      sellPrice,
      costPrice,
      stockStatus,
      batchesCount: p.batches.length,
      batches: p.batches,
    };
  });

  if (lowStockOnly) {
    return NextResponse.json(formatted.filter((p) => p.stockStatus !== 'in_stock'));
  }

  return NextResponse.json(formatted);
}

export async function POST(req: NextRequest) {
  const session = await authenticateRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      name,
      sku,
      barcode,
      unit = 'pcs',
      categoryId,
      minStock = 0,
      description,
      initialQty = 0,
      costPrice = 0,
      sellPrice = 0,
      supplier = '',
      batchRef = '',
    } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        sku: sku ? sku.trim() : `SKU-${Date.now().toString().slice(-6)}`,
        barcode: barcode ? barcode.trim() : null,
        unit,
        minStock: Number(minStock) || 0,
        description: description ? description.trim() : null,
        categoryId: categoryId ? parseInt(categoryId) : null,
      },
    });

    if (Number(initialQty) > 0 || Number(sellPrice) > 0) {
      await prisma.batch.create({
        data: {
          productId: product.id,
          batchRef: batchRef ? batchRef.trim() : `BAT-${Date.now().toString().slice(-5)}`,
          qtyReceived: Number(initialQty) || 0,
          qtyRemaining: Number(initialQty) || 0,
          costPrice: Number(costPrice) || 0,
          sellPrice: Number(sellPrice) || 0,
          supplier: supplier ? supplier.trim() : null,
          dateAdded: new Date().toISOString().split('T')[0],
        },
      });
    }

    const created = await prisma.product.findUnique({
      where: { id: product.id },
      include: { category: true, batches: true },
    });

    return NextResponse.json({ success: true, product: created });
  } catch (err: any) {
    console.error('Error creating product:', err);
    return NextResponse.json({ error: err.message || 'Failed to create product' }, { status: 500 });
  }
}
