import { Injectable, Logger, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../core/prisma.service';

const JWT_SECRET = process.env.JWT_ACCESS_SECRET || 'change-me-access';
const ADMIN_TTL = Number(process.env.ADMIN_JWT_TTL ?? 60 * 60 * 12); // 12h

@Injectable()
export class AdminService implements OnModuleInit {
  private readonly log = new Logger('AdminService');

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /** Seed a default super-admin on first boot so the panel is usable out of the box. */
  async onModuleInit() {
    const count = await this.prisma.adminUser.count();
    if (count > 0) return;

    const email = process.env.ADMIN_EMAIL ?? 'admin@khala.app';
    const password = process.env.ADMIN_PASSWORD ?? 'admin123';
    const passwordHash = await bcrypt.hash(password, 10);

    await this.prisma.adminUser.create({
      data: { email, passwordHash, name: 'مدير المنصة', role: 'super_admin' },
    });
    this.log.log(`Seeded default super-admin → ${email} / ${password}`);
  }

  async login(email: string, password: string) {
    const admin = await this.prisma.adminUser.findUnique({ where: { email } });
    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    }
    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) throw new UnauthorizedException('بيانات الدخول غير صحيحة');

    await this.prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    const token = await this.jwt.signAsync(
      { sub: admin.id, adm: true, role: admin.role, email: admin.email, name: admin.name },
      { secret: JWT_SECRET, expiresIn: ADMIN_TTL },
    );

    return {
      token,
      user: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
    };
  }

  /** All apps with per-app aggregate statistics for the multi-app overview. */
  async appsWithStats() {
    const apps = await this.prisma.app.findMany({ orderBy: { createdAt: 'asc' } });

    return Promise.all(
      apps.map(async (app) => {
        const [users, rooms, messages, assets, subscriptions, activeSubs] =
          await Promise.all([
            this.prisma.appMembership.count({ where: { appId: app.id } }),
            this.prisma.room.count({ where: { appId: app.id } }),
            this.prisma.message.count({ where: { appId: app.id } }),
            this.prisma.libraryAsset.count({ where: { appId: app.id } }),
            this.prisma.subscription.count({ where: { appId: app.id } }),
            this.prisma.subscription.count({
              where: { appId: app.id, status: { in: ['active', 'trialing'] } },
            }),
          ]);

        return {
          id: app.id,
          key: app.key,
          nameAr: app.nameAr,
          nameEn: app.nameEn,
          status: app.status,
          stats: { users, rooms, messages, assets, subscriptions, activeSubs },
        };
      }),
    );
  }

  // ---- AdminUser management (super_admin only, enforced in controller) ----
  listAdmins() {
    return this.prisma.adminUser.findMany({
      select: { id: true, email: true, name: true, role: true, isActive: true, lastLoginAt: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createAdmin(body: { email: string; password: string; name: string; role?: string }) {
    const passwordHash = await bcrypt.hash(body.password, 10);
    const admin = await this.prisma.adminUser.create({
      data: { email: body.email, passwordHash, name: body.name, role: body.role ?? 'admin' },
    });
    return { id: admin.id, email: admin.email, name: admin.name, role: admin.role, isActive: admin.isActive };
  }

  async updateAdmin(id: string, body: { name?: string; role?: string; isActive?: boolean; password?: string }) {
    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.role !== undefined) data.role = body.role;
    if (body.isActive !== undefined) data.isActive = body.isActive;
    if (body.password) data.passwordHash = await bcrypt.hash(body.password, 10);
    const admin = await this.prisma.adminUser.update({ where: { id }, data });
    return { id: admin.id, email: admin.email, name: admin.name, role: admin.role, isActive: admin.isActive };
  }

  async deleteAdmin(id: string) {
    await this.prisma.adminUser.delete({ where: { id } });
    return { ok: true };
  }
}
