import { create } from 'zustand';
import { Appearance, ColorSchemeName } from 'react-native';

interface UIState {
  theme: 'light' | 'dark' | 'system';
  effectiveTheme: 'light' | 'dark';
  isBottomSheetOpen: boolean;
  bottomSheetContent: 'bet-confirmation' | 'settings' | null;
  bottomSheetData: any;

  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  updateEffectiveTheme: (systemTheme: ColorSchemeName) => void;
  openBottomSheet: (content: 'bet-confirmation' | 'settings', data?: any) => void;
  closeBottomSheet: () => void;
  setBottomSheetData: (data: any) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  theme: 'system',
  effectiveTheme: Appearance.getColorScheme() === 'dark' ? 'dark' : 'light',
  isBottomSheetOpen: false,
  bottomSheetContent: null,
  bottomSheetData: null,

  setTheme: (theme) => {
    set({ theme });
    
    if (theme === 'system') {
      const systemTheme = Appearance.getColorScheme();
      set({ effectiveTheme: systemTheme === 'dark' ? 'dark' : 'light' });
    } else {
      set({ effectiveTheme: theme });
    }
  },

  updateEffectiveTheme: (systemTheme) => {
    const { theme } = get();
    
    if (theme === 'system') {
      set({ effectiveTheme: systemTheme === 'dark' ? 'dark' : 'light' });
    }
  },

  openBottomSheet: (content, data) => {
    set({
      isBottomSheetOpen: true,
      bottomSheetContent: content,
      bottomSheetData: data,
    });
  },

  closeBottomSheet: () => {
    set({
      isBottomSheetOpen: false,
      bottomSheetContent: null,
      bottomSheetData: null,
    });
  },

  setBottomSheetData: (data) => {
    set({ bottomSheetData: data });
  },
}));
