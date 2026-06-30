import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // ── App ─────────────────────────────────────────────────────────────────
  const qader = await prisma.app.upsert({
    where: { key: 'qader' },
    create: {
      key: 'qader',
      nameAr: 'قادر',
      nameEn: 'Qader',
      themeJson: { brand: '#2EC5B6', mode: 'dark' },
    },
    update: {},
  });

  // ── Plans ────────────────────────────────────────────────────────────────
  const planDefs = [
    {
      code: 'individual_monthly',
      nameAr: 'الأفراد',
      audience: 'individual',
      priceMinor: 3900,
      features: ['ai_mentor', 'library_premium', 'community', 'challenges'],
    },
    {
      code: 'trainer_family_monthly',
      nameAr: 'المدربين والمعلمين والعائلات',
      audience: 'trainer_family',
      priceMinor: 9900,
      features: ['ai_mentor', 'library_premium', 'community', 'challenges', 'consult_1on1'],
    },
    {
      code: 'organization_monthly',
      nameAr: 'المؤسسات',
      audience: 'organization',
      priceMinor: 29900,
      features: ['ai_mentor', 'library_premium', 'community', 'challenges', 'consult_1on1'],
    },
  ];

  for (const p of planDefs) {
    await prisma.plan.upsert({
      where: { appId_code: { appId: qader.id, code: p.code } },
      create: {
        appId: qader.id,
        code: p.code,
        nameAr: p.nameAr,
        audience: p.audience,
        priceMinor: p.priceMinor,
        currency: 'OMR',
        interval: 'month',
        featuresJson: p.features,
      },
      update: {},
    });
  }

  // ── Library Assets ────────────────────────────────────────────────────────
  const libraryItems = [
    { type: 'video', titleAr: 'مقدمة في بناء الثقة بالنفس', url: 'https://example.com/vid/1', duration: 720, isDownloadable: false, requiredEntitlement: null },
    { type: 'video', titleAr: 'تقنيات التنفس وإدارة القلق', url: 'https://example.com/vid/2', duration: 480, isDownloadable: false, requiredEntitlement: null },
    { type: 'video', titleAr: 'مهارات التواصل الفعّال', url: 'https://example.com/vid/3', duration: 1020, isDownloadable: false, requiredEntitlement: 'library_premium' },
    { type: 'video', titleAr: 'القيادة بالذكاء العاطفي', url: 'https://example.com/vid/4', duration: 1380, isDownloadable: false, requiredEntitlement: 'library_premium' },
    { type: 'pdf', titleAr: 'دليل إدارة الوقت بفعالية', url: 'https://example.com/pdf/1', isDownloadable: true, requiredEntitlement: null },
    { type: 'pdf', titleAr: 'كتاب مهارات التفاوض', url: 'https://example.com/pdf/2', isDownloadable: true, requiredEntitlement: 'library_premium' },
    { type: 'material', titleAr: 'تمرين: خريطة أهدافي الحياتية', url: 'https://example.com/ex/1', isDownloadable: true, requiredEntitlement: null },
    { type: 'material', titleAr: 'تمرين التأمل اليومي ٥ دقائق', url: 'https://example.com/ex/2', isDownloadable: false, requiredEntitlement: null },
    { type: 'material', titleAr: 'ورقة عمل: تحليل نقاط القوة والضعف', url: 'https://example.com/ex/3', isDownloadable: true, requiredEntitlement: 'library_premium' },
  ];

  for (const item of libraryItems) {
    await prisma.libraryAsset.create({
      data: { appId: qader.id, ...item },
    });
  }

  // ── Community Rooms ────────────────────────────────────────────────────────
  const rooms = [
    { nameAr: 'غرفة النقاش العام', type: 'public', imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&q=80' },
    { nameAr: 'تطوير الذات والإنتاجية', type: 'public', imageUrl: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&q=80' },
    { nameAr: 'القيادة والإدارة', type: 'public', imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&q=80' },
    { nameAr: 'ألعاب تنمية الذكاء', type: 'public', imageUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&q=80' },
    { nameAr: 'المدربون والمعلمون', type: 'public', imageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&q=80' },
  ];

  for (const room of rooms) {
    await prisma.room.create({
      data: { appId: qader.id, ...room },
    });
  }

  // ── Catalog Items ─────────────────────────────────────────────────────────
  const now = new Date();
  const week = 7 * 86400000;

  const catalogItems = [
    {
      type: 'workshop',
      section: 'workshops',
      titleAr: 'ورشة بناء الثقة بالنفس',
      descAr: 'ورشة تفاعلية مكثفة مدتها يومان لبناء الثقة وتطوير المهارات الشخصية من خلال أنشطة عملية وتمارين حياتية.',
      priceMinor: 1500,
      capacity: 30,
      startsAt: new Date(now.getTime() + week),
    },
    {
      type: 'workshop',
      section: 'workshops',
      titleAr: 'ورشة فن الخطابة والإلقاء',
      descAr: 'تعلّم أسرار الخطابة المؤثرة وكيف تقدم نفسك بثقة أمام الجمهور.',
      priceMinor: 2000,
      capacity: 20,
      startsAt: new Date(now.getTime() + 2 * week),
    },
    {
      type: 'program',
      section: 'training',
      titleAr: 'برنامج القيادة الاستراتيجية',
      descAr: 'برنامج تدريبي شامل مدته ٤ أسابيع لتطوير مهارات القيادة والتخطيط الاستراتيجي.',
      priceMinor: 8500,
      capacity: 50,
      startsAt: new Date(now.getTime() + 3 * week),
    },
    {
      type: 'camp',
      section: 'camps',
      titleAr: 'معسكر التحوّل الشخصي ٣٠ يوماً',
      descAr: 'رحلة تحول حقيقية عبر ٣٠ يوماً من التحديات اليومية والمهام المصممة لبناء عادات النجاح.',
      priceMinor: 5900,
      capacity: 100,
      startsAt: new Date(now.getTime() + week),
    },
    {
      type: 'course',
      section: 'self_dev',
      titleAr: 'كورس إدارة الوقت للمحترفين',
      descAr: 'تعلّم أفضل الأساليب العلمية لإدارة وقتك وزيادة إنتاجيتك بشكل مستدام.',
      priceMinor: 3200,
      capacity: null,
      startsAt: null,
    },
    {
      type: 'course',
      section: 'self_dev',
      titleAr: 'كورس الذكاء العاطفي',
      descAr: 'اكتشف كيف يمكن للذكاء العاطفي أن يحسن علاقاتك المهنية والشخصية بشكل ملحوظ.',
      priceMinor: 2800,
      capacity: null,
      startsAt: null,
    },
  ];

  for (const item of catalogItems) {
    await prisma.catalogItem.create({
      data: { appId: qader.id, isPublished: true, currency: 'OMR', ...item },
    });
  }

  // ── Badges ────────────────────────────────────────────────────────────────
  const badges = [
    { code: 'first_step', nameAr: 'الخطوة الأولى', iconUrl: '🌱' },
    { code: 'streak_7', nameAr: 'أسبوع متواصل', iconUrl: '🔥' },
    { code: 'streak_30', nameAr: 'شهر من الانضباط', iconUrl: '🏆' },
    { code: 'library_5', nameAr: 'القارئ النشيط', iconUrl: '📚' },
    { code: 'community_active', nameAr: 'عضو فعّال', iconUrl: '💬' },
    { code: 'tasks_10', nameAr: 'منجز المهام', iconUrl: '✅' },
    { code: 'assessment_done', nameAr: 'اعرف نفسك', iconUrl: '🧠' },
    { code: 'plan_complete', nameAr: 'مكتمل الخطة', iconUrl: '🎯' },
  ];

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { appId_code: { appId: qader.id, code: badge.code } },
      create: { appId: qader.id, ...badge },
      update: {},
    });
  }

  // eslint-disable-next-line no-console
  console.log('✅ Seeded: Qader app, 3 plans, 9 library assets, 5 rooms, 6 catalog items, 8 badges.');
}

main().finally(() => prisma.$disconnect());
