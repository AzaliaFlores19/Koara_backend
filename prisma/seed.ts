import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL no está definida en el entorno.');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  console.log('--- Iniciando el proceso de seeding ---');

  // 1. Limpiar la base de datos (Opcional, en orden inverso por las llaves foráneas)
  await prisma.invoice_Product.deleteMany({});
  await prisma.invoices.deleteMany({});
  await prisma.cAI_Range.deleteMany({});
  await prisma.cAI.deleteMany({});
  await prisma.products.deleteMany({});
  await prisma.categories.deleteMany({});
  await prisma.clients.deleteMany({});
  await prisma.audit_Logs.deleteMany({});
  await prisma.passwordResetToken.deleteMany({});
  await prisma.users.deleteMany({});
  await prisma.company.deleteMany({});

  // ==========================================
  // 2. Crear Datos de la Empresa (Company)
  // ==========================================
  const company = await prisma.company.create({
    data: {
      name: 'Koara',
      rtn: '08011995123456',
      address: 'San Pedro Sula, Honduras',
      phone: '+504 2235-0000',
      email: 'info@glamourco.hn',
    },
  });
  console.log('✅ Empresa creada:', company.name);

  // ==========================================
  // 3. Crear Usuarios (ADMIN y EMPLOYEE)
  // ==========================================
  // Nota: En producción, la contraseña DEBE ser encriptada con bcrypt/argon2
  const adminUser = await prisma.users.create({
    data: {
      name: 'Ana Martínez',
      email: 'admin@glamour.hn',
      phone: '+504 9999-1111',
      password: 'password_seguro_hash', // Cambiar por hash real
      role: 'ADMIN',
    },
  });

  const employeeUser = await prisma.users.create({
    data: {
      name: 'Carlos López',
      email: 'carlos.vendedor@glamour.hn',
      phone: '+504 8888-2222',
      password: 'password_seguro_hash_2', // Cambiar por hash real
      role: 'EMPLOYEE',
    },
  });
  console.log('✅ Usuarios creados');

  // ==========================================
  // 4. Crear Categorías de Maquillaje
  // ==========================================
  const catRostro = await prisma.categories.create({ data: { name: 'Rostro' } });
  const catOjos = await prisma.categories.create({ data: { name: 'Ojos' } });
  const catLabios = await prisma.categories.create({ data: { name: 'Labios' } });
  const catSkincare = await prisma.categories.create({ data: { name: 'Skincare' } });
  console.log('✅ Categorías creadas');

  // ==========================================
  // 5. Crear Productos
  // ==========================================
  const prod1 = await prisma.products.create({
    data: {
      name: 'Base Matte de Alta Cobertura - Tono Sand',
      code_bar: '7701234567891',
      description: 'Base de maquillaje de larga duración 24h, acabado matte para piel mixta a grasa.',
      category_id: catRostro.id,
      stock: 50,
      min_stock: 10,
      price: 450.00, // Lempiras u otra moneda local
    },
  });

  const prod2 = await prisma.products.create({
    data: {
      name: 'Máscara de Pestañas Efecto pestañas postizas',
      code_bar: '7701234567892',
      description: 'A prueba de agua, volumen extremo y definición sin grumos.',
      category_id: catOjos.id,
      stock: 100,
      min_stock: 15,
      price: 280.00,
    },
  });

  const prod3 = await prisma.products.create({
    data: {
      name: 'Labial Líquido Velvet - Red Passion',
      code_bar: '7701234567893',
      description: 'Acabado terciopelo, no transfiere e incluye ácido hialurónico.',
      category_id: catLabios.id,
      stock: 12, // Cerca del stock mínimo
      min_stock: 8,
      price: 320.00,
    },
  });

  const prod4 = await prisma.products.create({
    data: {
      name: 'Sérum Hidratante Ácido Hialurónico',
      code_bar: '7701234567894',
      description: 'Hidratación profunda para preparar la piel antes del maquillaje.',
      category_id: catSkincare.id,
      stock: 40,
      min_stock: 5,
      price: 650.00,
    },
  });
  console.log('✅ Productos creados');

  // ==========================================
  // 6. Crear Clientes
  // ==========================================
  const client1 = await prisma.clients.create({
    data: {
      name: 'María Fernanda Restrepo',
      rtn: '08011990456123',
      phone: '+504 9545-6789',
      email: 'mafer.restrepo@gmail.com',
    },
  });

  const clientConsumidorFinal = await prisma.clients.create({
    data: {
      name: 'Consumidor Final',
      rtn: '00000000000000',
      phone: '00000000',
      email: 'consumidorfinal@glamour.hn',
    },
  });
  console.log('✅ Clientes creados');

  // ==========================================
  // 7. Configuración de SAR (CAI y Rangos)
  // ==========================================
  const cai = await prisma.cAI.create({
    data: {
      cai_code: '3F8E92-B7C1D4-88A9F0-E1D2C3-B4A5F6-77',
    },
  });

  const expDate = new Date();
  expDate.setFullYear(expDate.getFullYear() + 1); // Expira en 1 año

  const caiRange = await prisma.cAI_Range.create({
    data: {
      cai_id: cai.id,
      range_start: 1,
      range_end: 5000,
      current_invoice_number: 1,
      expiration_date: expDate,
      base_code: '001-001-01',
    },
  });
  console.log('✅ CAI y Rangos fiscales configurados');

  // ==========================================
  // 8. Crear una Factura de Ejemplo con sus Items
  // ==========================================
  // Calculamos los totales basados en la compra de 2 Bases y 1 Máscara
  const qtyProd1 = 2;
  const qtyProd2 = 1;
  const subtotal = (Number(prod1.price) * qtyProd1) + (Number(prod2.price) * qtyProd2); // 450*2 + 280 = 1180
  const taxes = subtotal * 0.15; // 15% de ISV en Honduras
  const total = subtotal + taxes;

  const invoice = await prisma.invoices.create({
    data: {
      invoice_number: '001-001-01-00000001',
      cai_range_id: caiRange.id,
      client_id: client1.id,
      user_id: employeeUser.id,
      subtotal: subtotal,
      taxes: taxes,
      total: total,
      payment_method: 'CARD',
      client_name: client1.name,
      client_rtn: client1.rtn,
      client_email: client1.email,
      client_phone: client1.phone,
    },
  });

  // Items de la factura
  await prisma.invoice_Product.createMany({
    data: [
      {
        invoice_id: invoice.id,
        product_id: prod1.id,
        quantity: qtyProd1,
        unit_price: prod1.price,
        item_subtotal: Number(prod1.price) * qtyProd1,
      },
      {
        invoice_id: invoice.id,
        product_id: prod2.id,
        quantity: qtyProd2,
        unit_price: prod2.price,
        item_subtotal: Number(prod2.price) * qtyProd2,
      },
    ],
  });
  console.log('✅ Factura de prueba generada exitosamente');

  // ==========================================
  // 9. Logs de Auditoría Iniciales
  // ==========================================
  await prisma.audit_Logs.create({
    data: {
      user_id: adminUser.id,
      entity: 'COMPANY',
      entity_id: company.id,
      action: 'CREATE',
    },
  });
  console.log('✅ Logs de auditoría registrados');
  
  console.log('--- Proceso de seeding finalizado con éxito ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });