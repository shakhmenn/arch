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
  Query,
} from '@nestjs/common';
import { MetricsService } from './metrics.service';
import {
  CreateMetricValueDto,
  CreateBusinessContextDto,
} from './dto/create-metric.dto';
import {
  UpdateMetricValueDto,
  UpdateBusinessContextDto,
} from './dto/update-metric.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, MetricCategory, MetricPeriodType } from '@prisma/client';

@Controller('metrics')
@UseGuards(JwtAuthGuard)
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  // === METRIC DEFINITIONS ===
  @Get('definitions')
  getMetricDefinitions() {
    return this.metricsService.getMetricDefinitions();
  }

  @Get('definitions/category/:category')
  getMetricDefinitionsByCategory(@Param('category') category: MetricCategory) {
    return this.metricsService.getMetricDefinitionsByCategory(category);
  }

  // === METRIC VALUES ===
  @Post('values')
  createMetricValue(@Request() req, @Body() createDto: CreateMetricValueDto) {
    return this.metricsService.createMetricValue(req.user.id, createDto);
  }

  @Get('values')
  getMetricValues(
    @Request() req,
    @Query('category') category?: MetricCategory,
    @Query('periodType') periodType?: MetricPeriodType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.metricsService.getMetricValues(req.user.id, {
      category,
      periodType,
      startDate,
      endDate,
    });
  }

  @Get('values/:id')
  getMetricValue(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.metricsService.getMetricValue(id, req.user.id);
  }

  @Patch('values/:id')
  updateMetricValue(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body() updateDto: UpdateMetricValueDto,
  ) {
    return this.metricsService.updateMetricValue(id, req.user.id, updateDto);
  }

  @Delete('values/:id')
  deleteMetricValue(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.metricsService.deleteMetricValue(id, req.user.id);
  }

  // === BUSINESS CONTEXT ===
  @Post('business-context')
  createBusinessContext(
    @Request() req,
    @Body() createDto: CreateBusinessContextDto,
  ) {
    return this.metricsService.createBusinessContext(req.user.id, createDto);
  }

  @Get('business-context')
  getBusinessContext(@Request() req) {
    return this.metricsService.getBusinessContext(req.user.id);
  }

  @Patch('business-context')
  updateBusinessContext(
    @Request() req,
    @Body() updateDto: UpdateBusinessContextDto,
  ) {
    return this.metricsService.updateBusinessContext(req.user.id, updateDto);
  }

  // === TASK METRICS ===
  @Get('tasks')
  getTaskMetrics(
    @Request() req,
    @Query('teamId', ParseIntPipe) teamId?: number,
    @Query('projectId', ParseIntPipe) projectId?: number,
  ) {
    return this.metricsService.getTaskMetrics(req.user.id, teamId, projectId);
  }

  @Get('tasks/team/:teamId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.TEAM_LEADER, Role.USER)
  getTeamTaskMetrics(
    @Param('teamId', ParseIntPipe) teamId: number,
    @Request() req,
  ) {
    return this.metricsService.getTeamTaskMetrics(teamId, req.user.id);
  }

  @Get('tasks/project/:projectId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.TEAM_LEADER, Role.USER)
  getProjectTaskMetrics(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Request() req,
  ) {
    return this.metricsService.getProjectTaskMetrics(projectId, req.user.id);
  }

  // === DASHBOARD & ANALYTICS ===
  @Get('dashboard')
  getDashboard(@Request() req) {
    return this.metricsService.getDashboardData(req.user.id);
  }
}
