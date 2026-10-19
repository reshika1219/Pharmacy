import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await authenticateRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search');
  const date = searchParams.get('date');
  const limit = parseInt(searchParams.get('limit') || '50');

  const whereClause: any = {};
  if (date) whereClause.date = date;
  if (search) {
    whereClause.OR = [
      { orderNumber: { contains: search } },
      { cashier: { contains: search } },
      { customer: { name: { contains: search } } },
    ];
  }

  const orders = await prisma.order.findMany({
    where: whereClause,
    include: {
      customer: true,
      items: {
        include: {
          product: {
            include: { category: true },
          },
          batch: true,
        },
      },
    },
    orderBy: { id: 'desc' },
    take: limit,
  });

  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  const session = await authenticateRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      customerId,
      paymentMethod = 'Cash',
      items, // array of { productId, qty, unitPrice, discountPct, batchId }
      discountAmount = 0,
      taxAmount = 0,
      amountTendered = 0,
      notes = '',
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Order must contain at least one item' }, { status: 400 });
    }

    // Generate next Order Number
    const count = await prisma.order.count();
    const orderNumber = `ORD-${new Date().getFullYear()}-${(count + 1001).toString()}`;
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);

    let subtotal = 0;
    const orderItemsData: any[] = [];

    // Calculate subtotal & prepare item records
    for (const item of items) {
      const qty = parseInt(item.qty) || 1;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      const discountPct = parseFloat(item.discountPct) || 0;
      const lineTotal = qty * unitPrice * (1 - discountPct / 100);

      subtotal += lineTotal;

      orderItemsData.push({
        productId: parseInt(item.productId),
        batchId: item.batchId ? parseInt(item.batchId) : null,
        qty,
        unitPrice,
        discountPct,
        lineTotal,
      });

      // Deduct stock from batch
      if (item.batchId) {
        await prisma.batch.update({
          where: { id: parseInt(item.batchId) },
          data: {
            qtyRemaining: { decrement: qty },
          },
        });
      } else {
        // FIFO deduction from oldest batches with remaining stock
        const batches = await prisma.batch.findMany({
          where: { productId: parseInt(item.productId), qtyRemaining: { gt: 0 } },
          orderBy: { id: 'asc' },
        });

        let remainingToDeduct = qty;
        for (const b of batches) {
          if (remainingToDeduct <= 0) break;
          const deductFromThis = Math.min(b.qtyRemaining, remainingToDeduct);
          await prisma.batch.update({
            where: { id: b.id },
            data: { qtyRemaining: { decrement: deductFromThis } },
          });
          remainingToDeduct -= deductFromThis;
        }
      }
    }

    const total = Math.max(0, subtotal - parseFloat(discountAmount) + parseFloat(taxAmount));
    const changeDue = Math.max(0, (parseFloat(amountTendered) || total) - total);

    const newOrder = await prisma.order.create({
      data: {
        orderNumber,
        date: dateStr,
        time: timeStr,
        cashier: session.fullName || session.username,
        customerId: customerId ? parseInt(customerId) : null,
        paymentMethod,
        subtotal,
        discountAmount: parseFloat(discountAmount) || 0,
        taxAmount: parseFloat(taxAmount) || 0,
        total,
        amountTendered: parseFloat(amountTendered) || total,
        changeDue,
        status: 'completed',
        notes: notes ? notes.trim() : null,
        items: {
          create: orderItemsData,
        },
      },
      include: {
        customer: true,
        items: {
          include: { product: true },
        },
      },
    });

    // Update customer loyalty points and total spent if linked
    if (customerId) {
      await prisma.customer.update({
        where: { id: parseInt(customerId) },
        data: {
          totalSpent: { increment: total },
          loyaltyPoints: { increment: Math.floor(total) },
        },
      });
    }

    return NextResponse.json({ success: true, order: newOrder });
  } catch (error: any) {
    console.error('Error processing order:', error);
    return NextResponse.json({ error: error.message || 'Failed to complete transaction' }, { status: 500 });
  }
}
