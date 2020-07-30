import { Appearance } from 'react-native-appearance';
import changeNavigationBarColor from 'react-native-navigation-bar-color';
import setRootViewColor from 'rn-root-view';

import { isAndroid } from './deviceInfo';
import { themes } from '../constants/colors';

let themeListener;

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

export const newThemeState = (prevState, newTheme) => {
	// new theme preferences
	const themePreferences = {
		...prevState.themePreferences,
		...newTheme
	};
	// set new state of themePreferences
	// and theme (based on themePreferences)
	return { themePreferences, theme: getTheme(themePreferences) };
};

export const setNativeTheme = async(themePreferences) => {
	const theme = getTheme(themePreferences);
	if (isAndroid) {
		const iconsLight = theme === 'light';
		try {
			await changeNavigationBarColor(themes[theme].navbarBackground, iconsLight);
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

export const subscribeTheme = (themePreferences, setTheme) => {
	const { currentTheme } = themePreferences;
	if (!themeListener && currentTheme === 'automatic') {
		// not use listener params because we use getTheme
		themeListener = Appearance.addChangeListener(() => setTheme());
	} else if (currentTheme !== 'automatic') {
		// unsubscribe appearance changes when automatic was disabled
		unsubscribeTheme();
	}
	// set native components theme
	setNativeTheme(themePreferences);
};
