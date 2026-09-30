import { createElement, type ReactElement, type RefObject } from 'react';
import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { type NativeStackHeaderProps, type NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { type SearchBarCommands, type SearchBarProps } from 'react-native-screens';

import { themes } from '~/lib/constants/colors';
import { type TSupportedThemes } from '~/theme';
import sharedStyles from '~/views/Styles';
import Header from '~/containers/Header';
import I18n from '~/i18n';
import { hasNativeHeaderBar } from '~/lib/methods/helpers';
import { headerLeftActions, headerRightActions } from './headerActions';

export const defaultHeader: NativeStackNavigationOptions = hasNativeHeaderBar
	? {
			headerBackButtonDisplayMode: 'minimal'
		}
	: {
			header: (props: NativeStackHeaderProps): ReactElement => createElement(Header, props)
		};

export const outsideHeaderRightLegal = (
	navigation: { navigate: (screen: 'LegalView') => void },
	testID: string
): NativeStackNavigationOptions =>
	headerRightActions([{ label: I18n.t('More'), icon: 'kebab', testID, onPress: () => navigation.navigate('LegalView') }]);

interface IStackedSearchBarOptions {
	ref?: RefObject<SearchBarCommands | null>;
	onFocus?: () => void;
	onChangeText: (text: string) => void;
	onCancel?: () => void;
	onSearch?: () => void;
}

export const stackedSearchBarOptions = ({
	ref,
	onFocus,
	onChangeText,
	onCancel,
	onSearch
}: IStackedSearchBarOptions): SearchBarProps => ({
	ref,
	placement: 'stacked',
	hideWhenScrolling: false,
	placeholder: I18n.t('Search'),
	onFocus,
	onChangeText: event => onChangeText(event.nativeEvent.text),
	onSearchButtonPress: onSearch,
	onCancelButtonPress: onCancel ?? (() => onChangeText(''))
});

export const outsideHeaderLeftClose = (onPress: () => void, testID?: string): NativeStackNavigationOptions =>
	headerLeftActions([{ label: I18n.t('Close'), icon: 'close', testID, onPress }]);

export const themedHeader = (theme: TSupportedThemes): NativeStackNavigationOptions => ({
	headerStyle: {
		backgroundColor: themes[theme].surfaceNeutral
	},
	...(!hasNativeHeaderBar && {
		headerTintColor: themes[theme].fontDefault,
		headerTitleStyle: { ...sharedStyles.textBold, color: themes[theme].fontTitlesLabels, fontSize: 16 }
	})
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
