import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        phone: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { id: 'asc' },
    });
  }

  // Получить пользователей, доступных для добавления в команды (не состоят ни в одной активной команде)
  async findAvailableForTeams() {
    return this.prisma.user.findMany({
      where: {
        teams: {
          none: {
            isActive: true,
          },
        },
      },
      select: {
        id: true,
        phone: true,
        name: true,
        surname: true,
        patronymic: true,
        role: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async update(userId: number, updateUserDto: UpdateUserDto) {
    // Фильтруем пустые строки и undefined значения
    const filteredData = Object.fromEntries(
      Object.entries(updateUserDto).filter(
        ([_, value]) => value !== undefined && value !== '' && value !== null,
      ),
    );

    // Преобразуем birthDate в DateTime если присутствует
    if (filteredData.birthDate) {
      filteredData.birthDate = new Date(filteredData.birthDate);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: filteredData,
      select: {
        id: true,
        phone: true,
        name: true,
        surname: true,
        patronymic: true,
        birthDate: true,
        personalTelegram: true,
        personalInstagram: true,
        personalPhone: true,
        yearsInBusiness: true,
        hobbies: true,
        role: true,
        createdAt: true,
      },
    });
  }
}
