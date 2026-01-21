import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { ChildrenProfilesService } from './children-profiles.service';
import { UpdateChildProfileDto } from './dto';

@ApiTags('Children Profiles - Admin')
@Controller('children-profiles/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@ApiBearerAuth()
export class ChildrenProfilesAdminController {
  constructor(
    private readonly childrenProfilesService: ChildrenProfilesService,
  ) {}

  // ============================================
  // LIST ALL PROFILES
  // ============================================

  @Get()
  @ApiOperation({
    summary: 'List all children profiles (Admin)',
    description: 'Get all children profiles with filters and pagination',
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
    name: 'search',
    required: false,
    description: 'Search by child name',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    description: 'Filter by parent user ID',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Sort field',
    example: 'createdAt',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
  })
  @ApiResponse({
    status: 200,
    description: 'List of children profiles',
  })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('userId') userId?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    return this.childrenProfilesService.findAllAdmin({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      search,
      userId,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'DESC',
    });
  }

  // ============================================
  // GET STATISTICS
  // ============================================

  @Get('stats')
  @ApiOperation({
    summary: 'Get children profiles statistics (Admin)',
    description: 'Get comprehensive statistics about children profiles',
  })
  @ApiResponse({
    status: 200,
    description: 'Children profiles statistics',
  })
  async getStats() {
    return this.childrenProfilesService.getStats();
  }

  // ============================================
  // GET PROFILE BY ID
  // ============================================

  @Get(':id')
  @ApiOperation({
    summary: 'Get child profile by ID (Admin)',
    description: 'Get detailed child profile information',
  })
  @ApiParam({
    name: 'id',
    description: 'Child profile ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Child profile found',
  })
  @ApiResponse({
    status: 404,
    description: 'Child profile not found',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.childrenProfilesService.findByIdWithParent(id);
  }

  // ============================================
  // GET PROFILES BY USER
  // ============================================

  @Get('user/:userId')
  @ApiOperation({
    summary: 'Get profiles by parent user ID (Admin)',
    description: 'Get all children profiles for a specific parent',
  })
  @ApiParam({
    name: 'userId',
    description: 'Parent user ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'List of children profiles for the user',
  })
  async findByUser(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.childrenProfilesService.findAllByParentIncludeInactive(userId);
  }

  // ============================================
  // UPDATE PROFILE (ADMIN)
  // ============================================

  @Put(':id')
  @ApiOperation({
    summary: 'Update child profile (Admin)',
    description: 'Update a child profile by ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Child profile ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: UpdateChildProfileDto })
  @ApiResponse({
    status: 200,
    description: 'Child profile updated',
  })
  @ApiResponse({
    status: 404,
    description: 'Child profile not found',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateChildProfileDto,
  ) {
    return this.childrenProfilesService.updateAdmin(id, dto);
  }

  // ============================================
  // DELETE PROFILE (HARD DELETE)
  // ============================================

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete child profile permanently (Super Admin)',
    description: 'Permanently delete a child profile (hard delete)',
  })
  @ApiParam({
    name: 'id',
    description: 'Child profile ID',
  })
  @ApiResponse({
    status: 204,
    description: 'Child profile deleted permanently',
  })
  @ApiResponse({
    status: 404,
    description: 'Child profile not found',
  })
  async hardDelete(@Param('id', ParseUUIDPipe) id: string) {
    await this.childrenProfilesService.hardDelete(id);
  }
}
