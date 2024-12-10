import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { NativeStackNavigationOptions } from '@react-navigation/native-stack';

import { themes } from '../../../constants';
import { TSupportedThemes } from '../../../../theme';
import sharedStyles from '../../../../views/Styles';

export const defaultHeader: NativeStackNavigationOptions = {
	headerBackTitleVisible: false
};

export const drawerStyle = {
	width: 320
};

export const themedHeader = (theme: TSupportedThemes): NativeStackNavigationOptions => ({
	headerStyle: {
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
