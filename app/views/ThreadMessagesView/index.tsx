import { useState } from 'react';
import { FlatList } from 'react-native';
import { shallowEqual } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ActivityIndicator from '~/containers/ActivityIndicator';
import * as List from '~/containers/List';
import SafeAreaView from '~/containers/SafeAreaView';
import { SubscriptionType } from '~/definitions';
import { useAppRoute } from '~/lib/hooks/navigation';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { useMasterDetail } from '~/lib/hooks/useMasterDetail';
import { getUidDirectMessage, hasNativeHeaderBar, isIOS, useDebounce } from '~/lib/methods/helpers';
import { nativeHeaderContentInset } from '~/lib/methods/helpers/navigation';
import { getBadgeColor, makeThreadName } from '~/lib/methods/helpers/room';
import { toggleFollowThread } from '~/lib/methods/toggleFollowThread';
import Navigation from '~/lib/navigation/appNavigation';
import { getUserSelector } from '~/selectors/login';
import { type ChatsStackParamList } from '~/stacks/types';
import { useTheme } from '~/theme';
import EmptyThreads from './components/EmptyThreads';
import Item from './components/Item';
import { type Filter } from './filters';
import { useRoomSubscription } from './hooks/useRoomSubscription';
import { useThreadMessagesHeader } from './hooks/useThreadMessagesHeader';
import { useThreads } from './hooks/useThreads';
import { useThreadsSearch } from './hooks/useThreadsSearch';
import getFilteredThreads from './methods/getFilteredThreads';
import { readSavedFilter, saveFilter } from './methods/savedFilter';
import styles from './styles';
import { type TThreadRow } from './types';

const ThreadMessagesView = () => {
	const {
		params: { rid }
	} = useAppRoute<ChatsStackParamList, 'ThreadMessagesView'>();
	const { theme, colors } = useTheme();
	const { bottom } = useSafeAreaInsets();
	const isMasterDetail = useMasterDetail();
	const { user, useRealName } = useAppSelector(
		state => ({
			user: getUserSelector(state),
			useRealName: state.settings.UI_Use_Real_Name as boolean
		}),
		shallowEqual
	);
	const [currentFilter, setCurrentFilter] = useState(readSavedFilter);
	const { isSearching, searchText, startSearch, cancelSearch, onSearchChangeText } = useThreadsSearch();
	const { subscription, unreads } = useRoomSubscription(rid);
	const { threads, loading, loadMore } = useThreads({ rid, subscription, searchText });

	const onFilterSelected = (filter: Filter) => {
		setCurrentFilter(filter);
		saveFilter(filter);
	};
	useThreadMessagesHeader({ currentFilter, onFilterSelected, isSearching, startSearch, cancelSearch, onSearchChangeText });

	const onThreadPress = useDebounce(
		(thread: TThreadRow) => {
			Navigation.popToRoom(isMasterDetail);
			Navigation.push('RoomView', {
				rid,
				tmid: thread.id,
				name: makeThreadName(thread),
				t: SubscriptionType.THREAD,
				roomUserId: getUidDirectMessage(subscription)
			});
		},
		1000,
		{ leading: true, trailing: false }
	);

	const renderItem = ({ item }: { item: TThreadRow }) => (
		<Item
			item={item}
			user={user}
			useRealName={useRealName}
			badgeColor={getBadgeColor({ subscription: unreads, theme, messageId: item.id })}
			onPress={onThreadPress}
			toggleFollowThread={(isFollowingThread, threadId) => toggleFollowThread(threadId, isFollowingThread)}
		/>
	);

	const displayedThreads = getFilteredThreads(threads, user.id, unreads, currentFilter);

	return (
		<SafeAreaView testID='thread-messages-view'>
			<FlatList
				keyExtractor={thread => thread.id}
				data={displayedThreads}
				renderItem={renderItem}
				style={[styles.list, { backgroundColor: colors.surfaceRoom }]}
				contentContainerStyle={[styles.contentContainer, { paddingBottom: hasNativeHeaderBar ? 0 : bottom }]}
				onEndReached={loadMore}
				onEndReachedThreshold={0.5}
				maxToRenderPerBatch={5}
				windowSize={10}
				initialNumToRender={7}
				removeClippedSubviews={isIOS}
				contentInsetAdjustmentBehavior={nativeHeaderContentInset}
				ItemSeparatorComponent={List.Separator}
				ListEmptyComponent={<EmptyThreads currentFilter={currentFilter} loading={loading} />}
				ListFooterComponent={loading && displayedThreads.length ? <ActivityIndicator /> : null}
				scrollIndicatorInsets={{ right: 1 }} // https://github.com/facebook/react-native/issues/26610#issuecomment-539843444
			/>
		</SafeAreaView>
	);
};

export default ThreadMessagesView;
