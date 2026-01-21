import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics - Admin')
@Controller('analytics/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@ApiBearerAuth()
export class AnalyticsAdminController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // ============================================
  // GLOBAL STATISTICS
  // ============================================

  @Get('global')
  @ApiOperation({
    summary: 'Get global analytics statistics (Admin)',
    description:
      'Get comprehensive global statistics about app usage across all children',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Number of days to include in statistics (default: 30)',
    example: 30,
  })
  @ApiResponse({
    status: 200,
    description: 'Global analytics statistics',
  })
  async getGlobalStats(@Query('days') days?: string) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.analyticsService.getGlobalStats(daysNum);
  }

  // ============================================
  // CHILD ANALYTICS
  // ============================================

  @Get(':childId')
  @ApiOperation({
    summary: 'Get child analytics (Admin)',
    description: 'Get detailed analytics for a specific child',
  })
  @ApiParam({
    name: 'childId',
    description: 'Child profile ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Number of days to include (default: 30)',
    example: 30,
  })
  @ApiResponse({
    status: 200,
    description: 'Child analytics data',
  })
  @ApiResponse({
    status: 404,
    description: 'Child profile not found',
  })
  async getChildAnalytics(
    @Param('childId', ParseUUIDPipe) childId: string,
    @Query('days') days?: string,
  ) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.analyticsService.getChildAnalyticsAdmin(childId, daysNum);
  }

  // ============================================
  // DAILY USAGE
  // ============================================

  @Get(':childId/daily')
  @ApiOperation({
    summary: 'Get daily usage for child (Admin)',
    description: 'Get daily usage data for a specific child',
  })
  @ApiParam({
    name: 'childId',
    description: 'Child profile ID',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Number of days (alternative to date range)',
    example: 30,
  })
  @ApiResponse({
    status: 200,
    description: 'Daily usage data',
  })
  async getDailyUsage(
    @Param('childId', ParseUUIDPipe) childId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('days') days?: string,
  ) {
    // If days is provided, calculate date range
    if (days && !startDate && !endDate) {
      const daysNum = parseInt(days, 10);
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - daysNum);

      return this.analyticsService.getDailyUsageRange(
        childId,
        start.toISOString().split('T')[0],
        end.toISOString().split('T')[0],
      );
    }

    // If date range is provided
    if (startDate && endDate) {
      return this.analyticsService.getDailyUsageRange(childId, startDate, endDate);
    }

    // Default: last 30 days
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);

    return this.analyticsService.getDailyUsageRange(
      childId,
      start.toISOString().split('T')[0],
      end.toISOString().split('T')[0],
    );
  }

  // ============================================
  // WEEKLY REPORTS
  // ============================================

  @Get(':childId/weekly')
  @ApiOperation({
    summary: 'Get weekly reports for child (Admin)',
    description: 'Get weekly reports for a specific child',
  })
  @ApiParam({
    name: 'childId',
    description: 'Child profile ID',
  })
  @ApiQuery({
    name: 'weeks',
    required: false,
    description: 'Number of weeks to include (default: 4)',
    example: 4,
  })
  @ApiResponse({
    status: 200,
    description: 'Weekly reports data',
  })
  async getWeeklyReports(
    @Param('childId', ParseUUIDPipe) childId: string,
    @Query('weeks') weeks?: string,
  ) {
    const weeksNum = weeks ? parseInt(weeks, 10) : 4;
    return this.analyticsService.getWeeklyReportsAdmin(childId, weeksNum);
  }

  // ============================================
  // FULL REPORT
  // ============================================

  @Get(':childId/report')
  @ApiOperation({
    summary: 'Get full report for child (Admin)',
    description: 'Get complete analytics report for a specific child',
  })
  @ApiParam({
    name: 'childId',
    description: 'Child profile ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Full analytics report',
  })
  async getFullReport(@Param('childId', ParseUUIDPipe) childId: string) {
    return this.analyticsService.getFullReport(childId);
  }
}
