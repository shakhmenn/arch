import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { User, Role } from '@prisma/client';
import { LoginRequestDto, RegisterRequestDto } from './dtos/auth.dto';
import * as bcrypt from 'bcrypt';

export interface JwtPayload {
  sub: number;
  phone: string;
  role: Role;
}

// auth.service.ts
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterRequestDto) {
    const { phone, password, name } = dto;

    if (await this.prisma.user.findUnique({ where: { phone } })) {
      throw new ConflictException('Номер уже зарегистрирован');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        phone,
        name,
        password: hashedPassword,
        role: Role.USER,
      },
    });

    return this.issueToken(user);
  }

  async login(dto: LoginRequestDto) {
    const user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    if (!user) {
      throw new UnauthorizedException('Неверные данные');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверные данные');
    }

    return this.issueToken(user);
  }

  private issueToken(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      phone: user.phone,
      role: user.role,
    };
    return {
      access_token: this.jwt.sign(payload),
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
      },
    };
  }
}
