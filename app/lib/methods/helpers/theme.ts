import { Appearance } from 'react-native';
import setRootViewColor from 'rn-root-view';

import { IThemePreference, TThemeMode } from '../../../definitions/ITheme';
import { themes, THEME_PREFERENCES_KEY } from '../../constants';
import UserPreferences from '../userPreferences';
import { TSupportedThemes } from '../../../theme';

let themeListener: { remove: () => void } | null;

export const initialTheme = (): IThemePreference => {
	const theme = UserPreferences.getMap(THEME_PREFERENCES_KEY) as IThemePreference;
	const initialTheme: IThemePreference = {
		currentTheme: defaultTheme(),
		darkLevel: 'black'
	};
	return theme || initialTheme;
};

export const defaultTheme = (): TThemeMode => {
	const systemTheme = Appearance.getColorScheme();
	if (systemTheme) {
		return systemTheme;
	}
	return 'light';
};

export const getTheme = (themePreferences: IThemePreference): TSupportedThemes => {
	const { darkLevel, currentTheme } = themePreferences;
	let theme = currentTheme;
	if (currentTheme === 'automatic') {
		theme = defaultTheme();
	}
	return theme === 'dark' ? darkLevel : 'light';
};

export const newThemeState = (prevState: { themePreferences: IThemePreference }, newTheme: IThemePreference) => {
	// new theme preferences
	const themePreferences = {
		...prevState.themePreferences,
		...newTheme
	};
	// set new state of themePreferences
	// and theme (based on themePreferences)
	return { themePreferences, theme: getTheme(themePreferences) };
};

export const updateRootViewColor = (themePreferences: IThemePreference) => {
	const theme = getTheme(themePreferences);

	setRootViewColor(themes[theme].surfaceRoom);
};

export const unsubscribeTheme = () => {
	if (themeListener && themeListener.remove) {
		themeListener.remove();
		themeListener = null;
	}
};

export const subscribeTheme = (themePreferences: IThemePreference, setTheme: () => void): void => {
	const { currentTheme } = themePreferences;
	if (!themeListener && currentTheme === 'automatic') {
		// not use listener params because we use getTheme
		themeListener = Appearance.addChangeListener(() => setTheme());
	} else if (currentTheme !== 'automatic') {
		// unsubscribe appearance changes when automatic was disabled
		unsubscribeTheme();
	}
	
	updateRootViewColor(themePreferences);
};
