import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL no está definida en el entorno.');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const isProduction = process.env.NODE_ENV === 'production';
  console.log(`--- Iniciando proceso de Seeding [Modo: ${isProduction ? 'PRODUCCIÓN' : 'DESARROLLO'}] ---`);

  const saltRounds = 10;

  // ==========================================
  // 1. LIMPIEZA DE BASE DE DATOS (Solo en Desarrollo)
  // ==========================================
  if (!isProduction) {
    console.log('🧹 Limpiando base de datos para desarrollo...');
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
    console.log('✅ Base de datos limpia.');
  }

  // ==========================================
  // 2. DATOS DE PRODUCCIÓN / DESPLIEGUE (SIEMPRE SE EJECUTAN)
  // ==========================================
  console.log('🏢 Configurando datos esenciales (Company)...');
  let company = await prisma.company.findFirst({
  where: { email: 'koara@gmail.com' },
});

  // 2. Si no existe, crearla
  if (!company) {
    company = await prisma.company.create({
      data: {
        name: 'Koara',
        rtn: '08011995123456',
        address: 'San Pedro Sula, Honduras',
        phone: '+504 2235-0000',
        email: 'koara@gmail.com',
      },
    });
    console.log('✅ Empresa creada:', company.name);
  } else {
    console.log('🏢 La empresa ya existe:', company.name);
  }

  console.log('👥 Configurando Administrador Principal...');
  const plainAdminPassword = 'Password123'; 
  const hashedAdminPassword = await bcrypt.hash(plainAdminPassword, saltRounds);

  const adminUser = await prisma.users.upsert({
    where: { email: 'admin@koara.com' },
    update: {},
    create: {
      name: 'Administrador Principal',
      email: 'admin@koara.com',
      phone: '+504 0000-0000',
      password: hashedAdminPassword,
      role: 'ADMIN',
    },
  });
  console.log('✅ Administrador listo:', adminUser.email);


  // ==========================================
  // 3. DATOS ADICIONALES (SOLO EN DESARROLLO)
  // ==========================================
  if (!isProduction) {
    console.log('🧪 Cargando datos de prueba para ambiente local...');

    // 3.1. Usuario Empleado de Prueba
    const plainEmployeePassword = 'PasswordEmployee123';
    const hashedEmployeePassword = await bcrypt.hash(plainEmployeePassword, saltRounds);
    
    const employeeUser = await prisma.users.upsert({
      where: { email: 'carlos.vendedor@glamour.hn' },
      update: {},
      create: {
        name: 'Carlos López',
        email: 'carlos.vendedor@glamour.hn',
        phone: '+504 8888-2222',
        password: hashedEmployeePassword,
        role: 'EMPLOYEE',
      },
    });

    // 3.2. Categorías
    const catRostro = await prisma.categories.create({ data: { name: 'Rostro' } });
    const catOjos = await prisma.categories.create({ data: { name: 'Ojos' } });
    const catLabios = await prisma.categories.create({ data: { name: 'Labios' } });
    const catSkincare = await prisma.categories.create({ data: { name: 'Skincare' } });

    // 3.3. Productos
    const prod1 = await prisma.products.create({
      data: {
        name: 'Base Matte de Alta Cobertura - Tono Sand',
        code_bar: '7701234567891',
        description: 'Base de maquillaje de larga duración 24h, acabado matte para piel mixta a grasa.',
        category_id: catRostro.id,
        stock: 50,
        min_stock: 10,
        price: 450.00,
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

    await prisma.products.create({
      data: {
        name: 'Labial Líquido Velvet - Red Passion',
        code_bar: '7701234567893',
        description: 'Acabado terciopelo, no transfiere e incluye ácido hialurónico.',
        category_id: catLabios.id,
        stock: 12,
        min_stock: 8,
        price: 320.00,
      },
    });

    await prisma.products.create({
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

    // 3.4. Clientes
    const client1 = await prisma.clients.create({
      data: {
        name: 'María Fernanda Restrepo',
        rtn: '08011990456123',
        phone: '+504 9545-6789',
        email: 'mafer.restrepo@gmail.com',
      },
    });

    await prisma.clients.create({
      data: {
        name: 'Consumidor Final',
        rtn: '00000000000000',
        phone: '00000000',
        email: 'consumidorfinal@glamour.hn',
      },
    });

    // 3.5. SAR / CAI / Facturación
    const cai = await prisma.cAI.create({
      data: {
        cai_code: '3F8E92-B7C1D4-88A9F0-E1D2C3-B4A5F6-77',
      },
    });

    const expDate = new Date();
    expDate.setFullYear(expDate.getFullYear() + 1);

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

    // 3.6. Factura de ejemplo
    const qtyProd1 = 2;
    const qtyProd2 = 1;
    const subtotal = (Number(prod1.price) * qtyProd1) + (Number(prod2.price) * qtyProd2); 
    const taxes = subtotal * 0.15; // 15% ISV (Honduras)
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

    // 3.7. Auditoría
    await prisma.audit_Logs.create({
      data: {
        user_id: adminUser.id,
        entity: 'COMPANY',
        entity_id: company.id,
        action: 'CREATE',
      },
    });

    console.log('✅ Datos de prueba (Categorías, Productos, Clientes, Facturas) cargados con éxito.');
  }

  console.log('--- Proceso de seeding finalizado con éxito ---');
}

main()
  .catch((e) => {
    console.error('❌ Error en el proceso de seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });