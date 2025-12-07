// Скрипт для инициализации базы данных с тестовыми данными
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function initDatabase() {
  try {
    console.log('🚀 Инициализация базы данных...');

    // Создание администратора
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@typography.ru' },
      update: {},
      create: {
        email: 'admin@typography.ru',
        password: adminPassword,
        firstName: 'Администратор',
        lastName: 'Системы',
        role: 'ADMIN',
        tags: ['Настройщик'],
      },
    });
    console.log('✅ Администратор создан');

    // Создание менеджера
    const managerPassword = await bcrypt.hash('manager123', 10);
    const manager = await prisma.user.upsert({
      where: { email: 'manager@typography.ru' },
      update: {},
      create: {
        email: 'manager@typography.ru',
        password: managerPassword,
        firstName: 'Менеджер',
        lastName: 'Иванов',
        role: 'MANAGER',
      },
    });
    console.log('✅ Менеджер создан');

    // Создание сотрудника
    const employeePassword = await bcrypt.hash('employee123', 10);
    const employee = await prisma.user.upsert({
      where: { email: 'employee@typography.ru' },
      update: {},
      create: {
        email: 'employee@typography.ru',
        password: employeePassword,
        firstName: 'Сотрудник',
        lastName: 'Петров',
        role: 'EMPLOYEE',
        tags: ['Печатник'],
      },
    });
    console.log('✅ Сотрудник создан');

    // Создание станков
    const machines = [
      {
        name: 'Печатный станок HP Indigo',
        efficiencyNorm: 500,
        capabilities: ['Печать', 'Цветная печать'],
        status: 'WORKING',
      },
      {
        name: 'Ламинатор',
        efficiencyNorm: 300,
        capabilities: ['Ламинация', 'Глянцевая ламинация'],
        status: 'WORKING',
      },
      {
        name: 'Гильотина',
        efficiencyNorm: 1000,
        capabilities: ['Резка', 'Точная резка'],
        status: 'WORKING',
      },
    ];

    for (const machineData of machines) {
      const existing = await prisma.machine.findFirst({
        where: { name: machineData.name },
      });
      if (!existing) {
        await prisma.machine.create({
          data: machineData,
        });
      }
    }
    console.log('✅ Станки созданы');

    // Создание материалов
    const materials = [
      {
        name: 'Бумага А4 Мелованная',
        unit: 'лист',
        currentStock: 10000,
        minStock: 1000,
      },
      {
        name: 'Бумага А3 Офсетная',
        unit: 'лист',
        currentStock: 5000,
        minStock: 500,
      },
      {
        name: 'Пленка для ламинации',
        unit: 'м²',
        currentStock: 100,
        minStock: 10,
      },
    ];

    for (const materialData of materials) {
      const existing = await prisma.material.findFirst({
        where: { name: materialData.name },
      });
      if (!existing) {
        await prisma.material.create({
          data: materialData,
        });
      }
    }
    console.log('✅ Материалы созданы');

    console.log('\n🎉 База данных инициализирована успешно!');
    console.log('\n📋 Учетные данные:');
    console.log('Администратор: admin@typography.ru / admin123');
    console.log('Менеджер: manager@typography.ru / manager123');
    console.log('Сотрудник: employee@typography.ru / employee123');
  } catch (error) {
    console.error('❌ Ошибка инициализации:', error.message);
    if (error.code === 'P1001') {
      console.error('\n⚠️  Не удается подключиться к базе данных.');
      console.error('Убедитесь, что:');
      console.error('1. PostgreSQL запущен');
      console.error('2. База данных typography_erp создана');
      console.error('3. Данные в backend/.env корректны');
    }
  } finally {
    await prisma.$disconnect();
  }
}

initDatabase();

