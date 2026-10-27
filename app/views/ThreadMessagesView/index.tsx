import { useEffect, useRef, useState } from 'react';
import { FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { type SearchBarCommands } from 'react-native-screens';

import { type IThreadMessagesViewProps, type ISearchThreadMessages } from './definitions';
import { Filter } from './filters';
import { themes, colors } from '~/lib/constants/colors';
import { textInputDebounceTime } from '~/lib/constants/debounceConfig';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { useMasterDetail } from '~/lib/hooks/useMasterDetail';
import { getBadgeColor, makeThreadName } from '~/lib/methods/helpers/room';
import { getUidDirectMessage, hasNativeHeaderBar, isIOS, useDebounce } from '~/lib/methods/helpers';
import { getUserSelector } from '~/selectors/login';
import { useTheme } from '~/theme';
import { SubscriptionType, type TThreadModel } from '~/definitions';
import UserPreferences from '~/lib/methods/userPreferences';
import ActivityIndicator from '~/containers/ActivityIndicator';
import SafeAreaView from '~/containers/SafeAreaView';
import * as List from '~/containers/List';
import I18n from '~/i18n';
import Item from './components/Item';
import EmptyThreads from './components/EmptyThreads';
import styles from './styles';
import useSubscription from './hooks/useSubscription';
import useThreads from './hooks/useThreads';
import { headerLeftCloseModal } from '~/lib/methods/helpers/navigation/headerActions';
import { nativeHeaderContentInset, translucentHeader } from '~/lib/methods/helpers/navigation';
import { searchHeaderOptions } from '~/lib/methods/helpers/navigation/searchHeaderOptions';
import getFilteredThreads from './methods/getFilteredThreads';
import Navigation from '~/lib/navigation/appNavigation';
import { toggleFollowThread as toggleFollowThreadService } from '~/lib/methods/toggleFollowThread';

const THREADS_FILTER = 'threadsFilter';

const ThreadMessagesView = ({ navigation, route }: IThreadMessagesViewProps) => {
	const rid = route.params?.rid;
	const [currentFilter, setCurrentFilter] = useState(Filter.All);
	const [search, setSearch] = useState<ISearchThreadMessages>({
		searchText: '',
		isSearching: false
	});
	const { theme } = useTheme();
	const isMasterDetail = useMasterDetail();
	const insets = useSafeAreaInsets();
	const searchBarRef = useRef<SearchBarCommands>(null);
	const { user, useRealName } = useAppSelector(state => ({
		user: getUserSelector(state),
		useRealName: state.settings.UI_Use_Real_Name as boolean
	}));
	const { subscription, subscriptionLoaded } = useSubscription({ rid });
	const { threads, loading, loadMore, handleThreadsSubscription } = useThreads({
		rid,
		search,
		subscription,
		subscriptionLoaded
	});

	const setHeader = (isSearching = search.isSearching) => {
		navigation.setOptions(
			searchHeaderOptions({
				isSearching,
				searchBarRef,
				onSearchPress,
				onChangeText: onSearchChangeText,
				onCancel: onCancelSearchPress,
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
						badge: currentFilter !== Filter.All ? { color: colors[theme].buttonBackgroundDangerDefault } : undefined,
						menu: [Filter.All, Filter.Following, Filter.Unread].map(filter => ({
							label: I18n.t(filter),
							checked: currentFilter === filter,
							onPress: () => onFilterSelected(filter)
						}))
					}
				]
			})
		);
	};

	const initFilter = () => {
		const savedFilter = UserPreferences.getString(THREADS_FILTER);
		if (savedFilter) {
			setCurrentFilter(savedFilter as Filter);
		}
	};

	const onFilterSelected = (filter: Filter) => {
		setCurrentFilter(filter);
		UserPreferences.setString(THREADS_FILTER, filter);
	};

	const onSearchPress = () => {
		setSearch({ ...search, isSearching: true });
		if (!hasNativeHeaderBar) {
			setHeader(true);
		}
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
		if (!hasNativeHeaderBar) {
			setHeader(false);
		}
		handleThreadsSubscription({});
	};

	const onThreadPress = useDebounce(
		(item: TThreadModel) => {
			Navigation.popToRoom(isMasterDetail);
			Navigation.push('RoomView', {
				rid: item.subscription?.id,
				tmid: item.id,
				name: makeThreadName(item),
				t: SubscriptionType.THREAD,
				roomUserId: getUidDirectMessage(subscription)
			});
		},
		1000,
		{ leading: true, trailing: false }
	);

	const toggleFollowThread = async (isFollowingThread: boolean, tmid: string) => {
		await toggleFollowThreadService(tmid, isFollowingThread);
		handleThreadsSubscription({ searchText: search.searchText });
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
				contentContainerStyle={[styles.contentContainer, { paddingBottom: hasNativeHeaderBar ? 0 : insets.bottom }]}
				onEndReachedThreshold={0.5}
				maxToRenderPerBatch={5}
				windowSize={10}
				initialNumToRender={7}
				onEndReached={loadMore}
				removeClippedSubviews={isIOS}
				contentInsetAdjustmentBehavior={nativeHeaderContentInset}
				ListEmptyComponent={<EmptyThreads currentFilter={currentFilter} />}
				ItemSeparatorComponent={List.Separator}
				ListFooterComponent={loading ? <ActivityIndicator /> : null}
				scrollIndicatorInsets={{ right: 1 }} // https://github.com/facebook/react-native/issues/26610#issuecomment-539843444
			/>
		</SafeAreaView>
	);
};

export default ThreadMessagesView;
