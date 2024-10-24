import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { FlatList } from 'react-native';
import { Observable, Subscription } from 'rxjs';

import { IThreadMessagesViewProps, ISearchThreadMessages } from './definitions';
import { Filter } from './filters';
import { themes } from '../../lib/constants';
import { Services } from '../../lib/services';
import { useAppSelector } from '../../lib/hooks';
import UserPreferences from '../../lib/methods/userPreferences';
import { showActionSheetRef } from '../../containers/ActionSheet';
import { CustomIcon } from '../../containers/CustomIcon';
import { getBadgeColor, makeThreadName } from '../../lib/methods/helpers/room';
import { getUidDirectMessage, isIOS, useDebounce } from '../../lib/methods/helpers';
import { getUserSelector } from '../../selectors/login';
import { LISTENER } from '../../containers/Toast';
import { useTheme } from '../../theme';
import { SubscriptionType, TThreadModel } from '../../definitions';
import ActivityIndicator from '../../containers/ActivityIndicator';
import StatusBar from '../../containers/StatusBar';
import SafeAreaView from '../../containers/SafeAreaView';
import * as List from '../../containers/List';
import log from '../../lib/methods/helpers/log';
import EventEmitter from '../../lib/methods/helpers/events';
import I18n from '../../i18n';
import Item from './components/Item';
import EmptyThreads from './components/EmptyThreads';
import useThreadMessages from './hooks/useThreadMessages';
import getFilteredThreads from './methods/getFilteredThreads';
import useThreadSearch from './hooks/useThreadSearch';
import styles from './styles';
import useSubscription from './hooks/useSubscription';
import useThreads from './hooks/useThreads';

const THREADS_FILTER = 'threadsFilter';

const ThreadMessagesView = ({ navigation, route }: IThreadMessagesViewProps) => {
	const viewName = ThreadMessagesView.name;
	const rid = route.params?.rid;
	let messagesObservable: Observable<TThreadModel[]> | any;
	const messagesSubscription = useRef<Subscription | null>(null);
	const [currentFilter, setCurrentFilter] = useState(Filter.All);
	const [search, setSearch] = useState<ISearchThreadMessages>({
		searchText: '',
		isSearching: false
	} as ISearchThreadMessages);

	const { theme } = useTheme();
	const { user, useRealName, isMasterDetail } = useAppSelector(state => ({
		user: getUserSelector(state),
		useRealName: state.settings.UI_Use_Real_Name as boolean,
		isMasterDetail: state.app.isMasterDetail
	}));
	const { subscription } = useSubscription({ rid, currentFilter, user, messagesSubscription });
	const { messages, loading, loadMore } = useThreads({
		currentFilter,
		messagesObservable,
		messagesSubscription,
		rid,
		search,
		subscription
	});

	/* 	const { init, messages, subscription, subscribeMessages, displayingThreads, loadMore, loading, setDisplayingThreads } =
		useThreadMessages({
			user,
			messagesObservable,
			currentFilter,
			rid,
			search
		});

	const initFilter = () => {
		const savedFilter = UserPreferences.getString(THREADS_FILTER);
		if (savedFilter) {
			setCurrentFilter(savedFilter as Filter);
		}
	};

	const onFilterSelected = useCallback(
		(filter: Filter) => {
			const displayingThreads = getFilteredThreads(user, messages, subscription, filter);
			setCurrentFilter(filter);
			setDisplayingThreads(displayingThreads);
			UserPreferences.setString(THREADS_FILTER, filter);
		},
		[messages, subscription]
	);

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

	const onThreadPress = useDebounce((item: any) => {
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
	}, 1000);

	const toggleFollowThread = async (isFollowingThread: boolean, tmid: string) => {
		try {
			await Services.toggleFollowMessage(tmid, !isFollowingThread);
			EventEmitter.emit(LISTENER, { message: isFollowingThread ? I18n.t('Unfollowed_thread') : I18n.t('Following_thread') });
			const updatedThreads = getFilteredThreads(user, messages, subscription, currentFilter);
			setDisplayingThreads(updatedThreads);
		} catch (e) {
			log(e);
		}
	};

	const { setHeader } = useThreadSearch({
		isMasterDetail,
		navigation,
		search,
		setSearch,
		showFilters,
		subscribeMessages
	});
 */

	const onThreadPress = () => {};
	const toggleFollowThread = () => {};

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
	/* useLayoutEffect(() => {
		init();
		initFilter();

		return () => {
			console.countReset(`${viewName}.render calls`);
		};
	}, [currentFilter]);

	useEffect(() => {
		setHeader();
	}, [messages, currentFilter]); */

	console.count(`${ThreadMessagesView.name}.render calls`);

	return (
		<SafeAreaView testID='thread-messages-view'>
			<StatusBar />
			{!messages?.length ? (
				<EmptyThreads currentFilter={currentFilter} />
			) : (
				<FlatList
					keyExtractor={item => item.id}
					data={messages}
					renderItem={renderItem}
					style={[styles.list, { backgroundColor: themes[theme].surfaceRoom }]}
					contentContainerStyle={styles.contentContainer}
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
