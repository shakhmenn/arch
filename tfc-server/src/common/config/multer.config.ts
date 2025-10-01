import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { BadRequestException } from '@nestjs/common';

// Создаем папку uploads если её нет
const uploadPath = join(process.cwd(), 'uploads', 'tasks');
if (!existsSync(uploadPath)) {
  mkdirSync(uploadPath, { recursive: true });
}

export const multerConfig: MulterOptions = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      // Генерируем уникальное имя файла
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = extname(file.originalname);
      const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
      cb(null, filename);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5, // максимум 5 файлов за раз
  },
  fileFilter: (req, file, cb) => {
    // Разрешенные типы файлов
    const allowedMimeTypes = [
      // Изображения
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      // Документы
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // Текстовые файлы
      'text/plain',
      'text/csv',
      // Архивы
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new BadRequestException(`Неподдерживаемый тип файла: ${file.mimetype}`), false);
    }
  },
};

// Функция для определения типа вложения по MIME типу
export function getAttachmentType(mimeType: string): 'IMAGE' | 'DOCUMENT' | 'VIDEO' | 'OTHER' {
  if (mimeType.startsWith('image/')) {
    return 'IMAGE';
  }
  
  if (mimeType.startsWith('video/')) {
    return 'VIDEO';
  }
  
  const documentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
  ];
  
  if (documentTypes.includes(mimeType)) {
    return 'DOCUMENT';
  }
  
  return 'OTHER';
}