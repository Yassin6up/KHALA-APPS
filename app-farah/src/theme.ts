/** فرح AI — minimalist design tokens (pink · gold · purple accents on white). */
export const colors = {
  // Page & surface — pure white base
  bg0: '#FFFFFF',
  bg1: '#FAFAFA',
  bg2: '#F4F4F5',

  // Brand accents
  brand: '#E8488B',   // festive pink
  brand2: '#7C3AED',  // royal purple
  gold: '#F5B301',    // celebration gold
  pinkSoft: '#FFF0F6',
  goldSoft: '#FFFBEA',
  purpleSoft: '#F3F0FD',
  danger: '#EF4444',
  success: '#10B981',

  // Text
  textHi: '#18181B',
  textMid: '#71717A',
  textLo: '#A1A1AA',

  // Surface tokens
  glassFill: 'rgba(0,0,0,0.02)',
  glassFillStrong: 'rgba(0,0,0,0.04)',
  glassBorder: 'rgba(0,0,0,0.07)',
  glassHighlight: 'rgba(255,255,255,0.95)',
};

export const font = {
  regular: 'Cairo_400Regular',
  medium: 'Cairo_600SemiBold',
  bold: 'Cairo_700Bold',
};

export const type = {
  display: { fontFamily: font.bold, fontSize: 32, lineHeight: 44, color: colors.textHi },
  h1: { fontFamily: font.bold, fontSize: 24, lineHeight: 38, color: colors.textHi },
  h2: { fontFamily: font.medium, fontSize: 20, lineHeight: 32, color: colors.textHi },
  body: { fontFamily: font.regular, fontSize: 16, lineHeight: 28, color: colors.textMid },
  caption: { fontFamily: font.regular, fontSize: 13, lineHeight: 22, color: colors.textLo },
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const radii = { sm: 12, md: 18, lg: 22, pill: 999 };
export const gradients = {
  app: ['#FFF6FB', '#FBEAF3', '#FFF6FB'] as const,
  brand: ['#E8488B', '#7C3AED'] as const,         // pink → purple
  festive: ['#F5B301', '#E8488B'] as const,        // gold → pink
  gold: ['#FBBF24', '#F5B301'] as const,
  purple: ['#7C3AED', '#A855F7'] as const,
  overlay: ['transparent', 'rgba(42,19,48,0.78)'] as const,
};
