import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  Request,
  ForbiddenException,
} from '@nestjs/common';
// import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dtos/create-team.dto';
import { UpdateTeamDto } from './dtos/update-team.dto';
import { AssignLeaderDto } from './dtos/assign-leader.dto';
import { AddMemberDto } from './dtos/add-member.dto';
import { GetTeamsFilterDto } from './dtos/get-teams-filter.dto';
import { AssignUserDto } from './dtos/assign-user.dto';
import { TransferMemberDto } from './dtos/transfer-member.dto';
import { RemoveMemberDto } from './dtos/remove-member.dto';
import { TeamHistoryFilterDto } from './dtos/team-history-filter.dto';
import { User } from '../common/decorators/user.decorator';

// @ApiTags('teams')
// @ApiBearerAuth()
@Controller('teams')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeamsController {
  constructor(private readonly teams: TeamsService) {}

  @Post()
  @Roles(Role.ADMIN)
  // @ApiOperation({ summary: 'Создать новую команду' })
  // @ApiResponse({ status: 201, description: 'Команда успешно создана' })
  // @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  createTeam(@Body() createTeamDto: CreateTeamDto, @Request() req) {
    return this.teams.createTeam(createTeamDto, req.user.id);
  }

  @Get()
  @Roles(
    Role.ADMIN,
    Role.TEAM_LEADER,
    Role.USER,
  )
  // @ApiOperation({ summary: 'Получить список команд' })
  // @ApiResponse({ status: 200, description: 'Список команд получен' })
  getTeams(@Request() req, @Query() filters: GetTeamsFilterDto) {
    return this.teams.getTeamsForUser(req.user.id, req.user.role);
  }

  @Get(':id')
  @Roles(
    Role.ADMIN,
    Role.TEAM_LEADER,
    Role.USER,
  )
  // @ApiOperation({ summary: 'Получить информацию о команде' })
  // @ApiResponse({ status: 200, description: 'Информация о команде получена' })
  // @ApiResponse({ status: 404, description: 'Команда не найдена' })
  // @ApiResponse({ status: 403, description: 'Нет доступа к команде' })
  getTeam(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.teams.getTeamMembers(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.TEAM_LEADER)
  // @ApiOperation({ summary: 'Обновить команду' })
  // @ApiResponse({ status: 200, description: 'Команда успешно обновлена' })
  // @ApiResponse({ status: 404, description: 'Команда не найдена' })
  // @ApiResponse({ status: 403, description: 'Нет прав для обновления команды' })
  updateTeam(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTeamDto: UpdateTeamDto,
    @Request() req,
  ) {
    return this.teams.updateTeam(id, updateTeamDto, req.user.id, req.user.role);
  }

  @Patch(':id/leader')
  @Roles(Role.ADMIN)
  // @ApiOperation({ summary: 'Назначить лидера команды' })
  // @ApiResponse({ status: 200, description: 'Лидер успешно назначен' })
  // @ApiResponse({ status: 404, description: 'Команда или пользователь не найден' })
  // @ApiResponse({ status: 400, description: 'Пользователь не может быть лидером' })
  assignLeader(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignLeaderDto: AssignLeaderDto,
    @Request() req,
  ) {
    return this.teams.assignLeader(id, assignLeaderDto.leaderId, req.user.id);
  }

  @Delete(':id/leader')
  @Roles(Role.ADMIN)
  // @ApiOperation({ summary: 'Снять лидера команды' })
  // @ApiResponse({ status: 200, description: 'Лидер успешно снят' })
  // @ApiResponse({ status: 404, description: 'Команда не найдена' })
  // @ApiResponse({ status: 400, description: 'У команды нет лидера' })
  removeLeader(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.teams.removeLeader(id, req.user.id);
  }

  @Post(':id/members')
  @Roles(Role.ADMIN, Role.TEAM_LEADER)
  // @ApiOperation({ summary: 'Добавить участника в команду' })
  // @ApiResponse({ status: 201, description: 'Участник добавлен в команду' })
  // @ApiResponse({ status: 400, description: 'Ошибка при добавлении участника' })
  addMember(
    @Param('id', ParseIntPipe) id: number,
    @Body() addMemberDto: AddMemberDto,
    @Request() req,
  ) {
    return this.teams.addMemberToTeam(
      id,
      addMemberDto.userId,
      req.user.id,
      req.user.role,
    );
  }

  @Delete(':id/members/:userId')
  @Roles(Role.ADMIN, Role.TEAM_LEADER)
  // @ApiOperation({ summary: 'Удалить участника из команды' })
  // @ApiResponse({ status: 200, description: 'Участник удален из команды' })
  // @ApiResponse({ status: 404, description: 'Участник не найден в команде' })
  // @ApiResponse({ status: 403, description: 'Нет прав для удаления участника' })
  async removeMember(
    @Param('id', ParseIntPipe) teamId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Request() req,
  ) {
    return this.teams.removeMember(teamId, userId, req.user.id, req.user.role);
  }

  @Post('transfer')
  @Roles(Role.ADMIN, Role.TEAM_LEADER)
  // @ApiOperation({ summary: 'Перевести участника между командами' })
  // @ApiResponse({ status: 200, description: 'Участник успешно переведен' })
  // @ApiResponse({ status: 400, description: 'Ошибка при переводе участника' })
  // @ApiResponse({ status: 403, description: 'Нет прав для перевода участника' })
  transferMember(@Body() transferMemberDto: TransferMemberDto, @Request() req) {
    return this.teams.transferMemberBetweenTeams(
      transferMemberDto.userId,
      transferMemberDto.fromTeamId,
      transferMemberDto.toTeamId,
      req.user.id,
      req.user.role,
    );
  }

  @Get(':id/history')
  @Roles(Role.ADMIN, Role.TEAM_LEADER)
  // @ApiOperation({ summary: 'Получить историю участников команды' })
  // @ApiResponse({ status: 200, description: 'История команды получена' })
  // @ApiResponse({ status: 404, description: 'Команда не найдена' })
  getTeamHistory(
    @Param('id', ParseIntPipe) id: number,
    @Query() filters: TeamHistoryFilterDto,
  ) {
    return this.teams.getTeamHistory(id);
  }

  @Get('user/:userId/active-team')
  @Roles(
    Role.ADMIN,
    Role.TEAM_LEADER,
    Role.USER,
  )
  // @ApiOperation({ summary: 'Получить активную команду пользователя' })
  // @ApiResponse({ status: 200, description: 'Активная команда пользователя получена' })
  getUserActiveTeam(
    @Param('userId', ParseIntPipe) userId: number,
    @Request() req,
  ) {
    // Проверяем права доступа - пользователь может смотреть только свою команду, если он не администратор
    if (req.user.role === Role.USER && req.user.id !== userId) {
      throw new ForbiddenException(
        'Нет прав для просмотра команды другого пользователя',
      );
    }
    return this.teams.getUserActiveTeam(userId);
  }

  // Оставляем старые методы для совместимости
  @Post('create')
  @Roles(Role.ADMIN)
  // @ApiOperation({ summary: 'Создать команду (устаревший метод)' })
  create(@Body() createTeamDto: CreateTeamDto) {
    return this.teams.create(createTeamDto);
  }

  @Get('list')
  @Roles(
    Role.ADMIN,
    Role.TEAM_LEADER,
    Role.USER,
  )
  // @ApiOperation({ summary: 'Получить список команд (устаревший метод)' })
  list(@Request() req) {
    return this.teams.getTeamsForUser(req.user.id, req.user.role);
  }

  @Get('detail/:id')
  @Roles(
    Role.ADMIN,
    Role.TEAM_LEADER,
    Role.USER,
  )
  // @ApiOperation({ summary: 'Получить детали команды (устаревший метод)' })
  detail(@Param('id', ParseIntPipe) id: number) {
    return this.teams.getTeamMembers(id);
  }

  @Post('assign/:teamId')
  @Roles(Role.ADMIN, Role.TEAM_LEADER)
  // @ApiOperation({ summary: 'Назначить пользователя в команду (устаревший метод)' })
  assign(
    @Param('teamId', ParseIntPipe) teamId: number,
    @Body() assignUserDto: AssignUserDto,
  ) {
    return this.teams.assignUser(teamId, assignUserDto.userId);
  }
}
