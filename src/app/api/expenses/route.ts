import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await authenticateRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const expenses = await prisma.expense.findMany({
    orderBy: { id: 'desc' },
  });

  return NextResponse.json(expenses);
}

export async function POST(req: NextRequest) {
  const session = await authenticateRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { category, description, amount, date } = await req.json();
    if (!category || !amount) {
      return NextResponse.json({ error: 'Category and amount are required' }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        category,
        description: description ? description.trim() : null,
        amount: parseFloat(amount) || 0,
        date: date || new Date().toISOString().split('T')[0],
        createdBy: session.fullName || session.username,
      },
    });

    return NextResponse.json({ success: true, expense });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create expense' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await authenticateRequest(req);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

  await prisma.expense.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ success: true });
}
