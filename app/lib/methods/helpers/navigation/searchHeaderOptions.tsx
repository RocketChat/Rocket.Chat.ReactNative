import { type RefObject } from 'react';
import { type NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { type SearchBarCommands } from 'react-native-screens';

import * as HeaderButton from '~/containers/Header/components/HeaderButton';
import SearchHeader from '~/containers/SearchHeader';
import I18n from '~/i18n';
import { hasNativeHeaderBar } from '~/lib/methods/helpers/deviceInfo';
import { headerRightActions, type IHeaderAction } from './headerActions';
import { stackedSearchBarOptions } from './index';

interface ISearchHeaderOptionsParams {
	isSearching: boolean;
	searchBarRef: RefObject<SearchBarCommands | null>;
	onSearchPress: () => void;
	onChangeText: (text: string) => void;
	onCancel: () => void;
	testIDPrefix?: string;
	options: NativeStackNavigationOptions;
	rightActions?: IHeaderAction[];
}

export const searchHeaderOptions = ({
	isSearching,
	searchBarRef,
	onSearchPress,
	onChangeText,
	onCancel,
	testIDPrefix,
	options,
	rightActions = []
}: ISearchHeaderOptionsParams): NativeStackNavigationOptions => {
	if (hasNativeHeaderBar) {
		return {
			...options,
			headerSearchBarOptions: stackedSearchBarOptions({ ref: searchBarRef, onFocus: onSearchPress, onChangeText, onCancel }),
			...headerRightActions(rightActions)
		};
	}
	if (isSearching) {
		return {
			headerLeft: () => (
				<HeaderButton.Container left>
					<HeaderButton.Item iconName='close' onPress={onCancel} />
				</HeaderButton.Container>
			),
			headerTitle: () => (
				<SearchHeader onSearchChangeText={onChangeText} testID={testIDPrefix && `${testIDPrefix}-search-header`} />
			),
			headerRight: () => null
		};
	}
	const searchAction: IHeaderAction = {
		label: I18n.t('Search'),
		icon: 'search',
		testID: testIDPrefix && `${testIDPrefix}-search`,
		onPress: onSearchPress
	};
	return { ...options, ...headerRightActions([...rightActions, searchAction]) };
};
