import { Appearance } from 'react-native-appearance';
import changeNavigationBarColor from 'react-native-navigation-bar-color';
import setRootViewColor from 'rn-root-view';

import { isAndroid } from './deviceInfo';
import { themes } from '../constants/colors';

export const defaultTheme = () => {
	const colorScheme = Appearance.getColorScheme();
	if (colorScheme && colorScheme !== 'no-preference') {
		return colorScheme;
	}
	return 'light';
};

export const getTheme = (colorScheme) => {
	const { darkLevel, currentTheme } = colorScheme;
	let color = currentTheme;
	if (currentTheme === 'automatic') {
		color = defaultTheme();
	}
	return color === 'dark' ? darkLevel : 'light';
};

export const setNativeTheme = (theme) => {
	if (isAndroid) {
		const iconsLight = theme === 'light';
		changeNavigationBarColor(themes[theme].navbarBackground, iconsLight);
	}
	setRootViewColor(themes[theme].backgroundColor);
};
