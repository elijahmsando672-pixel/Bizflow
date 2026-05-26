import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create a demo business (or use existing)
  const business = await prisma.business.upsert({
    where: { id: '4db6737e-ca34-46cc-9505-0add5b6d4e13' },
    update: {},
    create: {
      id: '4db6737e-ca34-46cc-9505-0add5b6d4e13',
      name: 'Demo Business',
      type: 'RETAIL',
      currency: 'USD',
      timezone: 'America/New_York',
    },
  });

  // Create demo user (or use existing)
  const user = await prisma.user.upsert({
    where: { email: 'demo@bizflow.com' },
    update: {},
    create: {
      email: 'demo@bizflow.com',
      name: 'Demo User',
      passwordHash: await bcrypt.hash('demo1234', 12),
      role: 'OWNER',
      businessId: business.id,
    },
  });

  // Create demo products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { sku: 'SKU-001' },
      update: {},
      create: {
        name: 'Sample Product 1',
        description: 'A sample product for demo',
        sku: 'SKU-001',
        price: 29.99,
        cost: 15.0,
        stock: 100,
        lowStockAlert: 10,
        category: 'Electronics',
        businessId: business.id,
      },
    }),
    prisma.product.upsert({
      where: { sku: 'SKU-002' },
      update: {},
      create: {
        name: 'Sample Product 2',
        description: 'Another sample product',
        sku: 'SKU-002',
        price: 49.99,
        cost: 25.0,
        stock: 50,
        lowStockAlert: 10,
        category: 'Accessories',
        businessId: business.id,
      },
    }),
  ]);

  // Create demo customer
  const customer = await prisma.customer
    .create({
      data: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        address: '123 Main St, City, Country',
        businessId: business.id,
      },
    })
    .catch(() => prisma.customer.findFirst({ where: { email: 'john@example.com' } }));

  // Create demo tasks
  await Promise.all([
    prisma.task
      .create({
        data: {
          title: 'Review monthly reports',
          description: 'Review financial reports for last month',
          status: 'TODO',
          priority: 'HIGH',
          businessId: business.id,
          assignedToId: user.id,
        },
      })
      .catch(() => {}),
    prisma.task
      .create({
        data: {
          title: 'Update inventory',
          description: 'Update product inventory levels',
          status: 'IN_PROGRESS',
          priority: 'MEDIUM',
          businessId: business.id,
          assignedToId: user.id,
        },
      })
      .catch(() => {}),
  ]);

  console.log('Database seeded successfully!');
  console.log(`Business: ${business.name} (${business.id})`);
  console.log(`User: ${user.email}`);
  console.log(`Products: ${products.length}`);
  console.log(`Customer: ${customer?.name ?? 'N/A'}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
