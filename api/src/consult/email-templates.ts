export function sessionConfirmedUserEmail(data: {
  userName: string;
  coachName: string;
  scheduledAt: Date;
  durationMin: number;
  meetingUrl: string;
  sessionId: string;
}) {
  const date = data.scheduledAt.toLocaleDateString('ar-SA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const time = data.scheduledAt.toLocaleTimeString('ar-SA', {
    hour: '2-digit', minute: '2-digit',
  });

  return /* html */`
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f4f8; margin: 0; padding: 24px; direction: rtl; }
  .card { background: #fff; border-radius: 16px; max-width: 560px; margin: 0 auto; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #0a1628 0%, #1a2d4a 100%); padding: 32px 28px; text-align: center; }
  .logo { color: #2EC5B6; font-size: 28px; font-weight: 900; letter-spacing: 2px; }
  .tagline { color: rgba(255,255,255,0.6); font-size: 13px; margin-top: 4px; }
  .body { padding: 32px 28px; }
  .greeting { font-size: 18px; font-weight: 700; color: #0a1628; margin-bottom: 8px; }
  .sub { color: #64748b; font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
  .info-card { background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
  .info-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
  .info-row:last-child { border-bottom: none; }
  .info-label { color: #94a3b8; font-size: 13px; }
  .info-value { color: #0f172a; font-size: 14px; font-weight: 600; }
  .meeting-btn { display: block; background: linear-gradient(135deg, #2EC5B6, #1a9e91); color: #fff; text-decoration: none; text-align: center; padding: 16px 24px; border-radius: 12px; font-size: 16px; font-weight: 700; margin: 24px 0; }
  .meeting-url { background: #f1f5f9; border-radius: 8px; padding: 12px 16px; font-size: 12px; color: #475569; word-break: break-all; margin-bottom: 24px; }
  .footer { background: #f8fafc; padding: 20px 28px; text-align: center; color: #94a3b8; font-size: 12px; }
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <div class="logo">KHALA</div>
    <div class="tagline">منصة التطوير الذاتي</div>
  </div>
  <div class="body">
    <div class="greeting">مرحباً ${data.userName} 👋</div>
    <div class="sub">تم تأكيد جلستك الاستشارية مع المدرب <strong>${data.coachName}</strong>. إليك تفاصيل الجلسة:</div>

    <div class="info-card">
      <div class="info-row">
        <span class="info-label">المدرب</span>
        <span class="info-value">${data.coachName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">التاريخ</span>
        <span class="info-value">${date}</span>
      </div>
      <div class="info-row">
        <span class="info-label">الوقت</span>
        <span class="info-value">${time}</span>
      </div>
      <div class="info-row">
        <span class="info-label">المدة</span>
        <span class="info-value">${data.durationMin} دقيقة</span>
      </div>
      <div class="info-row">
        <span class="info-label">رقم الجلسة</span>
        <span class="info-value" style="font-size:11px;color:#94a3b8">${data.sessionId}</span>
      </div>
    </div>

    <a class="meeting-btn" href="${data.meetingUrl}">انضم إلى الجلسة الآن</a>

    <div style="color:#64748b;font-size:13px;margin-bottom:8px;">أو انسخ هذا الرابط:</div>
    <div class="meeting-url">${data.meetingUrl}</div>

    <p style="color:#94a3b8;font-size:12px;line-height:1.6">
      احتفظ بهذا الرابط. يمكنك فتحه في أي متصفح دون الحاجة لتثبيت أي برنامج.
    </p>
  </div>
  <div class="footer">
    © 2025 KHALA Platform · جميع الحقوق محفوظة
  </div>
</div>
</body>
</html>`;
}

export function sessionConfirmedCoachEmail(data: {
  coachName: string;
  userName: string;
  userEmail: string;
  scheduledAt: Date;
  durationMin: number;
  meetingUrl: string;
  notesAr?: string;
}) {
  const date = data.scheduledAt.toLocaleDateString('ar-SA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const time = data.scheduledAt.toLocaleTimeString('ar-SA', {
    hour: '2-digit', minute: '2-digit',
  });

  return /* html */`
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f4f8; margin: 0; padding: 24px; direction: rtl; }
  .card { background: #fff; border-radius: 16px; max-width: 560px; margin: 0 auto; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #0a1628 0%, #1a2d4a 100%); padding: 32px 28px; text-align: center; }
  .logo { color: #2EC5B6; font-size: 28px; font-weight: 900; letter-spacing: 2px; }
  .tagline { color: rgba(255,255,255,0.6); font-size: 13px; margin-top: 4px; }
  .body { padding: 32px 28px; }
  .greeting { font-size: 18px; font-weight: 700; color: #0a1628; margin-bottom: 8px; }
  .sub { color: #64748b; font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
  .alert { background: #ecfdf5; border: 1.5px solid #6ee7b7; border-radius: 12px; padding: 16px 20px; margin-bottom: 20px; color: #065f46; font-size: 14px; font-weight: 600; }
  .info-card { background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
  .info-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
  .info-row:last-child { border-bottom: none; }
  .info-label { color: #94a3b8; font-size: 13px; }
  .info-value { color: #0f172a; font-size: 14px; font-weight: 600; }
  .meeting-btn { display: block; background: linear-gradient(135deg, #2EC5B6, #1a9e91); color: #fff; text-decoration: none; text-align: center; padding: 16px 24px; border-radius: 12px; font-size: 16px; font-weight: 700; margin: 24px 0; }
  .meeting-url { background: #f1f5f9; border-radius: 8px; padding: 12px 16px; font-size: 12px; color: #475569; word-break: break-all; margin-bottom: 24px; }
  .notes { background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; }
  .footer { background: #f8fafc; padding: 20px 28px; text-align: center; color: #94a3b8; font-size: 12px; }
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <div class="logo">KHALA</div>
    <div class="tagline">لوحة المدربين</div>
  </div>
  <div class="body">
    <div class="alert">📅 لديك جلسة جديدة مع متدرب!</div>
    <div class="greeting">مرحباً ${data.coachName}</div>
    <div class="sub">قام <strong>${data.userName}</strong> بحجز جلسة استشارية معك. إليك التفاصيل:</div>

    <div class="info-card">
      <div class="info-row">
        <span class="info-label">المتدرب</span>
        <span class="info-value">${data.userName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">البريد الإلكتروني</span>
        <span class="info-value" style="font-size:13px">${data.userEmail}</span>
      </div>
      <div class="info-row">
        <span class="info-label">التاريخ</span>
        <span class="info-value">${date}</span>
      </div>
      <div class="info-row">
        <span class="info-label">الوقت</span>
        <span class="info-value">${time}</span>
      </div>
      <div class="info-row">
        <span class="info-label">المدة</span>
        <span class="info-value">${data.durationMin} دقيقة</span>
      </div>
    </div>

    ${data.notesAr ? `<div class="notes"><strong>ملاحظات المتدرب:</strong><br><br>${data.notesAr}</div>` : ''}

    <a class="meeting-btn" href="${data.meetingUrl}">انضم إلى الجلسة الآن</a>

    <div style="color:#64748b;font-size:13px;margin-bottom:8px;">رابط الاجتماع:</div>
    <div class="meeting-url">${data.meetingUrl}</div>
  </div>
  <div class="footer">
    © 2025 KHALA Platform · جميع الحقوق محفوظة
  </div>
</div>
</body>
</html>`;
}
