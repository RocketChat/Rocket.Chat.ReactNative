import React, { memo, useContext, useEffect, useRef } from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { useSafeAreaFrame } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { shallowEqual } from 'react-redux';

import RoomItem from '../../containers/RoomItem';
import ActivityIndicator from '../../containers/ActivityIndicator';
import { useTheme } from '../../theme';
import { getUserSelector } from '../../selectors/login';
import { ISubscription } from '../../definitions';
import styles from './styles';
import ListHeader from './components/ListHeader';
import { getRoomAvatar, getRoomTitle, getUidDirectMessage, isRead, isIOS, isTablet } from '../../lib/methods/helpers';
import { MAX_SIDEBAR_WIDTH } from '../../lib/constants';
import Container from './components/Container';
import { useSubscriptions } from './hooks/useSubscriptions';
import { useAppSelector } from '../../lib/hooks/useAppSelector';
import { useHeader } from './hooks/useHeader';
import { events, logEvent } from '../../lib/methods/helpers/log';
import { goRoom } from '../../lib/methods/helpers/goRoom';
import { SectionHeader } from './components/SectionHeader';
import { useGetItemLayout } from './hooks/useGetItemLayout';
import { useRefresh } from './hooks/useRefresh';
import { RoomsProvider, RoomsContext } from './RoomsSearchProvider';
import { IRoomItem } from './definitions';

const INITIAL_NUM_TO_RENDER = isTablet ? 20 : 12;

const RoomsListView = memo(() => {
	console.count(`RoomsListView.render calls`);
	useHeader();
	const { searching, searchResults, stopSearch } = useContext(RoomsContext);
	const { colors } = useTheme();
	const username = useAppSelector(state => getUserSelector(state).username);
	const useRealName = useAppSelector(state => state.settings.UI_Use_Real_Name);
	const showLastMessage = useAppSelector(state => state.settings.Store_Last_Message);
	const { displayMode, showAvatar } = useAppSelector(state => state.sortPreferences, shallowEqual);
	const isMasterDetail = useAppSelector(state => state.app.isMasterDetail);
	const navigation = useNavigation();
	const { width } = useSafeAreaFrame();
	const getItemLayout = useGetItemLayout();
	const { subscriptions, loading } = useSubscriptions();
	const subscribedRoom = useAppSelector(state => state.room.subscribedRoom);
	const scrollRef = useRef<FlatList<ISubscription>>(null);
	const { refreshing, onRefresh } = useRefresh({ searching });

	// if (supportedVersionsStatus === 'expired') {
	// 	return (
	// 		<Container>
	// 			<SupportedVersionsExpired />
	// 		</Container>
	// 	);
	// }

	// if (user.requirePasswordChange) {
	// 	return (
	// 		<Container>
	// 			<ChangePasswordRequired />
	// 		</Container>
	// 	);
	// }

	useEffect(
		() => () => {
			console.countReset(`RoomsListView.render calls`);
		},
		[]
	);

	const onPressItem = (item = {} as IRoomItem) => {
		if (!navigation.isFocused()) {
			return;
		}
		if (item.rid === subscribedRoom) {
			return;
		}

		logEvent(events.RL_GO_ROOM);
		stopSearch();
		goRoom({ item, isMasterDetail });
	};

	const renderItem = ({ item }: { item: IRoomItem }) => {
		if (item.separator) {
			return <SectionHeader header={item.rid} />;
		}

		const id = item.search && item.t === 'd' ? item._id : getUidDirectMessage(item);
		// TODO: move to RoomItem
		const swipeEnabled = !(item?.search || item?.joinCodeRequired || item?.outside);

		return (
			<RoomItem
				item={item}
				id={id}
				username={username}
				showLastMessage={showLastMessage}
				onPress={onPressItem}
				width={isMasterDetail ? MAX_SIDEBAR_WIDTH : width}
				useRealName={useRealName}
				getRoomTitle={getRoomTitle}
				getRoomAvatar={getRoomAvatar}
				getIsRead={isRead}
				isFocused={subscribedRoom === item.rid}
				swipeEnabled={swipeEnabled}
				showAvatar={showAvatar}
				displayMode={displayMode}
			/>
		);
	};

	if (loading) {
		return <ActivityIndicator />;
	}

	return (
		<FlatList
			ref={scrollRef}
			data={searching ? searchResults : subscriptions}
			extraData={searching ? searchResults : subscriptions}
			keyExtractor={item => `${item.rid}-${searching}`}
			style={[styles.list, { backgroundColor: colors.surfaceRoom }]}
			renderItem={renderItem}
			ListHeaderComponent={ListHeader}
			getItemLayout={getItemLayout}
			removeClippedSubviews={isIOS}
			keyboardShouldPersistTaps='always'
			initialNumToRender={INITIAL_NUM_TO_RENDER}
			refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.fontSecondaryInfo} />}
			windowSize={9}
			onEndReachedThreshold={0.5}
			keyboardDismissMode={isIOS ? 'on-drag' : 'none'}
		/>
	);
});

const RoomsListViewWithProvider = memo(() => (
	<RoomsProvider>
		<Container>
			<RoomsListView />
		</Container>
	</RoomsProvider>
));

export default RoomsListViewWithProvider;
