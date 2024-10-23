import { NativeStackNavigationOptions, NativeStackNavigationProp } from '@react-navigation/native-stack';

import I18n from '../../../i18n';
import * as HeaderButton from '../../../containers/HeaderButton';
import SearchHeader from '../../../containers/SearchHeader';
import { ChatsStackParamList } from '../../../stacks/types';
import { TNavigation } from '../../../stacks/stackType';
import { TSubscriptionModel } from '../../../definitions';
import { ISearchThreadMessages } from '../definitions';
import { useDebounce } from '../../../lib/methods/helpers';

interface IUseThreadSearch {
	isMasterDetail: boolean;
	navigation: NativeStackNavigationProp<ChatsStackParamList & TNavigation, 'ThreadMessagesView'>;
	search: ISearchThreadMessages;
	setSearch: (search: ISearchThreadMessages) => void;
	subscribeMessages: ({ subscription, searchText }: { subscription?: TSubscriptionModel; searchText?: string }) => void;
	showFilters: () => void;
}

const useThreadSearch = ({ isMasterDetail, navigation, search, setSearch, subscribeMessages, showFilters }: IUseThreadSearch) => {
	const getHeader = (triggerSearch?: boolean): NativeStackNavigationOptions => {
		if (search.isSearching || triggerSearch) {
			return {
				headerLeft: () => (
					<HeaderButton.Container left>
						<HeaderButton.Item iconName='close' onPress={onCancelSearchPress} />
					</HeaderButton.Container>
				),
				headerTitle: () => <SearchHeader onSearchChangeText={onSearchChangeText} testID='thread-messages-view-search-header' />,
				headerRight: () => null
			};
		}

		const options: NativeStackNavigationOptions = {
			headerLeft: () => null,
			headerTitle: I18n.t('Threads'),
			headerRight: () => (
				<HeaderButton.Container>
					<HeaderButton.Item iconName='filter' onPress={showFilters} />
					<HeaderButton.Item iconName='search' onPress={onSearchPress} testID='thread-messages-view-search-icon' />
				</HeaderButton.Container>
			)
		};

		if (isMasterDetail) {
			options.headerLeft = () => <HeaderButton.CloseModal navigation={navigation} />;
		}

		return options;
	};

	const setHeader = () => {
		const options = getHeader();
		navigation.setOptions(options);
	};

	const onSearchPress = () => {
		setSearch({ ...search, isSearching: true });
		const options = getHeader(true);
		navigation.setOptions(options);
	};

	const onSearchChangeText = useDebounce((searchText: string) => {
		setSearch({ isSearching: true, searchText });
		subscribeMessages({ searchText });
	}, 300);

	const onCancelSearchPress = () => {
		setSearch({
			isSearching: false,
			searchText: ''
		});
		setHeader();
		subscribeMessages({});
	};

	return {
		setHeader,
		onSearchPress,
		onSearchChangeText,
		onCancelSearchPress
	};
};

export default useThreadSearch;
