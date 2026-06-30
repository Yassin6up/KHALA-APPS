/** Qader — clean light design tokens. */
export const colors = {
  // Page & surface
  bg0: '#F7F8FC',
  bg1: '#FFFFFF',
  bg2: '#EEF0F8',

  // Brand
  brand: '#2EC5B6',
  brand2: '#6C8BFF',
  gold: '#F59E0B',
  danger: '#EF4444',
  success: '#10B981',

  // Text
  textHi: '#0D1B2A',
  textMid: '#4A5568',
  textLo: '#9AA3B3',

  // Surface tokens (cards, dividers, subtle fills)
  glassFill: 'rgba(0,0,0,0.03)',
  glassFillStrong: 'rgba(0,0,0,0.06)',
  glassBorder: 'rgba(0,0,0,0.08)',
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
export const radii = { sm: 12, md: 18, lg: 20, pill: 999 };
export const gradients = {
  app: ['#F7F8FC', '#EEF0F8', '#F7F8FC'] as const,
  brand: ['#2EC5B6', '#6C8BFF'] as const,
  premium: ['#F59E0B', '#2EC5B6'] as const,
};
