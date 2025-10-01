import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfilesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, createProfileDto: CreateProfileDto) {
    // Check if profile already exists
    const existingProfile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      // Update existing profile instead of creating new one
      return this.update(userId, createProfileDto);
    }

    return this.prisma.userProfile.create({
      data: {
        ...createProfileDto,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            surname: true,
            patronymic: true,
            birthDate: true,
            personalTelegram: true,
            personalInstagram: true,
            personalPhone: true,
            yearsInBusiness: true,
            hobbies: true,
            phone: true,
            role: true,
          },
        },
      },
    });
  }

  async findOne(userId: number) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            surname: true,
            patronymic: true,
            birthDate: true,
            personalTelegram: true,
            personalInstagram: true,
            personalPhone: true,
            yearsInBusiness: true,
            hobbies: true,
            phone: true,
            role: true,
          },
        },
      },
    });

    return profile; // Возвращаем null если профиль не найден, вместо ошибки
  }

  async findOneOrThrow(userId: number) {
    const profile = await this.findOne(userId);

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  async update(userId: number, updateProfileDto: UpdateProfileDto) {
    // Check if profile exists
    const existingProfile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!existingProfile) {
      // Create profile if it doesn't exist
      return this.create(userId, updateProfileDto);
    }

    return this.prisma.userProfile.update({
      where: { userId },
      data: updateProfileDto,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            surname: true,
            patronymic: true,
            birthDate: true,
            personalTelegram: true,
            personalInstagram: true,
            personalPhone: true,
            yearsInBusiness: true,
            hobbies: true,
            phone: true,
            role: true,
          },
        },
      },
    });
  }

  async remove(userId: number) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return this.prisma.userProfile.delete({
      where: { userId },
    });
  }

  async findAll() {
    return this.prisma.userProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            surname: true,
            patronymic: true,
            birthDate: true,
            personalTelegram: true,
            personalInstagram: true,
            personalPhone: true,
            yearsInBusiness: true,
            hobbies: true,
            phone: true,
            role: true,
          },
        },
      },
    });
  }
}
