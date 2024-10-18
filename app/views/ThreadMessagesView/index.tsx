import React, { useEffect, useLayoutEffect, useState } from 'react';
import { FlatList } from 'react-native';
import { Observable } from 'rxjs';

import { IThreadMessagesViewProps, ISearchThreadMessages } from './definitions';
import { Filter } from './filters';
import { themes } from '../../lib/constants';
import { Services } from '../../lib/services';
import { useAppSelector } from '../../lib/hooks';
import { getBadgeColor, makeThreadName } from '../../lib/methods/helpers/room';
import { getUidDirectMessage, debounce, isIOS } from '../../lib/methods/helpers';
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
import styles from './styles';
import useThreadFilter from './hooks/useThreadFilter';
import getFilteredThreads from './utils/helper';
import useThreadSearch from './hooks/useeThreadSearch';

const ThreadMessagesView = ({ navigation, route }: IThreadMessagesViewProps) => {
	const viewName = ThreadMessagesView.name;
	const rid = route.params?.rid;
	let messagesObservable: Observable<TThreadModel[]> | any;
	const [currentFilter, setCurrentFilter] = useState(Filter.All);
	const [search, setSearch] = useState<ISearchThreadMessages>({} as ISearchThreadMessages);

	const { theme } = useTheme();
	const { user, useRealName, isMasterDetail } = useAppSelector(state => ({
		user: getUserSelector(state),
		useRealName: state.settings.UI_Use_Real_Name as boolean,
		isMasterDetail: state.app.isMasterDetail
	}));

	const {
		init,
		initSubscription,
		messages,
		subscription,
		displayingThreads,
		loadMore,
		loading,
		setDisplayingThreads,
		subscribeMessages,
		unsubscribeMessages
	} = useThreadMessages({
		user,
		messagesObservable,
		currentFilter,
		rid,
		search
	});

	const { initFilter, showFilters } = useThreadFilter({
		currentFilter,
		setCurrentFilter,
		user,
		messages,
		setDisplayingThreads,
		subscription
	});

	const { setHeader } = useThreadSearch({
		isMasterDetail,
		navigation,
		search,
		setSearch,
		showFilters,
		subscribeMessages
	});

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
			const updatedThreads = getFilteredThreads(user, messages, subscription, currentFilter);
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

	useLayoutEffect(() => {
		initSubscription();
		subscribeMessages({});
		init();
		initFilter();

		return () => {
			console.countReset(`${viewName}.render calls`);
			unsubscribeMessages();
		};
	}, [currentFilter]);

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
