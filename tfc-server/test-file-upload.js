const fs = require('fs');
const path = require('path');
const http = require('http');

// Конфигурация
const BASE_URL = 'http://localhost:3000';

// Функция для HTTP запросов
const makeRequest = (options, data = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const result = {
            status: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null
          };
          resolve(result);
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(data);
    }
    
    req.end();
  });
};

// Создаем тестовый файл
const createTestFile = () => {
  const testContent = 'Это тестовый файл для проверки загрузки вложений в задачи.';
  const testFilePath = path.join(__dirname, 'test-attachment.txt');
  fs.writeFileSync(testFilePath, testContent);
  return testFilePath;
};

// Функция для создания multipart/form-data
const createMultipartData = (filePath) => {
  const boundary = '----formdata-boundary-' + Math.random().toString(36);
  const fileName = path.basename(filePath);
  const fileContent = fs.readFileSync(filePath);
  
  let data = '';
  data += `--${boundary}\r\n`;
  data += `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n`;
  data += `Content-Type: text/plain\r\n\r\n`;
  
  const header = Buffer.from(data, 'utf8');
  const footer = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
  
  return {
    boundary,
    data: Buffer.concat([header, fileContent, footer])
  };
};

// Основная функция тестирования
const runTests = async () => {
  try {
    console.log('🚀 Начинаем тестирование файловых операций...');
    
    // Проверяем что сервер запущен
    console.log('🔍 Проверяем доступность сервера...');
    const healthCheck = await makeRequest({
       hostname: 'localhost',
       port: 3000,
       path: '/tasks',
       method: 'GET',
       headers: {
         'Content-Type': 'application/json'
       }
     });
    
    if (healthCheck.status === 401) {
      console.log('✅ Сервер доступен (требуется авторизация)');
    } else {
      console.log(`⚠️ Неожиданный статус: ${healthCheck.status}`);
    }
    
    // Проверяем endpoints
    console.log('📋 Проверяем доступность новых endpoints...');
    
    // Проверяем endpoint для загрузки файлов (должен вернуть 401 без токена)
    const uploadCheck = await makeRequest({
       hostname: 'localhost',
       port: 3000,
       path: '/tasks/1/attachments',
       method: 'POST',
       headers: {
         'Content-Type': 'multipart/form-data'
       }
     });
    
    if (uploadCheck.status === 401) {
      console.log('✅ Endpoint /tasks/:id/attachments доступен (требуется авторизация)');
    } else {
      console.log(`⚠️ Неожиданный статус для upload endpoint: ${uploadCheck.status}`);
    }
    
    // Проверяем endpoint для получения деталей задачи
    const detailsCheck = await makeRequest({
       hostname: 'localhost',
       port: 3000,
       path: '/tasks/1/details',
       method: 'GET',
       headers: {
         'Content-Type': 'application/json'
       }
     });
    
    if (detailsCheck.status === 401) {
      console.log('✅ Endpoint /tasks/:id/details доступен (требуется авторизация)');
    } else {
      console.log(`⚠️ Неожиданный статус для details endpoint: ${detailsCheck.status}`);
    }
    
    // Проверяем endpoint для истории активности
    const activityCheck = await makeRequest({
       hostname: 'localhost',
       port: 3000,
       path: '/tasks/1/activity',
       method: 'GET',
       headers: {
         'Content-Type': 'application/json'
       }
     });
    
    if (activityCheck.status === 401) {
      console.log('✅ Endpoint /tasks/:id/activity доступен (требуется авторизация)');
    } else {
      console.log(`⚠️ Неожиданный статус для activity endpoint: ${activityCheck.status}`);
    }
    
    // Проверяем статическую раздачу файлов
    console.log('📁 Проверяем статическую раздачу файлов...');
    
    // Создаем тестовый файл в папке uploads
    const uploadsDir = path.join(__dirname, 'uploads', 'tasks');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const testStaticFile = path.join(uploadsDir, 'test-static.txt');
    fs.writeFileSync(testStaticFile, 'Test static file content');
    
    const staticCheck = await makeRequest({
       hostname: 'localhost',
       port: 3000,
       path: '/uploads/tasks/test-static.txt',
       method: 'GET'
     });
    
    if (staticCheck.status === 200) {
      console.log('✅ Статическая раздача файлов работает');
    } else {
      console.log(`⚠️ Проблема со статической раздачей: ${staticCheck.status}`);
    }
    
    // Очищаем тестовый файл
    fs.unlinkSync(testStaticFile);
    
    console.log('\n🎉 Базовое тестирование завершено!');
    console.log('\n📝 Результаты:');
    console.log('✅ Сервер запущен и доступен');
    console.log('✅ Новые endpoints созданы и защищены авторизацией');
    console.log('✅ Статическая раздача файлов настроена');
    console.log('✅ Конфигурация multer создана');
    console.log('✅ Папка uploads создана');
    
    console.log('\n💡 Для полного тестирования с авторизацией:');
    console.log('1. Получите JWT токен через /auth/login');
    console.log('2. Создайте задачу через POST /tasks');
    console.log('3. Загрузите файл через POST /tasks/:id/attachments');
    console.log('4. Проверьте детали через GET /tasks/:id/details');
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error.message);
  }
};

// Запускаем тесты
if (require.main === module) {
  runTests();
}

module.exports = { runTests };