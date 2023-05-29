import { Appearance } from 'react-native';
import changeNavigationBarColor from 'react-native-navigation-bar-color';
import setRootViewColor from 'rn-root-view';

import { IThemePreference, TThemeMode } from '../../../definitions/ITheme';
import { themes, THEME_PREFERENCES_KEY } from '../../constants';
import UserPreferences from '../userPreferences';
import { TSupportedThemes } from '../../../theme';
import { isAndroid } from './deviceInfo';
import { debounce } from './debounce';

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

export const setNativeTheme = async (themePreferences: IThemePreference): Promise<void> => {
	const theme = getTheme(themePreferences);
	if (isAndroid) {
		const iconsLight = theme === 'light';
		try {
			// The late param as default is true @ react-native-navigation-bar-color/src/index.js line 8
			await changeNavigationBarColor(themes[theme].navbarBackground, iconsLight, true);
		} catch (error) {
			// Do nothing
		}
	}
	setRootViewColor(themes[theme].backgroundColor);
};

export const unsubscribeTheme = () => {
	if (themeListener && themeListener.remove) {
		themeListener.remove();
		themeListener = null;
	}
};

type AppearancePreferences = {
	colorScheme: 'light' | 'dark';
};

export const subscribeTheme = (themePreferences: IThemePreference, theme: TSupportedThemes, setTheme: () => void): void => {
	const { currentTheme } = themePreferences;
	if (currentTheme === 'automatic') {
		unsubscribeTheme();
		themeListener = Appearance.addChangeListener(
			// listener issue https://github.com/facebook/react-native/issues/36713
			debounce((appearance: AppearancePreferences) => {
				const simplifiedTheme = theme === 'black' ? 'dark' : theme;
				if (simplifiedTheme !== appearance.colorScheme) {
					setTheme();
				}
			}, 300)
		);
	} else {
		// unsubscribe appearance changes when automatic was disabled
		unsubscribeTheme();
	}
	// set native components theme
	setNativeTheme(themePreferences);
};
