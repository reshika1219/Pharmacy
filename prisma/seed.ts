import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Config
  const configs = [
    { key: 'businessName', val: 'ExamplePOS' },
    { key: 'businessAddress', val: '450 Healthcare Boulevard, Suite 101' },
    { key: 'businessPhone', val: '+1 (555) 382-9100' },
    { key: 'currency', val: '$' },
    { key: 'currencyCode', val: 'USD' },
    { key: 'taxRate', val: '5.0' },
    { key: 'receiptFooter', val: 'Thank you for choosing ExamplePOS! Keep your receipt for returns within 14 days.' },
    { key: 'orderNextId', val: '1001' },
    { key: 'loyaltyEnabled', val: 'true' },
    { key: 'loyaltyRate', val: '1' },
  ];

  for (const c of configs) {
    await prisma.config.upsert({
      where: { key: c.key },
      update: { val: c.val },
      create: { key: c.key, val: c.val },
    });
  }

  // 2. Users
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('admin123', salt);
  const cashierPasswordHash = await bcrypt.hash('cashier123', salt);

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: { passwordHash: adminPasswordHash },
    create: {
      username: 'admin',
      passwordHash: adminPasswordHash,
      role: 'admin',
      fullName: 'Store Manager (Admin)',
    },
  });

  await prisma.user.upsert({
    where: { username: 'cashier' },
    update: { passwordHash: cashierPasswordHash },
    create: {
      username: 'cashier',
      passwordHash: cashierPasswordHash,
      role: 'cashier',
      fullName: 'Head Cashier',
    },
  });

  // 3. Categories
  const categoriesData = [
    { name: 'Antibiotics', color: '#3b82f6', icon: 'pill' },
    { name: 'Analgesics & Pain', color: '#ef4444', icon: 'heart-pulse' },
    { name: 'Cardiovascular', color: '#8b5cf6', icon: 'activity' },
    { name: 'Diabetology', color: '#10b981', icon: 'shield-check' },
    { name: 'Vitamins & Health', color: '#f59e0b', icon: 'sun' },
    { name: 'First Aid & Surgical', color: '#ec4899', icon: 'cross' },
    { name: 'Personal Care', color: '#06b6d4', icon: 'sparkles' },
  ];

  const categoryMap = new Map<string, number>();
  for (const cat of categoriesData) {
    const c = await prisma.category.upsert({
      where: { name: cat.name },
      update: { color: cat.color, icon: cat.icon },
      create: { name: cat.name, color: cat.color, icon: cat.icon },
    });
    categoryMap.set(c.name, c.id);
  }

  // 4. Suppliers
  const suppliersData = [
    { name: 'Global Pharma Logistics', contactPerson: 'Sarah Jenkins', phone: '+1 555-0192', email: 'orders@globalpharma.com', address: '120 Portway Ave, NY' },
    { name: 'Apex Medical Labs', contactPerson: 'David Miller', phone: '+1 555-0144', email: 'sales@apexlabs.com', address: '88 Industrial Way, NJ' },
    { name: 'MediCare Healthcare Supplies', contactPerson: 'Elena Rostova', phone: '+1 555-0178', email: 'elena@medicare.com', address: '344 Central Pkwy, CA' },
  ];

  for (const s of suppliersData) {
    const existing = await prisma.supplier.findFirst({ where: { name: s.name } });
    if (!existing) {
      await prisma.supplier.create({ data: s });
    }
  }

  // 5. Products & Batches
  const productsData = [
    {
      name: 'Amoxicillin 500mg',
      sku: 'AMX-500',
      barcode: '890123456001',
      unit: 'Capsule(s)',
      categoryName: 'Antibiotics',
      minStock: 50,
      description: 'Broad-spectrum antibiotic for bacterial infections.',
      batches: [
        { batchRef: 'AMX-B2026-A', qtyReceived: 200, qtyRemaining: 185, costPrice: 0.15, sellPrice: 0.35, supplier: 'Global Pharma Logistics' },
        { batchRef: 'AMX-B2026-B', qtyReceived: 100, qtyRemaining: 90, costPrice: 0.14, sellPrice: 0.35, supplier: 'Apex Medical Labs' },
      ],
    },
    {
      name: 'Paracetamol 500mg (Acetaminophen)',
      sku: 'PCT-500',
      barcode: '890123456002',
      unit: 'Tablet(s)',
      categoryName: 'Analgesics & Pain',
      minStock: 100,
      description: 'Fast-acting fever reducer and mild-to-moderate pain reliever.',
      batches: [
        { batchRef: 'PCT-2026-01', qtyReceived: 500, qtyRemaining: 420, costPrice: 0.05, sellPrice: 0.15, supplier: 'Apex Medical Labs' },
      ],
    },
    {
      name: 'Metformin 850mg',
      sku: 'MTF-850',
      barcode: '890123456003',
      unit: 'Tablet(s)',
      categoryName: 'Diabetology',
      minStock: 80,
      description: 'First-line medication for the treatment of type 2 diabetes.',
      batches: [
        { batchRef: 'MTF-B9901', qtyReceived: 150, qtyRemaining: 24, costPrice: 0.10, sellPrice: 0.28, supplier: 'MediCare Healthcare Supplies' },
      ],
    },
    {
      name: 'Atorvastatin 20mg',
      sku: 'ATV-020',
      barcode: '890123456004',
      unit: 'Tablet(s)',
      categoryName: 'Cardiovascular',
      minStock: 40,
      description: 'Statin medication used to lower cholesterol and prevent heart attacks.',
      batches: [
        { batchRef: 'ATV-2026-89', qtyReceived: 120, qtyRemaining: 76, costPrice: 0.40, sellPrice: 0.95, supplier: 'Global Pharma Logistics' },
      ],
    },
    {
      name: 'Vitamin C 1000mg + Zinc Effervescent',
      sku: 'VTC-1000',
      barcode: '890123456005',
      unit: 'Tube(s)',
      categoryName: 'Vitamins & Health',
      minStock: 30,
      description: 'Daily immune support effervescent tablets with orange flavor.',
      batches: [
        { batchRef: 'VTC-TUBE-44', qtyReceived: 80, qtyRemaining: 52, costPrice: 2.80, sellPrice: 6.50, supplier: 'MediCare Healthcare Supplies' },
      ],
    },
    {
      name: 'Sterile Gauze Bandage 10cm x 5m',
      sku: 'GZ-BAND-10',
      barcode: '890123456006',
      unit: 'Roll(s)',
      categoryName: 'First Aid & Surgical',
      minStock: 25,
      description: 'Hypoallergenic sterile absorbent cotton gauze rolls.',
      batches: [
        { batchRef: 'GZ-ROLL-11', qtyReceived: 150, qtyRemaining: 18, costPrice: 0.70, sellPrice: 1.80, supplier: 'Apex Medical Labs' },
      ],
    },
    {
      name: 'Antiseptic Hand Sanitizer Gel 500ml',
      sku: 'SAN-500ML',
      barcode: '890123456007',
      unit: 'Bottle(s)',
      categoryName: 'Personal Care',
      minStock: 20,
      description: '75% Ethyl Alcohol hospital-grade rinse-free disinfectant pump.',
      batches: [
        { batchRef: 'SAN-PUMP-02', qtyReceived: 60, qtyRemaining: 38, costPrice: 1.90, sellPrice: 4.50, supplier: 'Global Pharma Logistics' },
      ],
    },
  ];

  for (const p of productsData) {
    const categoryId = categoryMap.get(p.categoryName);
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        name: p.name,
        barcode: p.barcode,
        unit: p.unit,
        minStock: p.minStock,
        description: p.description,
        categoryId: categoryId || null,
      },
      create: {
        name: p.name,
        sku: p.sku,
        barcode: p.barcode,
        unit: p.unit,
        minStock: p.minStock,
        description: p.description,
        categoryId: categoryId || null,
      },
    });

    for (const b of p.batches) {
      const existingBatch = await prisma.batch.findFirst({
        where: { productId: product.id, batchRef: b.batchRef },
      });
      if (!existingBatch) {
        await prisma.batch.create({
          data: {
            productId: product.id,
            batchRef: b.batchRef,
            qtyReceived: b.qtyReceived,
            qtyRemaining: b.qtyRemaining,
            costPrice: b.costPrice,
            sellPrice: b.sellPrice,
            supplier: b.supplier,
            dateAdded: new Date().toISOString().split('T')[0],
          },
        });
      }
    }
  }

  // 6. Customers
  const customer = await prisma.customer.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Johnathan Walker',
      phone: '+1 555-8921',
      email: 'jwalker@example.com',
      address: '742 Evergreen Terrace',
      loyaltyPoints: 120,
      totalSpent: 345.50,
    },
  });

  // 7. Expenses
  const todayStr = new Date().toISOString().split('T')[0];
  const expenseCount = await prisma.expense.count();
  if (expenseCount === 0) {
    await prisma.expense.createMany({
      data: [
        { date: todayStr, category: 'Utilities', description: 'Store Electricity & Cold Storage', amount: 145.0, createdBy: 'admin' },
        { date: todayStr, category: 'Supplies', description: 'Thermal Receipt Rolls & Packaging', amount: 38.5, createdBy: 'admin' },
      ],
    });
  }

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
