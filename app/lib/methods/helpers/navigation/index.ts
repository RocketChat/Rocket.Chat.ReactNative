import { createElement, type ReactElement } from 'react';
import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { type NativeStackHeaderProps, type NativeStackNavigationOptions } from '@react-navigation/native-stack';

import { themes } from '~/lib/constants/colors';
import { type TSupportedThemes } from '~/theme';
import sharedStyles from '~/views/Styles';
import Header from '~/containers/Header';
import * as HeaderButton from '~/containers/Header/components/HeaderButton';
import I18n from '~/i18n';
import { isIOS } from '~/lib/methods/helpers';
import { headerIcon } from './headerIcon';

export const defaultHeader: NativeStackNavigationOptions = isIOS
	? {
			headerBackButtonDisplayMode: 'minimal'
		}
	: {
			header: (props: NativeStackHeaderProps): ReactElement => createElement(Header, props)
		};

export const outsideHeaderRightLegal = (navigation: any, testID: string): NativeStackNavigationOptions =>
	isIOS
		? {
				unstable_headerRightItems: () => [
					{
						type: 'button',
						label: I18n.t('More'),
						accessibilityLabel: I18n.t('More'),
						icon: headerIcon('kebab'),
						onPress: () => navigation?.navigate('LegalView')
					}
				]
			}
		: {
				headerRight: (): ReactElement => createElement(HeaderButton.Legal, { testID, navigation })
			};

export const outsideHeaderLeftClose = (onPress: () => void, testID: string): NativeStackNavigationOptions =>
	isIOS
		? {
				unstable_headerLeftItems: () => [
					{
						type: 'button',
						label: I18n.t('Close'),
						accessibilityLabel: I18n.t('Close'),
						icon: headerIcon('close'),
						onPress
					}
				]
			}
		: {
				headerLeft: (): ReactElement => createElement(HeaderButton.CloseModal, { onPress, testID })
			};

export const drawerStyle = {
	width: 320
};

export const themedHeader = (theme: TSupportedThemes): NativeStackNavigationOptions =>
	isIOS
		? {}
		: {
				headerStyle: {
					backgroundColor: themes[theme].surfaceNeutral
				},
				headerTintColor: themes[theme].fontDefault,
				headerTitleStyle: { ...sharedStyles.textBold, color: themes[theme].fontTitlesLabels, fontSize: 16 }
			};

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
