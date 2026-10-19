import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await authenticateRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Orders today & all time
  const ordersToday = await prisma.order.findMany({
    where: { date: todayStr },
    include: { items: true },
  });

  const totalSalesToday = ordersToday.reduce((sum, o) => sum + o.total, 0);
  const itemsSoldToday = ordersToday.reduce((sum, o) => sum + o.items.reduce((s, it) => s + it.qty, 0), 0);

  const allOrders = await prisma.order.findMany({
    orderBy: { id: 'desc' },
    take: 10,
    include: {
      customer: true,
      items: { include: { product: true } },
    },
  });

  const allOrdersCount = await prisma.order.count();
  const allOrdersTotalAgg = await prisma.order.aggregate({
    _sum: { total: true },
  });
  const totalRevenueAllTime = allOrdersTotalAgg._sum.total || 0;

  // 2. Expenses today
  const expensesTodayAgg = await prisma.expense.aggregate({
    where: { date: todayStr },
    _sum: { amount: true },
  });
  const expensesToday = expensesTodayAgg._sum.amount || 0;

  // 3. Products & Stock Analytics
  const products = await prisma.product.findMany({
    include: {
      category: true,
      batches: true,
    },
  });

  let lowStockCount = 0;
  let outOfStockCount = 0;
  let totalInventoryUnits = 0;
  let totalInventoryValue = 0;

  const lowStockItems = [];

  for (const p of products) {
    const currentStock = p.batches.reduce((sum, b) => sum + b.qtyRemaining, 0);
    const avgSellPrice = p.batches.length > 0
      ? p.batches[0].sellPrice
      : 0;

    totalInventoryUnits += currentStock;
    totalInventoryValue += currentStock * avgSellPrice;

    if (currentStock === 0) {
      outOfStockCount++;
      lowStockItems.push({
        id: p.id,
        name: p.name,
        sku: p.sku,
        stock: currentStock,
        minStock: p.minStock,
        category: p.category?.name || 'Unassigned',
        status: 'Out of Stock',
      });
    } else if (currentStock <= p.minStock) {
      lowStockCount++;
      lowStockItems.push({
        id: p.id,
        name: p.name,
        sku: p.sku,
        stock: currentStock,
        minStock: p.minStock,
        category: p.category?.name || 'Unassigned',
        status: 'Low Stock',
      });
    }
  }

  // 4. Customers count
  const totalCustomers = await prisma.customer.count();

  return NextResponse.json({
    kpis: {
      salesToday: totalSalesToday,
      ordersTodayCount: ordersToday.length,
      itemsSoldToday,
      expensesToday,
      netProfitToday: totalSalesToday - expensesToday,
      totalRevenueAllTime,
      allOrdersCount,
      totalProducts: products.length,
      totalInventoryUnits,
      totalInventoryValue,
      lowStockCount,
      outOfStockCount,
      totalCustomers,
    },
    lowStockItems: lowStockItems.slice(0, 8),
    recentOrders: allOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      date: o.date,
      time: o.time,
      cashier: o.cashier,
      customerName: o.customer?.name || 'Walk-in Customer',
      paymentMethod: o.paymentMethod,
      total: o.total,
      status: o.status,
      itemsCount: o.items.length,
    })),
  });
}
