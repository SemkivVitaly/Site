// Скрипт для создания первого администратора
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const email = 'admin@typography.ru';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        password: hashedPassword,
        firstName: 'Администратор',
        lastName: 'Системы',
        role: 'ADMIN',
      },
    });

    console.log('✅ Администратор создан успешно!');
    console.log('Email:', email);
    console.log('Пароль: admin123');
    console.log('ID:', user.id);
  } catch (error) {
    console.error('❌ Ошибка создания администратора:', error.message);
    if (error.code === 'P1001') {
      console.error('⚠️  Не удается подключиться к базе данных.');
      console.error('Убедитесь, что PostgreSQL запущен и база данных создана.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();

