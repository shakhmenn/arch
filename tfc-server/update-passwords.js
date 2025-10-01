const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function updatePasswords() {
  try {
    console.log('🔄 Updating user passwords...');
    
    // Генерируем правильный хеш для пароля 'test123'
    const correctHash = '$2b$10$08Rn0fDITvJq.1DKQpx12.g1mNPBUOFVNH2AQ4l1xVdkD3z0SsR9y';
    
    // Список телефонов пользователей для обновления
    const phoneNumbers = [
      '+79161111111',
      '+79162222222',
      '+79163333333',
      '+79164444444',
      '+79165555555',
      '+79161234567'
    ];
    
    for (const phone of phoneNumbers) {
      const result = await prisma.user.update({
        where: { phone },
        data: { password: correctHash }
      });
      console.log(`✅ Updated password for user: ${result.name} ${result.surname} (${phone})`);
    }
    
    console.log('🎉 All passwords updated successfully!');
    
  } catch (error) {
    console.error('❌ Error updating passwords:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePasswords();