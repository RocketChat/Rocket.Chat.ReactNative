import { Platform } from 'react-native';
import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { type NativeStackNavigationOptions } from '@react-navigation/native-stack';

import { themes } from '~/lib/constants/colors';
import { type TSupportedThemes } from '~/theme';
import sharedStyles from '~/views/Styles';

export { headerItems, type HeaderAction } from './headerItems';

export const drawerStyle = {
	width: 320
};

export const themedHeader = (theme: TSupportedThemes): NativeStackNavigationOptions => ({
	headerStyle: {
		backgroundColor: themes[theme].surfaceNeutral
	},
	headerTintColor: themes[theme].fontDefault,
	headerTitleStyle: { ...sharedStyles.textBold, color: themes[theme].fontTitlesLabels, fontSize: 16 }
});

export const nativeHeader = (theme: TSupportedThemes): NativeStackNavigationOptions => ({
	...(Platform.OS === 'android' ? themedHeader(theme) : {}),
	headerTintColor: themes[theme].fontDefault,
	headerTitleStyle: { ...sharedStyles.textBold, color: themes[theme].fontTitlesLabels, fontSize: 16 }
});

export const navigationTheme = (theme: TSupportedThemes) => {
	const defaultNavTheme = theme === 'light' ? DefaultTheme : DarkTheme;

	return {
		...defaultNavTheme,
		colors: {
			...defaultNavTheme.colors,
			background: themes[theme].surfaceRoom,
			border: themes[theme].strokeLight
		}
	};
};

// Gets the current screen from navigation state
export const getActiveRoute: any = (state: any) => {
	const route = state?.routes[state?.index];

	if (route?.state) {
		// Dive into nested navigators
		return getActiveRoute(route.state);
	}

	return route;
};

export const getActiveRouteName = (state: any) => getActiveRoute(state)?.name;
