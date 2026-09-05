import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createElement } from 'react';
import { type NativeStackHeaderProps, type NativeStackNavigationOptions } from '@react-navigation/native-stack';

import { themes } from '../../../constants/colors';
import { type TSupportedThemes } from '../../../../theme';
import sharedStyles from '../../../../views/Styles';
import Header from '../../../../containers/Header';

export const defaultHeader: NativeStackNavigationOptions = {
	// Native-stack calls `header(props)` inside SceneView's render, so a hook-using Header must be an element,
	// or its hooks land on SceneView and vanish when a screen sets `headerShown: false` after mount.
	header: (props: NativeStackHeaderProps) => createElement(Header, props)
};

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
