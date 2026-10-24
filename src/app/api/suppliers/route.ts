import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await authenticateRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: 'asc' },
  });

  return NextResponse.json(suppliers);
}

export async function POST(req: NextRequest) {
  const session = await authenticateRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, contactPerson, phone, email, address, notes } = await req.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Supplier name is required' }, { status: 400 });
    }

    const supplier = await prisma.supplier.create({
      data: {
        name: name.trim(),
        contactPerson: contactPerson ? contactPerson.trim() : null,
        phone: phone ? phone.trim() : null,
        email: email ? email.trim() : null,
        address: address ? address.trim() : null,
        notes: notes ? notes.trim() : null,
      },
    });

    return NextResponse.json({ success: true, supplier });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create supplier' }, { status: 500 });
  }
}
