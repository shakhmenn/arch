import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('profiles')
@UseGuards(JwtAuthGuard)
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Post()
  create(@Request() req, @Body() createProfileDto: CreateProfileDto) {
    return this.profilesService.create(req.user.id, createProfileDto);
  }

  @Get('me')
  findMyProfile(@Request() req) {
    return this.profilesService.findOne(req.user.id);
  }

  @Get(':userId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  findOne(@Param('userId', ParseIntPipe) userId: number) {
    return this.profilesService.findOneOrThrow(userId);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  findAll() {
    return this.profilesService.findAll();
  }

  @Patch()
  update(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.profilesService.update(req.user.id, updateProfileDto);
  }

  @Patch(':userId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  updateUserProfile(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.profilesService.update(userId, updateProfileDto);
  }

  @Delete()
  remove(@Request() req) {
    return this.profilesService.remove(req.user.id);
  }

  @Delete(':userId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  removeUserProfile(@Param('userId', ParseIntPipe) userId: number) {
    return this.profilesService.remove(userId);
  }
}
