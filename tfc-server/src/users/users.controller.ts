import {
  Controller,
  Get,
  Patch,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  list() {
    return this.users.findAll();
  }

  @Get('available-for-teams')
  getAvailableForTeams() {
    return this.users.findAvailableForTeams();
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateMe(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    return this.users.update(req.user.id, updateUserDto);
  }
}
