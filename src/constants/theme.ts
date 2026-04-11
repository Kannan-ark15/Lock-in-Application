// src/constants/theme.ts
// Design tokens — single source of truth for all visual styling.
// No hardcoded color values anywhere else in the codebase.

export const colors = {
  // Backgrounds
  bg: {
    primary: '#0A0A0A',
    secondary: '#141414',
    card: '#1C1C1C',
    overlay: 'rgba(0,0,0,0.6)',
  },
  // Accents
  accent: {
    primary: '#A78BFA', // violet — main CTA
    success: '#34D399', // green — completion
    warning: '#FBBF24', // amber — streak
    danger: '#F87171', // red — destructive
  },
  // Text
  text: {
    primary: '#F5F5F5',
    secondary: '#A3A3A3',
    tertiary: '#525252',
  },
  border: '#2A2A2A',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const typography = {
  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    '2xl': 32,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
} as const;

export const animation = {
  spring: { damping: 18, stiffness: 200 },
  timing: { fast: 150, base: 250, slow: 400 },
} as const;
