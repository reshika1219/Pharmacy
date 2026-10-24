import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await authenticateRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const configs = await prisma.config.findMany();
  const configMap: Record<string, string> = {};
  for (const c of configs) {
    configMap[c.key] = c.val;
  }

  return NextResponse.json(configMap);
}

export async function POST(req: NextRequest) {
  const session = await authenticateRequest(req);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const allowedKeys = [
      'businessName',
      'businessAddress',
      'businessPhone',
      'currency',
      'currencyCode',
      'taxRate',
      'receiptFooter',
      'loyaltyEnabled',
      'loyaltyRate',
    ];

    for (const key of allowedKeys) {
      if (body[key] !== undefined) {
        await prisma.config.upsert({
          where: { key },
          update: { val: String(body[key]) },
          create: { key, val: String(body[key]) },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update settings' }, { status: 500 });
  }
}
