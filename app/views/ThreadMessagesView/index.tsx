import { useEffect, useRef, useState } from 'react';
import { FlatList } from 'react-native';
import { type Subscription } from 'rxjs';
import { type NativeStackNavigationOptions } from '@react-navigation/native-stack';

import { type IThreadMessagesViewProps, type ISearchThreadMessages } from './definitions';
import { Filter } from './filters';
import { themes, colors } from '../../lib/constants/colors';
import { textInputDebounceTime } from '../../lib/constants/debounceConfig';
import { useAppSelector } from '../../lib/hooks/useAppSelector';
import { useMasterDetail } from '../../lib/hooks/useMasterDetail';
import { showActionSheetRef } from '../../containers/ActionSheet';
import { CustomIcon } from '../../containers/CustomIcon';
import { getBadgeColor, makeThreadName } from '../../lib/methods/helpers/room';
import { getUidDirectMessage, isIOS, useDebounce } from '../../lib/methods/helpers';
import { getUserSelector } from '../../selectors/login';
import { LISTENER } from '../../containers/Toast';
import { useTheme } from '../../theme';
import { SubscriptionType, type TThreadModel } from '../../definitions';
import UserPreferences from '../../lib/methods/userPreferences';
import ActivityIndicator from '../../containers/ActivityIndicator';
import SafeAreaView from '../../containers/SafeAreaView';
import * as List from '../../containers/List';
import log from '../../lib/methods/helpers/log';
import EventEmitter from '../../lib/methods/helpers/events';
import I18n from '../../i18n';
import Item from './components/Item';
import EmptyThreads from './components/EmptyThreads';
import styles from './styles';
import useSubscription from './hooks/useSubscription';
import useThreads from './hooks/useThreads';
import * as HeaderButton from '../../containers/Header/components/HeaderButton';
import SearchHeader from '../../containers/SearchHeader';
import getFilteredThreads from './methods/getFilteredThreads';
import Navigation from '../../lib/navigation/appNavigation';
import { toggleFollowMessage } from '../../lib/services/restApi';

const THREADS_FILTER = 'threadsFilter';

const ThreadMessagesView = ({ navigation, route }: IThreadMessagesViewProps) => {
	const rid = route.params?.rid;
	const threadsSubscription = useRef<Subscription | null>(null);
	const [currentFilter, setCurrentFilter] = useState(Filter.All);
	const [search, setSearch] = useState<ISearchThreadMessages>({
		searchText: '',
		isSearching: false
	} as ISearchThreadMessages);
	const { theme } = useTheme();
	const isMasterDetail = useMasterDetail();
	const { user, useRealName } = useAppSelector(state => ({
		user: getUserSelector(state),
		useRealName: state.settings.UI_Use_Real_Name as boolean
	}));
	const { subscription } = useSubscription({ rid, user, threadsSubscription });
	const { threads, loading, loadMore, handleThreadsSubscription } = useThreads({
		currentFilter,
		threadsSubscription,
		rid,
		search,
		subscription
	});

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
			headerLeft: undefined,
			headerTitle: I18n.t('Threads'),
			headerRight: () => (
				<HeaderButton.Container>
					<HeaderButton.Item
						accessibilityLabel={I18n.t('Filter')}
						iconName='filter'
						onPress={showFilters}
						badge={() =>
							currentFilter !== Filter.All ? <HeaderButton.BadgeWarn color={colors[theme].buttonBackgroundDangerDefault} /> : null
						}
					/>
					<HeaderButton.Item
						accessibilityLabel={I18n.t('Search')}
						iconName='search'
						onPress={onSearchPress}
						testID='thread-messages-view-search-icon'
					/>
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

	const initFilter = () => {
		const savedFilter = UserPreferences.getString(THREADS_FILTER);
		if (savedFilter) {
			setCurrentFilter(savedFilter as Filter);
		}
	};

	const showFilters = () => {
		showActionSheetRef({
			options: [
				{
					title: I18n.t(Filter.All),
					right: currentFilter === Filter.All ? () => <CustomIcon name='check' size={24} /> : undefined,
					onPress: () => onFilterSelected(Filter.All)
				},
				{
					title: I18n.t(Filter.Following),
					right: currentFilter === Filter.Following ? () => <CustomIcon name='check' size={24} /> : undefined,
					onPress: () => onFilterSelected(Filter.Following)
				},
				{
					title: I18n.t(Filter.Unread),
					right: currentFilter === Filter.Unread ? () => <CustomIcon name='check' size={24} /> : undefined,
					onPress: () => onFilterSelected(Filter.Unread)
				}
			]
		});
	};

	const onFilterSelected = (filter: Filter) => {
		setCurrentFilter(filter);
		UserPreferences.setString(THREADS_FILTER, filter);
	};

	const onSearchPress = () => {
		setSearch({ ...search, isSearching: true });
		const options = getHeader(true);
		navigation.setOptions(options);
	};

	const onSearchChangeText = useDebounce((searchText: string) => {
		setSearch({ isSearching: true, searchText });
		handleThreadsSubscription({ searchText });
	}, textInputDebounceTime);

	const onCancelSearchPress = () => {
		setSearch({
			isSearching: false,
			searchText: ''
		});
		setHeader();
		handleThreadsSubscription({});
	};

	const onThreadPress = useDebounce((item: any) => {
		Navigation.popToRoom(isMasterDetail);
		Navigation.push('RoomView', {
			rid: item.subscription.id,
			tmid: item.id,
			name: makeThreadName(item),
			t: SubscriptionType.THREAD,
			roomUserId: getUidDirectMessage(subscription)
		});
	}, 1000);

	const toggleFollowThread = async (isFollowingThread: boolean, tmid: string) => {
		try {
			await toggleFollowMessage(tmid, !isFollowingThread);
			EventEmitter.emit(LISTENER, { message: isFollowingThread ? I18n.t('Unfollowed_thread') : I18n.t('Following_thread') });
			handleThreadsSubscription({});
		} catch (e) {
			log(e);
		}
	};

	const renderItem = ({ item }: { item: TThreadModel }) => {
		const badgeColor = getBadgeColor({ subscription, theme, messageId: item?.id });
		return (
			<Item
				{...{
					item,
					user,
					navigation,
					useRealName,
					badgeColor
				}}
				onPress={onThreadPress}
				toggleFollowThread={toggleFollowThread}
			/>
		);
	};

	useEffect(() => {
		initFilter();
	}, []);

	useEffect(() => {
		setHeader();
	}, [currentFilter]);

	return (
		<SafeAreaView testID='thread-messages-view'>
			<FlatList
				keyExtractor={item => item.id}
				data={getFilteredThreads(user, threads, subscription, currentFilter)}
				renderItem={renderItem}
				style={[styles.list, { backgroundColor: themes[theme].surfaceRoom }]}
				contentContainerStyle={styles.contentContainer}
				onEndReachedThreshold={0.5}
				maxToRenderPerBatch={5}
				windowSize={10}
				initialNumToRender={7}
				onEndReached={loadMore}
				removeClippedSubviews={isIOS}
				ListEmptyComponent={<EmptyThreads currentFilter={currentFilter} />}
				ItemSeparatorComponent={List.Separator}
				ListFooterComponent={loading ? <ActivityIndicator /> : null}
				scrollIndicatorInsets={{ right: 1 }} // https://github.com/facebook/react-native/issues/26610#issuecomment-539843444
			/>
		</SafeAreaView>
	);
};

export default ThreadMessagesView;
