import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';

export const PERMISSIONS_KEY = 'required_permissions';

// Method/class level permission requirement. Method level overrides class level.
// The user needs ALL listed permissions; ADMIN role always passes.
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

// Put on a controller: authenticates the school user (JWT) and enforces
// @RequirePermissions. Optional permissions apply to every route in the class.
export const TenantAuth = (...permissions: string[]) =>
  applyDecorators(
    UseGuards(JwtAuthGuard, PermissionsGuard),
    ApiBearerAuth('JWT-auth'),
    ApiUnauthorizedResponse({ description: 'Missing or invalid token' }),
    ApiForbiddenResponse({ description: 'Missing permission' }),
    ...(permissions.length ? [RequirePermissions(...permissions)] : []),
  );
