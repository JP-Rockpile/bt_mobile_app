import { MD3LightTheme, MD3DarkTheme, MD3Theme } from 'react-native-paper';

const lightColors = {
  primary: '#2196F3',
  primaryContainer: '#BBDEFB',
  secondary: '#4CAF50',
  secondaryContainer: '#C8E6C9',
  tertiary: '#FF9800',
  tertiaryContainer: '#FFE0B2',
  error: '#F44336',
  errorContainer: '#FFCDD2',
  background: '#FFFFFF',
  surface: '#F5F5F5',
  surfaceVariant: '#E0E0E0',
  surfaceDisabled: '#BDBDBD',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#0D47A1',
  onSecondary: '#FFFFFF',
  onSecondaryContainer: '#1B5E20',
  onTertiary: '#000000',
  onTertiaryContainer: '#E65100',
  onError: '#FFFFFF',
  onErrorContainer: '#B71C1C',
  onBackground: '#212121',
  onSurface: '#212121',
  onSurfaceVariant: '#616161',
  onSurfaceDisabled: '#9E9E9E',
  outline: '#BDBDBD',
  outlineVariant: '#E0E0E0',
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#212121',
  inverseOnSurface: '#FFFFFF',
  inversePrimary: '#90CAF9',
  elevation: {
    level0: 'transparent',
    level1: '#F5F5F5',
    level2: '#EEEEEE',
    level3: '#E0E0E0',
    level4: '#D6D6D6',
    level5: '#CCCCCC',
  },
};

const darkColors = {
  primary: '#90CAF9',
  primaryContainer: '#1565C0',
  secondary: '#81C784',
  secondaryContainer: '#2E7D32',
  tertiary: '#FFB74D',
  tertiaryContainer: '#F57C00',
  error: '#EF5350',
  errorContainer: '#C62828',
  background: '#121212',
  surface: '#1E1E1E',
  surfaceVariant: '#2C2C2C',
  surfaceDisabled: '#3C3C3C',
  onPrimary: '#0D47A1',
  onPrimaryContainer: '#E3F2FD',
  onSecondary: '#1B5E20',
  onSecondaryContainer: '#E8F5E9',
  onTertiary: '#E65100',
  onTertiaryContainer: '#FFF3E0',
  onError: '#B71C1C',
  onErrorContainer: '#FFEBEE',
  onBackground: '#E0E0E0',
  onSurface: '#E0E0E0',
  onSurfaceVariant: '#BDBDBD',
  onSurfaceDisabled: '#757575',
  outline: '#616161',
  outlineVariant: '#424242',
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#E0E0E0',
  inverseOnSurface: '#212121',
  inversePrimary: '#1976D2',
  elevation: {
    level0: 'transparent',
    level1: '#1E1E1E',
    level2: '#232323',
    level3: '#2C2C2C',
    level4: '#333333',
    level5: '#383838',
  },
};

export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: lightColors,
};

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: darkColors,
};

// Spacing scale
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Typography
export const typography = {
  fontSizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    xxl: 32,
  },
  fontWeights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// Border radius
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

// Shadows
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
};

export type AppTheme = MD3Theme;
