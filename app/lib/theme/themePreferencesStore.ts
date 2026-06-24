import { create } from 'zustand';

import { type IThemePreference } from '../../definitions/ITheme';
import { initialTheme, newThemeState, subscribeTheme } from '../methods/helpers/theme';

interface ThemePreferencesState {
	themePreferences: IThemePreference;
}

interface ThemePreferencesActions {
	setTheme: (newTheme?: Partial<IThemePreference>) => void;
}

export type ThemePreferencesStore = ThemePreferencesState & ThemePreferencesActions;

const safeInitialTheme = (): IThemePreference => {
	try {
		return initialTheme();
	} catch {
		return { currentTheme: 'light', darkLevel: 'black' };
	}
};

export const useThemePreferencesStore = create<ThemePreferencesStore>((set, get) => ({
	themePreferences: safeInitialTheme(),
	setTheme: (newTheme = {}) => {
		const { themePreferences } = newThemeState({ themePreferences: get().themePreferences }, newTheme as IThemePreference);
		set({ themePreferences });
		subscribeTheme(themePreferences, get().setTheme);
	}
}));
