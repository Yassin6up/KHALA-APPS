import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { AppContextGuard } from '../core/app-context.guard';
import { AppId, CurrentUser } from '../core/decorators';
import { JwtAuthGuard } from '../core/jwt-auth.guard';
import { MailService } from '../core/mail.service';
import { PrismaService } from '../core/prisma.service';

class DeletionNoticeDto {
  @IsOptional() @IsIn(['web', 'app']) source?: 'web' | 'app';
  @IsOptional() @IsString() @MaxLength(500) reason?: string;
}

/** Values land in an HTML email, so anything user-controlled gets escaped. */
function esc(value: string | null | undefined): string {
  return String(value ?? '—')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Tells the KHALA team that a user is deleting their account from the public
 * deletion page (docs/delete-account). It must run *before* `DELETE /me`:
 * that endpoint anonymises the record, so afterwards there is no email address
 * left to report. Kept separate from UsersController because it is additive —
 * deleting an account works fine whether or not this endpoint is deployed.
 */
@ApiTags('users')
@ApiSecurity('app-key')
@ApiBearerAuth()
@UseGuards(AppContextGuard, JwtAuthGuard)
@Controller('me')
export class AccountDeletionController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  @Post('deletion-notice')
  @HttpCode(200)
  async deletionNotice(
    @AppId() appId: string,
    @CurrentUser() userId: string,
    @Body() body: DeletionNoticeDto,
  ) {
    const [user, app] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.app.findUnique({ where: { id: appId } }),
    ]);

    const to =
      process.env.DELETION_NOTICE_EMAIL ??
      process.env.ADMIN_EMAIL ??
      'privacy@khalaapps.com';

    const requestedAt = new Date().toLocaleString('ar-EG', { timeZone: 'Asia/Muscat' });

    await this.mail.send(
      to,
      `طلب حذف حساب — ${app?.nameAr ?? appId} — ${user?.email ?? userId}`,
      `
<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;background:#f5f7fb;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e6eaf2">
    <div style="background:#B91C1C;color:#fff;padding:18px 22px">
      <h2 style="margin:0;font-size:18px">🗑️ طلب حذف حساب مُنفَّذ</h2>
    </div>
    <div style="padding:22px">
      <p style="margin:0 0 16px;color:#334">قام المستخدم التالي بحذف حسابه بنفسه عبر صفحة حذف الحساب على الويب. تم تنفيذ الحذف مباشرة على الخادم.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#223">
        <tr><td style="padding:8px 0;color:#889">التطبيق</td><td style="padding:8px 0;font-weight:bold">${esc(app?.nameAr)} (${esc(app?.key)})</td></tr>
        <tr><td style="padding:8px 0;color:#889">البريد الإلكتروني</td><td style="padding:8px 0;font-weight:bold" dir="ltr">${esc(user?.email)}</td></tr>
        <tr><td style="padding:8px 0;color:#889">الاسم</td><td style="padding:8px 0;font-weight:bold">${esc(user?.fullName)}</td></tr>
        <tr><td style="padding:8px 0;color:#889">رقم الهاتف</td><td style="padding:8px 0" dir="ltr">${esc(user?.phone)}</td></tr>
        <tr><td style="padding:8px 0;color:#889">معرّف المستخدم</td><td style="padding:8px 0" dir="ltr">${esc(userId)}</td></tr>
        <tr><td style="padding:8px 0;color:#889">مصدر الطلب</td><td style="padding:8px 0">${esc(body.source ?? 'web')}</td></tr>
        <tr><td style="padding:8px 0;color:#889">وقت الطلب</td><td style="padding:8px 0">${esc(requestedAt)}</td></tr>
      </table>
      ${body.reason ? `<p style="margin:16px 0 0;padding:12px;background:#f7f8fb;border-radius:10px;color:#334"><strong>سبب الحذف:</strong> ${esc(body.reason)}</p>` : ''}
      <p style="margin:18px 0 0;font-size:12.5px;color:#889">رسالة تلقائية من منصة خلا — لا حاجة للرد.</p>
    </div>
  </div>
</div>`,
    );

    return { ok: true };
  }
}
