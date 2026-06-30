import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Seeds the "فرح AI" (Farah) app: smart events & celebrations platform. */
async function main() {
  // ── App ─────────────────────────────────────────────────────────────────
  const farah = await prisma.app.upsert({
    where: { key: 'farah' },
    create: {
      key: 'farah',
      nameAr: 'فرح AI',
      nameEn: 'Farah AI',
      themeJson: { brand: '#E8488B', brand2: '#7C3AED', accent: '#F5B301', mode: 'light' },
    },
    update: { nameAr: 'فرح AI', nameEn: 'Farah AI' },
  });

  // ── Plans / Subscriptions ─────────────────────────────────────────────────
  const planDefs = [
    {
      code: 'farah_premium_monthly',
      nameAr: 'فرح بريميوم',
      audience: 'individual',
      priceMinor: 4900,
      interval: 'month',
      features: ['ai_designer', 'unlimited_events', 'premium_invitations', 'memory_universe', 'smart_gifts'],
    },
    {
      code: 'farah_vip_yearly',
      nameAr: 'عضوية VIP',
      audience: 'individual',
      priceMinor: 49000,
      interval: 'year',
      features: ['ai_designer', 'unlimited_events', 'premium_invitations', 'memory_universe', 'smart_gifts', 'priority_vendors', 'live_streaming', 'concierge'],
    },
    {
      code: 'farah_vendor_monthly',
      nameAr: 'اشتراك مزوّدي الخدمات',
      audience: 'organization',
      priceMinor: 19900,
      interval: 'month',
      features: ['vendor_listing', 'bookings', 'analytics', 'featured_placement'],
    },
  ];

  for (const p of planDefs) {
    await prisma.plan.upsert({
      where: { appId_code: { appId: farah.id, code: p.code } },
      create: {
        appId: farah.id,
        code: p.code,
        nameAr: p.nameAr,
        audience: p.audience,
        priceMinor: p.priceMinor,
        currency: 'OMR',
        interval: p.interval,
        featuresJson: p.features,
      },
      update: {},
    });
  }

  // ── Community Rooms ────────────────────────────────────────────────────────
  const rooms = [
    { nameAr: 'مجتمع العرسان', type: 'public', imageUrl: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&q=80' },
    { nameAr: 'مجتمع الأمهات', type: 'public', imageUrl: 'https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=600&q=80' },
    { nameAr: 'رجال الأعمال', type: 'public', imageUrl: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=600&q=80' },
    { nameAr: 'نادي المصورين', type: 'public', imageUrl: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=600&q=80' },
    { nameAr: 'منظّمو الفعاليات', type: 'public', imageUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&q=80' },
    { nameAr: 'الأخويات النسائية', type: 'cohort', imageUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&q=80' },
    { nameAr: 'الأخويات الرجالية', type: 'cohort', imageUrl: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=600&q=80' },
    { nameAr: 'المجتمع التطوّعي', type: 'public', imageUrl: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=600&q=80' },
  ];
  for (const room of rooms) {
    await prisma.room.create({ data: { appId: farah.id, ...room } });
  }

  // ── Library: invitation/design templates & inspiration ─────────────────────
  const templates = [
    { type: 'image', titleAr: 'قالب دعوة زفاف ذهبي', descAr: 'تصميم فاخر بلمسات ذهبية لحفلات الزفاف', url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=900&q=80', coverUrl: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=900&q=80', requiredEntitlement: null },
    { type: 'image', titleAr: 'قالب دعوة خطوبة وردي', descAr: 'تصميم رومانسي بدرجات الوردي', url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=900&q=80', coverUrl: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=900&q=80', requiredEntitlement: null },
    { type: 'image', titleAr: 'قالب عيد ميلاد مرح', descAr: 'ألوان زاهية وبالونات لأعياد الميلاد', url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=900&q=80', coverUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=900&q=80', requiredEntitlement: null },
    { type: 'video', titleAr: 'فيديو دعوة سينمائي', descAr: 'دعوة فيديو احترافية بتقنية الذكاء الاصطناعي', url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=900&q=80', coverUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=900&q=80', duration: 45, requiredEntitlement: 'premium_invitations' },
    { type: 'image', titleAr: 'قالب بيبي شاور', descAr: 'تصميم لطيف لاستقبال المواليد', url: 'https://images.unsplash.com/photo-1530047625168-4b29bca1bd6f?w=900&q=80', coverUrl: 'https://images.unsplash.com/photo-1530047625168-4b29bca1bd6f?w=900&q=80', requiredEntitlement: null },
    { type: 'image', titleAr: 'قالب حفل تخرّج', descAr: 'تصميم أنيق لحفلات التخرج والنجاح', url: 'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?w=900&q=80', coverUrl: 'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?w=900&q=80', requiredEntitlement: 'premium_invitations' },
    { type: 'material', titleAr: 'دليل تنظيم حفل زفاف مثالي', descAr: 'خطوات كاملة من الفكرة إلى التنفيذ', url: 'https://example.com/guide/wedding', coverUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=900&q=80', isDownloadable: true, requiredEntitlement: null },
    { type: 'material', titleAr: 'قائمة استقبال الحجاج والمعتمرين', descAr: 'تنظيم حفلات الاستقبال خطوة بخطوة', url: 'https://example.com/guide/welcome', coverUrl: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=900&q=80', isDownloadable: true, requiredEntitlement: null },
  ];
  for (const t of templates) {
    await prisma.libraryAsset.create({ data: { appId: farah.id, isDownloadable: false, ...t } });
  }

  // ── Marketplace (catalog items: service vendors) ──────────────────────────
  const vendors = [
    { type: 'venue', section: 'venues', titleAr: 'قاعة الأميرة للأفراح', descAr: 'قاعة فاخرة تتسع لـ ٥٠٠ ضيف مع خدمات متكاملة وديكور راقٍ.', priceMinor: 25000, capacity: 500 },
    { type: 'hotel', section: 'venues', titleAr: 'فندق اللؤلؤة الكبير', descAr: 'قاعات مؤتمرات وحفلات بإطلالة بحرية وخدمة خمس نجوم.', priceMinor: 40000, capacity: 300 },
    { type: 'photographer', section: 'photography', titleAr: 'استوديو لقطة للتصوير', descAr: 'تصوير احترافي للمناسبات بأحدث المعدات وفريق متخصص.', priceMinor: 8000, capacity: null },
    { type: 'decor', section: 'decor', titleAr: 'ديكور أحلام الذهبي', descAr: 'تصميم وتنفيذ ديكورات المناسبات بلمسات إبداعية فاخرة.', priceMinor: 12000, capacity: null },
    { type: 'catering', section: 'catering', titleAr: 'ضيافة المائدة الملكية', descAr: 'بوفيهات وضيافة راقية تناسب جميع المناسبات.', priceMinor: 6000, capacity: 600 },
    { type: 'flowers', section: 'gifts', titleAr: 'متجر ورود فرح', descAr: 'تنسيقات ورود طبيعية وباقات مميزة للمناسبات والهدايا.', priceMinor: 1500, capacity: null },
    { type: 'gifts', section: 'gifts', titleAr: 'متجر الهدايا الذكية', descAr: 'هدايا مختارة بعناية مع تغليف فاخر وإرسال مباشر.', priceMinor: 2000, capacity: null },
    { type: 'sound', section: 'production', titleAr: 'شركة الصوت والإضاءة', descAr: 'أنظمة صوت وإضاءة احترافية تصنع أجواء استثنائية.', priceMinor: 9000, capacity: null },
  ];
  const now = new Date();
  for (const v of vendors) {
    await prisma.catalogItem.create({
      data: { appId: farah.id, isPublished: true, currency: 'OMR', startsAt: null, ...v },
    });
  }

  // ── Badges ────────────────────────────────────────────────────────────────
  const badges = [
    { code: 'first_event', nameAr: 'أول مناسبة', iconUrl: '🎉' },
    { code: 'planner', nameAr: 'منظّم محترف', iconUrl: '📋' },
    { code: 'gift_giver', nameAr: 'كريم العطاء', iconUrl: '🎁' },
    { code: 'memory_keeper', nameAr: 'حافظ الذكريات', iconUrl: '📸' },
    { code: 'community_star', nameAr: 'نجم المجتمع', iconUrl: '⭐' },
    { code: 'vip_member', nameAr: 'عضو VIP', iconUrl: '👑' },
  ];
  for (const b of badges) {
    await prisma.badge.upsert({
      where: { appId_code: { appId: farah.id, code: b.code } },
      create: { appId: farah.id, ...b },
      update: {},
    });
  }

  // eslint-disable-next-line no-console
  console.log('✅ Seeded Farah: app, 3 plans, 8 rooms, 8 templates, 8 vendors, 6 badges.');
}

main().finally(() => prisma.$disconnect());
