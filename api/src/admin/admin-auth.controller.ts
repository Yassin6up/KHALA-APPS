import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard, AdminPrincipal } from './admin.guard';
import { AdminService } from './admin.service';

function requireSuperAdmin(req: { admin?: AdminPrincipal }) {
  if (req.admin?.role !== 'super_admin') {
    throw new ForbiddenException('صلاحيات المدير العام مطلوبة');
  }
}

@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly admin: AdminService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() body: { email: string; password: string }) {
    return this.admin.login(body.email, body.password);
  }

  @Get('me')
  @UseGuards(AdminGuard)
  me(@Req() req: { admin: AdminPrincipal }) {
    return req.admin;
  }

  // ---- Admin team management (super_admin only) ----
  @Get('admins')
  @UseGuards(AdminGuard)
  listAdmins(@Req() req: { admin: AdminPrincipal }) {
    requireSuperAdmin(req);
    return this.admin.listAdmins();
  }

  @Post('admins')
  @UseGuards(AdminGuard)
  createAdmin(
    @Req() req: { admin: AdminPrincipal },
    @Body() body: { email: string; password: string; name: string; role?: string },
  ) {
    requireSuperAdmin(req);
    return this.admin.createAdmin(body);
  }

  @Patch('admins/:id')
  @UseGuards(AdminGuard)
  updateAdmin(
    @Req() req: { admin: AdminPrincipal },
    @Param('id') id: string,
    @Body() body: { name?: string; role?: string; isActive?: boolean; password?: string },
  ) {
    requireSuperAdmin(req);
    return this.admin.updateAdmin(id, body);
  }

  @Delete('admins/:id')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  deleteAdmin(@Req() req: { admin: AdminPrincipal }, @Param('id') id: string) {
    requireSuperAdmin(req);
    return this.admin.deleteAdmin(id);
  }
}
