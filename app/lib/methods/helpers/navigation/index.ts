import { StyleSheet } from 'react-native';
import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { StackNavigationOptions } from '@react-navigation/stack';

import { themes } from '../../../constants';
import { TSupportedThemes } from '../../../../theme';
import sharedStyles from '../../../../views/Styles';

export * from './animations';

export const defaultHeader: StackNavigationOptions = {
	headerBackTitleVisible: false,
	headerBackTestID: 'header-back',
	cardOverlayEnabled: true,
	cardStyle: { backgroundColor: 'transparent' },
	headerTitleAlign: 'left'
};

export const cardStyle = {
	backgroundColor: 'rgba(0,0,0,0)'
};

export const borderBottom: any = (theme: TSupportedThemes) => ({
	borderBottomWidth: StyleSheet.hairlineWidth,
	borderBottomColor: themes[theme].strokeDark,
	elevation: 0
});

export const drawerStyle = {
	width: 320
};

export const themedHeader = (theme: TSupportedThemes) => ({
	headerStyle: {
		...borderBottom(theme),
		backgroundColor: themes[theme].surfaceNeutral
	},
	headerTintColor: themes[theme].fontDefault,
	headerTitleStyle: { ...sharedStyles.textSemibold, color: themes[theme].fontTitlesLabels, fontSize: 18 }
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
