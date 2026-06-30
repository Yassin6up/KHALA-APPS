"use strict";
/**
 * KHALA / Qader design tokens — "Liquid Glass" premium dark theme.
 * Shared by the Qader app (React Native) and the Admin panel so the brand stays in sync.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.gradients = exports.radii = exports.spacing = exports.typography = exports.glass = exports.colors = void 0;
exports.colors = {
    // base gradient
    bg0: '#0B1020', // deep navy
    bg1: '#121A33',
    bg2: '#1A2340',
    // brand
    brand: '#2EC5B6', // Qader teal — growth / clarity
    brand2: '#6C8BFF', // accent indigo
    gold: '#E9C46A', // achievement / premium
    danger: '#FF6B6B',
    success: '#48D597',
    // text
    textHi: '#F4F7FF',
    textMid: '#C3CCE6',
    textLo: '#9AA6C4',
    // glass surfaces
    glassFill: 'rgba(255,255,255,0.06)',
    glassFillStrong: 'rgba(255,255,255,0.10)',
    glassBorder: 'rgba(255,255,255,0.14)',
    glassHighlight: 'rgba(255,255,255,0.22)',
};
exports.glass = {
    blur: 24, // expo-blur intensity baseline
    radius: 26,
    borderWidth: 1,
};
/** Cairo type scale (Arabic-optimised line-heights). */
exports.typography = {
    fontFamily: 'Cairo',
    display: { size: 32, weight: '700', lineHeight: 44 },
    h1: { size: 24, weight: '700', lineHeight: 38 },
    h2: { size: 20, weight: '600', lineHeight: 32 },
    body: { size: 16, weight: '400', lineHeight: 28 },
    caption: { size: 13, weight: '400', lineHeight: 22 },
};
exports.spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
exports.radii = { sm: 12, md: 18, lg: 26, pill: 999 };
exports.gradients = {
    appBackground: ['#0B1020', '#121A33', '#0B1020'],
    brand: ['#2EC5B6', '#6C8BFF'],
    premium: ['#E9C46A', '#2EC5B6'],
};
