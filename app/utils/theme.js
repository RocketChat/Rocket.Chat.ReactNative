import { Appearance } from 'react-native-appearance';
import changeNavigationBarColor from 'react-native-navigation-bar-color';
import setRootViewColor from 'rn-root-view';

import { isAndroid } from './deviceInfo';
import { themes } from '../constants/colors';

export const defaultTheme = () => {
	const systemTheme = Appearance.getColorScheme();
	if (systemTheme && systemTheme !== 'no-preference') {
		return systemTheme;
	}
	return 'light';
};

export const getTheme = (themePreferences) => {
	const { darkLevel, currentTheme } = themePreferences;
	let theme = currentTheme;
	if (currentTheme === 'automatic') {
		theme = defaultTheme();
	}
	return theme === 'dark' ? darkLevel : 'light';
};

export const setNativeTheme = (themePreferences) => {
	const theme = getTheme(themePreferences);
	if (isAndroid) {
		const iconsLight = theme === 'light';
		changeNavigationBarColor(themes[theme].navbarBackground, iconsLight);
	}
	setRootViewColor(themes[theme].backgroundColor);
};
