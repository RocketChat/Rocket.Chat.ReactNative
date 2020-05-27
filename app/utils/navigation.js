import { StyleSheet } from 'react-native';
import { TransitionPresets } from '@react-navigation/stack';

import { analytics, leaveBreadcrumb } from './log';
import { themes } from '../constants/colors';

export const defaultHeader = {
	headerBackTitleVisible: false,
	cardOverlayEnabled: true,
	cardStyle: { backgroundColor: 'transparent' }
};

export const stackAnimation = TransitionPresets.SlideFromRightIOS;
export const modalAnimation = TransitionPresets.ModalTransition;

export const cardStyle = {
	backgroundColor: 'rgba(0,0,0,0)'
};

const borderBottom = theme => ({
	borderBottomWidth: StyleSheet.hairlineWidth,
	borderBottomColor: themes[theme].headerBorder,
	elevation: 0
});

export const themedHeader = theme => ({
	headerStyle: {
		...borderBottom(theme),
		backgroundColor: themes[theme].headerBackground
	},
	headerTintColor: themes[theme].headerTintColor,
	headerTitleStyle: { color: themes[theme].headerTitleColor }
});

// gets the current screen from navigation state
export const getActiveRouteName = (navigationState) => {
	if (!navigationState) {
		return null;
	}
	const route = navigationState.routes[navigationState.index];
	// dive into nested navigators
	if (route.routes) {
		return getActiveRouteName(route);
	}
	return route.routeName;
};

export const onNavigationStateChange = (prevState, currentState) => {
	const currentScreen = getActiveRouteName(currentState);
	const prevScreen = getActiveRouteName(prevState);

	if (prevScreen !== currentScreen) {
		analytics().setCurrentScreen(currentScreen);
		leaveBreadcrumb(currentScreen, { type: 'navigation' });
	}
};
