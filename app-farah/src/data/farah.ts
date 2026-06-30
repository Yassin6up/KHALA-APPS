import {
  Heart, Gem, Users, Cake, Baby, GraduationCap, Trophy, Briefcase,
  Plane, Flag, HeartHandshake, Sparkles, Box, TrendingDown, Search, Mail,
  PlaneTakeoff, Gift, Film, BookOpen, Music, Image as ImageIcon, Building2,
  Hotel, Camera, Palette, UtensilsCrossed, Flower2, Speaker,
} from 'lucide-react-native';

export type Occasion = {
  key: string;
  title: string;
  icon: React.FC<any>;
  image: string;
  tint: string;
};

/** Supported occasions with curated festive imagery. */
export const OCCASIONS: Occasion[] = [
  { key: 'wedding', title: 'حفلات الزواج', icon: Heart, tint: '#E8488B', image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&q=80' },
  { key: 'engagement', title: 'الخطوبة والملكة', icon: Gem, tint: '#C026D3', image: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600&q=80' },
  { key: 'birthday', title: 'أعياد الميلاد', icon: Cake, tint: '#F5B301', image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&q=80' },
  { key: 'babyshower', title: 'البيبي شاور', icon: Baby, tint: '#60A5FA', image: 'https://images.unsplash.com/photo-1530047625168-4b29bca1bd6f?w=600&q=80' },
  { key: 'graduation', title: 'حفلات التخرّج', icon: GraduationCap, tint: '#7C3AED', image: 'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?w=600&q=80' },
  { key: 'corporate', title: 'حفلات الشركات', icon: Briefcase, tint: '#0EA5E9', image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&q=80' },
  { key: 'national', title: 'المناسبات الوطنية', icon: Flag, tint: '#EF4444', image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=80' },
  { key: 'mass_wedding', title: 'الزواج الجماعي', icon: Users, tint: '#10B981', image: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=600&q=80' },
  { key: 'pilgrims', title: 'استقبال الحجّاج', icon: Plane, tint: '#059669', image: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=600&q=80' },
  { key: 'graduation_success', title: 'حفلات النجاح', icon: Trophy, tint: '#F59E0B', image: 'https://images.unsplash.com/photo-1464347744102-11db6282f854?w=600&q=80' },
  { key: 'family', title: 'اللقاءات العائلية', icon: HeartHandshake, tint: '#EC4899', image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&q=80' },
  { key: 'travelers', title: 'استقبال المسافرين', icon: PlaneTakeoff, tint: '#8B5CF6', image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&q=80' },
];

export type AiFeature = {
  key: string;
  title: string;
  trademark: string;
  desc: string;
  icon: React.FC<any>;
  gradient: readonly [string, string];
};

export const AI_FEATURES: AiFeature[] = [
  { key: 'designer', title: 'مصمم المناسبات', trademark: 'AI Event Designer™', desc: 'صمّم مناسبتك كاملة من وصف بسيط: الفكرة، الألوان، الديكور، الموسيقى والبرنامج.', icon: Sparkles, gradient: ['#E8488B', '#7C3AED'] },
  { key: 'twin', title: 'التوأم الرقمي', trademark: 'Digital Celebration Twin™', desc: 'نسخة ثلاثية الأبعاد للمناسبة تتجول داخلها وتعدّل التفاصيل قبل التنفيذ.', icon: Box, gradient: ['#7C3AED', '#A855F7'] },
  { key: 'budget', title: 'محسّن الميزانية', trademark: 'AI Budget Optimizer™', desc: 'ميزانية مثالية وبدائل ذكية توفّر من ١٠٪ إلى ٤٠٪ مع الحفاظ على الجودة.', icon: TrendingDown, gradient: ['#F5B301', '#E8488B'] },
  { key: 'vendor', title: 'مطابقة المورّدين', trademark: 'Smart Vendor Match™', desc: 'يقارن آلاف المورّدين ويختار الأنسب حسب السعر والجودة والموقع والتقييم.', icon: Search, gradient: ['#0EA5E9', '#7C3AED'] },
  { key: 'invite', title: 'مولّد الدعوات', trademark: 'AI Invitation Generator™', desc: 'دعوات رقمية وفيديوهات وQR وتأكيد حضور وتذكيرات تلقائية خلال ثوانٍ.', icon: Mail, gradient: ['#EC4899', '#F5B301'] },
  { key: 'welcome', title: 'مخطّط الاستقبال', trademark: 'AI Welcome Planner™', desc: 'تخطيط حفلات استقبال الحجّاج والمعتمرين والمسافرين بكل تفاصيلها.', icon: PlaneTakeoff, gradient: ['#10B981', '#0EA5E9'] },
];

export type MemoryType = { key: string; title: string; desc: string; icon: React.FC<any>; tint: string };
export const MEMORY_TYPES: MemoryType[] = [
  { key: 'film', title: 'فيلم سينمائي', desc: 'فيلم احترافي لأجمل لحظات المناسبة', icon: Film, tint: '#E8488B' },
  { key: 'album', title: 'ألبوم صور ذكي', desc: 'ألبوم منسّق تلقائياً بالذكاء الاصطناعي', icon: ImageIcon, tint: '#7C3AED' },
  { key: 'book', title: 'كتاب إلكتروني', desc: 'كتاب رقمي يوثّق قصة المناسبة', icon: BookOpen, tint: '#F5B301' },
  { key: 'annual', title: 'تذكير سنوي', desc: 'فيديو سنوي يذكّرك بأجمل اللحظات', icon: Music, tint: '#0EA5E9' },
];

export type MarketCat = { key: string; title: string; icon: React.FC<any>; tint: string };
export const MARKET_CATS: MarketCat[] = [
  { key: 'venues', title: 'القاعات', icon: Building2, tint: '#E8488B' },
  { key: 'hotels', title: 'الفنادق', icon: Hotel, tint: '#7C3AED' },
  { key: 'photography', title: 'المصوّرون', icon: Camera, tint: '#0EA5E9' },
  { key: 'decor', title: 'الديكور', icon: Palette, tint: '#F5B301' },
  { key: 'catering', title: 'الضيافة', icon: UtensilsCrossed, tint: '#10B981' },
  { key: 'gifts', title: 'الورود والهدايا', icon: Flower2, tint: '#EC4899' },
  { key: 'production', title: 'الصوت والإضاءة', icon: Speaker, tint: '#8B5CF6' },
  { key: 'more', title: 'المزيد', icon: Gift, tint: '#F59E0B' },
];
