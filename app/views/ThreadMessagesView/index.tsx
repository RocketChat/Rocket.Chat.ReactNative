import React, { useCallback, useEffect, useState } from 'react';
import { FlatList } from 'react-native';
import { NativeStackNavigationOptions } from '@react-navigation/native-stack';

import { IThreadMessagesViewProps, TSearchThreadMessages } from './types';
import { Filter } from './filters';
import { themes } from '../../lib/constants';
import { Services } from '../../lib/services';
import { useAppSelector } from '../../lib/hooks';
import { getBadgeColor, makeThreadName } from '../../lib/methods/helpers/room';
import { getUidDirectMessage, debounce, isIOS } from '../../lib/methods/helpers';
import { getUserSelector } from '../../selectors/login';
import { showActionSheetRef } from '../../containers/ActionSheet';
import { CustomIcon } from '../../containers/CustomIcon';
import { LISTENER } from '../../containers/Toast';
import { useTheme } from '../../theme';
import { SubscriptionType, TSubscriptionModel, TThreadModel } from '../../definitions';
import ActivityIndicator from '../../containers/ActivityIndicator';
import StatusBar from '../../containers/StatusBar';
import SafeAreaView from '../../containers/SafeAreaView';
import * as HeaderButton from '../../containers/HeaderButton';
import * as List from '../../containers/List';
import SearchHeader from '../../containers/SearchHeader';
import log from '../../lib/methods/helpers/log';
import EventEmitter from '../../lib/methods/helpers/events';
import UserPreferences from '../../lib/methods/userPreferences';
import I18n from '../../i18n';
import Item from './components/Item';
import EmptyThreads from './components/EmptyThreads';
import useThreadMessages from './hooks/useThreadMessages';
import styles from './styles';

const THREADS_FILTER = 'threadsFilter';

const ThreadMessagesView = ({ navigation, route }: IThreadMessagesViewProps) => {
	const viewName = ThreadMessagesView.name;
	const rid = route.params?.rid;

	const { theme } = useTheme();
	const { user, useRealName, isMasterDetail } = useAppSelector(state => ({
		user: getUserSelector(state),
		useRealName: state.settings.UI_Use_Real_Name as boolean,
		isMasterDetail: state.app.isMasterDetail
	}));

	const [search, setSearch] = useState<TSearchThreadMessages>({} as TSearchThreadMessages);
	const [currentFilter, setCurrentFilter] = useState(Filter.All);

	// helper to query threads
	const getFilteredThreads = (
		messages: TThreadModel[],
		subscription?: TSubscriptionModel,
		currentFilter?: Filter
	): TThreadModel[] => {
		if (currentFilter === Filter.Following) {
			return messages.filter(item => item?.replies?.find(u => u === user.id));
		}
		if (currentFilter === Filter.Unread) {
			return messages?.filter(item => subscription?.tunread?.includes(item?.id));
		}
		return messages;
	};

	// filter
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

	const onFilterSelected = useCallback((filter: Filter) => {
		const displayingThreads = getFilteredThreads(messages, subscription, filter);
		setCurrentFilter(filter);
		setDisplayingThreads(displayingThreads);
		UserPreferences.setString(THREADS_FILTER, filter);
	}, []);

	// search
	const onSearchPress = () => {
		setSearch({ ...search, isSearching: true });
		const options = getHeader(true);
		navigation.setOptions(options);
	};

	const onSearchChangeText = debounce((searchText: string) => {
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

	// header
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

	// thread
	const onThreadPress = debounce(
		(item: any) => {
			if (isMasterDetail) {
				navigation.pop();
			}
			navigation.push('RoomView', {
				rid: item.subscription.id,
				tmid: item.id,
				name: makeThreadName(item),
				t: SubscriptionType.THREAD,
				roomUserId: getUidDirectMessage(subscription)
			});
		},
		1000,
		true
	);

	const toggleFollowThread = async (isFollowingThread: boolean, tmid: string) => {
		try {
			await Services.toggleFollowMessage(tmid, !isFollowingThread);
			EventEmitter.emit(LISTENER, { message: isFollowingThread ? I18n.t('Unfollowed_thread') : I18n.t('Following_thread') });
			const updatedThreads = getFilteredThreads(messages, subscription, currentFilter);
			setDisplayingThreads(updatedThreads);
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

	const { messages, subscription, displayingThreads, loadMore, loading, setDisplayingThreads, subscribeMessages } =
		useThreadMessages({
			rid,
			getFilteredThreads,
			currentFilter,
			initFilter,
			search,
			viewName
		});

	useEffect(() => {
		setHeader();
	}, [messages, currentFilter]);

	console.count(`${ThreadMessagesView.name}.render calls`);

	return (
		<SafeAreaView testID='thread-messages-view'>
			<StatusBar />
			{!messages?.length || !displayingThreads?.length ? (
				<EmptyThreads currentFilter={currentFilter} />
			) : (
				<FlatList
					keyExtractor={item => item.id}
					extraData={displayingThreads}
					data={displayingThreads}
					renderItem={renderItem}
					style={[styles.list, { backgroundColor: themes[theme].surfaceRoom }]}
					contentContainerStyle={styles.contentContainer}
					onEndReached={loadMore}
					onEndReachedThreshold={0.5}
					maxToRenderPerBatch={5}
					windowSize={10}
					initialNumToRender={7}
					removeClippedSubviews={isIOS}
					ItemSeparatorComponent={List.Separator}
					ListFooterComponent={loading ? <ActivityIndicator /> : null}
					scrollIndicatorInsets={{ right: 1 }} // https://github.com/facebook/react-native/issues/26610#issuecomment-539843444
				/>
			)}
		</SafeAreaView>
	);
};

export default ThreadMessagesView;
