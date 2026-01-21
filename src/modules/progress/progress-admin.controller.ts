import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
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
import { ProgressService } from './progress.service';

@ApiTags('Progress - Admin')
@Controller('progress/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@ApiBearerAuth()
export class ProgressAdminController {
  constructor(private readonly progressService: ProgressService) {}

  // ============================================
  // GLOBAL STATISTICS
  // ============================================

  @Get('stats')
  @ApiOperation({
    summary: 'Get global progress statistics (Admin)',
    description: 'Get comprehensive statistics about learning progress across all children',
  })
  @ApiResponse({
    status: 200,
    description: 'Global progress statistics',
  })
  async getGlobalStats() {
    return this.progressService.getGlobalProgressStats();
  }

  // ============================================
  // LIST ALL PROGRESS ENTRIES
  // ============================================

  @Get()
  @ApiOperation({
    summary: 'List all progress entries (Admin)',
    description: 'Get all learning progress entries with filters and pagination',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (1-based)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    example: 10,
  })
  @ApiQuery({
    name: 'childProfileId',
    required: false,
    description: 'Filter by child profile ID',
  })
  @ApiQuery({
    name: 'elementType',
    required: false,
    description: 'Filter by element type (letter, syllable, word)',
    enum: ['letter', 'syllable', 'word'],
  })
  @ApiQuery({
    name: 'masteryLevel',
    required: false,
    description: 'Filter by mastery level',
    enum: ['not_started', 'learning', 'practicing', 'mastered'],
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Sort field',
    example: 'lastPracticedAt',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
  })
  @ApiResponse({
    status: 200,
    description: 'List of progress entries',
  })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('childProfileId') childProfileId?: string,
    @Query('elementType') elementType?: string,
    @Query('masteryLevel') masteryLevel?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    return this.progressService.findAllAdmin({
      page,
      limit,
      childProfileId,
      elementType,
      masteryLevel,
      sortBy: sortBy || 'lastPracticedAt',
      sortOrder: sortOrder || 'DESC',
    });
  }

  // ============================================
  // LIST ALL SESSIONS
  // ============================================

  @Get('sessions')
  @ApiOperation({
    summary: 'List all learning sessions (Admin)',
    description: 'Get all learning sessions with filters and pagination',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (1-based)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    example: 10,
  })
  @ApiQuery({
    name: 'childProfileId',
    required: false,
    description: 'Filter by child profile ID',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Sort field',
    example: 'sessionDate',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
  })
  @ApiResponse({
    status: 200,
    description: 'List of learning sessions',
  })
  async findAllSessions(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('childProfileId') childProfileId?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    return this.progressService.findAllSessionsAdmin({
      page,
      limit,
      childProfileId,
      sortBy: sortBy || 'sessionDate',
      sortOrder: sortOrder || 'DESC',
    });
  }

  // ============================================
  // GET CHILD PROGRESS SUMMARY (ADMIN)
  // ============================================

  @Get('child/:id/summary')
  @ApiOperation({
    summary: 'Get child progress summary (Admin)',
    description: 'Get complete progress summary for a specific child profile',
  })
  @ApiParam({
    name: 'id',
    description: 'Child profile ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Child progress summary',
  })
  @ApiResponse({
    status: 404,
    description: 'Child profile not found',
  })
  async getChildProgressSummary(@Param('id', ParseUUIDPipe) id: string) {
    return this.progressService.getProgressSummaryAdmin(id);
  }

  // ============================================
  // GET CHILD LEVEL (ADMIN)
  // ============================================

  @Get('child/:id/level')
  @ApiOperation({
    summary: 'Get child level (Admin)',
    description: 'Get level information for a specific child profile',
  })
  @ApiParam({
    name: 'id',
    description: 'Child profile ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Child level information',
  })
  @ApiResponse({
    status: 404,
    description: 'Child profile not found',
  })
  async getChildLevel(@Param('id', ParseUUIDPipe) id: string) {
    return this.progressService.getChildLevelAdmin(id);
  }

  // ============================================
  // GET CHILD WEEKLY ACTIVITY (ADMIN)
  // ============================================

  @Get('child/:id/weekly-activity')
  @ApiOperation({
    summary: 'Get child weekly activity (Admin)',
    description: 'Get weekly activity for a specific child profile',
  })
  @ApiParam({
    name: 'id',
    description: 'Child profile ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Weekly activity data',
  })
  @ApiResponse({
    status: 404,
    description: 'Child profile not found',
  })
  async getChildWeeklyActivity(@Param('id', ParseUUIDPipe) id: string) {
    return this.progressService.getWeeklyActivityAdmin(id);
  }

  // ============================================
  // GET CHILD SESSION HISTORY (ADMIN)
  // ============================================

  @Get('child/:id/sessions')
  @ApiOperation({
    summary: 'Get child session history (Admin)',
    description: 'Get session history for a specific child profile',
  })
  @ApiParam({
    name: 'id',
    description: 'Child profile ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Session history',
  })
  @ApiResponse({
    status: 404,
    description: 'Child profile not found',
  })
  async getChildSessionHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.progressService.getSessionHistoryAdmin(id, page, limit);
  }

  // ============================================
  // GET CHILD LETTERS PROGRESS (ADMIN)
  // ============================================

  @Get('child/:id/letters')
  @ApiOperation({
    summary: 'Get child letters progress (Admin)',
    description: 'Get letters progress for a specific child profile',
  })
  @ApiParam({
    name: 'id',
    description: 'Child profile ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Letters progress data',
  })
  @ApiResponse({
    status: 404,
    description: 'Child profile not found',
  })
  async getChildLettersProgress(@Param('id', ParseUUIDPipe) id: string) {
    return this.progressService.getLettersProgressAdmin(id);
  }

  // ============================================
  // GET CHILD TIMELINE (ADMIN)
  // ============================================

  @Get('child/:id/timeline')
  @ApiOperation({
    summary: 'Get child timeline (Admin)',
    description: 'Get achievement timeline for a specific child profile',
  })
  @ApiParam({
    name: 'id',
    description: 'Child profile ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum events to return',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'Timeline events',
  })
  @ApiResponse({
    status: 404,
    description: 'Child profile not found',
  })
  async getChildTimeline(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.progressService.getTimelineAdmin(id, limit);
  }
}
