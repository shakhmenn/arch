import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Query,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dtos/create-comment.dto';
import { UpdateCommentDto } from './dtos/update-comment.dto';
import { User } from '../common/decorators/user.decorator';

@Controller('comments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommentsController {
  constructor(private readonly comments: CommentsService) {}

  // Создать комментарий
  @Post()
  @Roles(Role.ADMIN, Role.TEAM_LEADER, Role.USER)
  create(@Body() dto: CreateCommentDto, @User() user) {
    return this.comments.create(dto, user);
  }

  // Получить комментарии задачи
  @Get()
  @Roles(Role.ADMIN, Role.TEAM_LEADER, Role.USER)
  list(@Query('taskId', ParseIntPipe) taskId: number, @User() user) {
    return this.comments.findByTask(taskId, user);
  }

  // Обновить комментарий
  @Put(':id')
  @Roles(Role.ADMIN, Role.TEAM_LEADER, Role.USER)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCommentDto,
    @User() user,
  ) {
    return this.comments.update(id, dto.body, user);
  }

  // Удалить комментарий
  @Delete(':id')
  @Roles(Role.ADMIN, Role.TEAM_LEADER, Role.USER)
  delete(@Param('id', ParseIntPipe) id: number, @User() user) {
    return this.comments.delete(id, user);
  }
}
