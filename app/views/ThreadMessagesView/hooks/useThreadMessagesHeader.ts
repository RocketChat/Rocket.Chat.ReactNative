import { useLayoutEffect, useRef } from 'react';
import { type SearchBarCommands } from 'react-native-screens';

import I18n from '~/i18n';
import { useAppNavigation } from '~/lib/hooks/navigation';
import { useMasterDetail } from '~/lib/hooks/useMasterDetail';
import { hasNativeHeaderBar } from '~/lib/methods/helpers';
import { translucentHeader } from '~/lib/methods/helpers/navigation';
import { headerLeftCloseModal } from '~/lib/methods/helpers/navigation/headerActions';
import { searchHeaderOptions } from '~/lib/methods/helpers/navigation/searchHeaderOptions';
import { type ChatsStackParamList } from '~/stacks/types';
import { useTheme } from '~/theme';
import { Filter } from '../filters';

interface IUseThreadMessagesHeader {
	currentFilter: Filter;
	onFilterSelected: (filter: Filter) => void;
	isSearching: boolean;
	startSearch: () => void;
	cancelSearch: () => void;
	onSearchChangeText: (text: string) => void;
}

export const useThreadMessagesHeader = ({
	currentFilter,
	onFilterSelected,
	isSearching,
	startSearch,
	cancelSearch,
	onSearchChangeText
}: IUseThreadMessagesHeader) => {
	const navigation = useAppNavigation<ChatsStackParamList, 'ThreadMessagesView'>();
	const isMasterDetail = useMasterDetail();
	const { colors } = useTheme();
	const searchBarRef = useRef<SearchBarCommands>(null);
	const isSearchHeaderActive = !hasNativeHeaderBar && isSearching;
	const filterBadgeColor = colors.buttonBackgroundDangerDefault;

	useLayoutEffect(() => {
		navigation.setOptions(
			searchHeaderOptions({
				isSearching: isSearchHeaderActive,
				searchBarRef,
				onSearchPress: startSearch,
				onChangeText: onSearchChangeText,
				onCancel: cancelSearch,
				testIDPrefix: 'thread-messages-view',
				options: {
					headerTitle: I18n.t('Threads'),
					...translucentHeader,
					...(isMasterDetail ? headerLeftCloseModal(navigation) : { headerLeft: undefined })
				},
				rightActions: [
					{
						label: I18n.t('Filter'),
						icon: 'filter',
						badge: currentFilter !== Filter.All ? { color: filterBadgeColor } : undefined,
						menu: [Filter.All, Filter.Following, Filter.Unread].map(filter => ({
							label: I18n.t(filter),
							checked: currentFilter === filter,
							onPress: () => onFilterSelected(filter)
						}))
					}
				]
			})
		);
	}, [
		navigation,
		isMasterDetail,
		isSearchHeaderActive,
		currentFilter,
		filterBadgeColor,
		onFilterSelected,
		startSearch,
		cancelSearch,
		onSearchChangeText
	]);
};
