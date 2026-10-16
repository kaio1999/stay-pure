export const colors = {
  ink: '#070B16',
  navy: '#10182B',
  navyLift: '#18233A',
  gold: '#D4AF77',
  goldSoft: '#E8D5B0',
  parchment: '#F4EDE1',
  parchmentMuted: 'rgba(244, 237, 225, 0.86)',
  line: 'rgba(212, 175, 119, 0.22)',
  danger: '#C45C5C',
  success: '#7D9A7A',
} as const;

export const spacing = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 28,
  xl: 40,
  xxl: 56,
} as const;

export const radii = {
  sm: 12,
  md: 18,
  lg: 28,
} as const;

export const fonts = {
  display: 'DMSans_700Bold',
  displayItalic: 'DMSans_500Medium',
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodyBold: 'DMSans_700Bold',
} as const;

export const layout = {
  heroMinHeight: 280,
  tabBarHeight: 78,
  screenGutter: 28,
} as const;
