import {
  Controller,
  Post,
  Get,
  Patch,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { multerConfig } from '../common/config/multer.config';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, TaskStatus } from '@prisma/client';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dtos/create-task.dto';
import { UpdateTaskDto } from './dtos/update-task.dto';
import { UpdateStatusDto } from './dtos/update-status.dto';
import { FilterTasksDto } from './dtos/filter-tasks.dto';
import { BulkUpdateStatusDto, BulkAssignDto, BulkDeleteDto, AddDependencyDto } from './dtos/bulk-operations.dto';
import { User } from '../common/decorators/user.decorator';

@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
  constructor(private tasks: TasksService) {}

  @Post()
  @Roles(Role.ADMIN, Role.TEAM_LEADER, Role.USER)
  create(@Body() dto: CreateTaskDto, @User() user) {
    return this.tasks.create(dto, user);
  }

  @Get()
  @Roles(Role.ADMIN, Role.TEAM_LEADER, Role.USER)
  list(@User() user) {
    return this.tasks.findAll(user);
  }

  @Get('filtered')
  @Roles(Role.ADMIN, Role.TEAM_LEADER, Role.USER)
  listWithFilters(@Query() filters: FilterTasksDto, @User() user) {
    return this.tasks.findAllWithFilters(user, filters);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.TEAM_LEADER, Role.USER)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTaskDto,
    @User() user,
  ) {
    return this.tasks.update(id, dto, user);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.TEAM_LEADER, Role.USER)
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusDto,
    @User() user,
  ) {
    return this.tasks.updateStatus(id, dto, user);
  }

  @Get(':id/details')
  @Roles(Role.ADMIN, Role.TEAM_LEADER, Role.USER)
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @User() user,
  ) {
    return this.tasks.findOne(id, user);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.TEAM_LEADER, Role.USER)
  delete(
    @Param('id', ParseIntPipe) id: number,
    @User() user,
  ) {
    return this.tasks.delete(id, user);
  }

  @Post(':id/attachments')
  @Roles(Role.ADMIN, Role.TEAM_LEADER, Role.USER)
  @UseInterceptors(FileInterceptor('file', multerConfig))
  uploadAttachment(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @User() user,
  ) {
    return this.tasks.uploadAttachment(id, file, user);
  }

  @Post(':id/attachments/multiple')
  @Roles(Role.ADMIN, Role.TEAM_LEADER, Role.USER)
  @UseInterceptors(FilesInterceptor('files', 5, multerConfig))
  uploadMultipleAttachments(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: Express.Multer.File[],
    @User() user,
  ) {
    return this.tasks.uploadMultipleAttachments(id, files, user);
  }

  @Delete(':id/attachments/:attachmentId')
  @Roles(Role.ADMIN, Role.TEAM_LEADER, Role.USER)
  deleteAttachment(
    @Param('id', ParseIntPipe) id: number,
    @Param('attachmentId', ParseIntPipe) attachmentId: number,
    @User() user,
  ) {
    return this.tasks.deleteAttachment(id, attachmentId, user);
  }

  @Get(':id/activity')
  @Roles(Role.ADMIN, Role.TEAM_LEADER, Role.USER)
  getActivity(
    @Param('id', ParseIntPipe) id: number,
    @User() user,
  ) {
    return this.tasks.getActivity(id, user);
  }

  // Новые endpoints согласно технической архитектуре
  
  @Post('bulk/status')
  @Roles(Role.ADMIN, Role.TEAM_LEADER, Role.USER)
  async bulkUpdateStatus(
    @Body() bulkUpdateDto: BulkUpdateStatusDto,
    @User() user
  ) {
    return this.tasks.bulkUpdateStatus(bulkUpdateDto.taskIds, bulkUpdateDto.status, user);
  }

  @Post('bulk/assign')
  @Roles(Role.ADMIN, Role.TEAM_LEADER)
  async bulkAssign(
    @Body() bulkAssignDto: BulkAssignDto,
    @User() user
  ) {
    return this.tasks.bulkAssign(bulkAssignDto.taskIds, bulkAssignDto.assigneeId, user);
  }

  @Post('bulk/delete')
  @Roles(Role.ADMIN, Role.TEAM_LEADER)
  async bulkDelete(
    @Body() bulkDeleteDto: BulkDeleteDto,
    @User() user
  ) {
    return this.tasks.bulkDelete(bulkDeleteDto.taskIds, user);
  }

  @Get('subtasks/:id')
  @Roles(Role.ADMIN, Role.TEAM_LEADER, Role.USER)
  async getSubtasks(@Param('id', ParseIntPipe) id: number, @User() user) {
    return this.tasks.getSubtasks(id, user);
  }

  @Get('dependencies/:id')
  @Roles(Role.ADMIN, Role.TEAM_LEADER, Role.USER)
  async getDependencies(@Param('id', ParseIntPipe) id: number, @User() user) {
    return this.tasks.getDependencies(id, user);
  }

  @Post(':id/dependencies')
  @Roles(Role.ADMIN, Role.TEAM_LEADER, Role.USER)
  async addDependency(
    @Param('id', ParseIntPipe) id: number,
    @Body() dependencyDto: AddDependencyDto,
    @User() user
  ) {
    return this.tasks.addDependency(id, dependencyDto.dependsOnId, user);
  }

  @Delete(':id/dependencies/:dependencyId')
  @Roles(Role.ADMIN, Role.TEAM_LEADER, Role.USER)
  async removeDependency(
    @Param('id', ParseIntPipe) id: number,
    @Param('dependencyId', ParseIntPipe) dependencyId: number,
    @User() user
  ) {
    return this.tasks.removeDependency(id, dependencyId, user);
  }
}
