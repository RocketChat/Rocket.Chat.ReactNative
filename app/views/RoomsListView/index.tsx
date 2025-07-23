import React, { memo, useEffect } from 'react';
import { FlatList } from 'react-native';
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

const INITIAL_NUM_TO_RENDER = isTablet ? 20 : 12;

const RoomsListView = memo(() => {
	console.count(`RoomsListView.render calls`);
	useHeader();
	const searching = false;
	const search = [];
	const { colors } = useTheme();
	const username = useAppSelector(state => getUserSelector(state).username);
	const useRealName = useAppSelector(state => state.settings.UI_Use_Real_Name);
	const showLastMessage = useAppSelector(state => state.settings.Store_Last_Message);
	const { displayMode, showAvatar } = useAppSelector(state => state.sortPreferences, shallowEqual);
	const isMasterDetail = false;
	const navigation = useNavigation();
	const { width } = useSafeAreaFrame();
	const getItemLayout = useGetItemLayout();
	const { subscriptions, loading } = useSubscriptions();
	const subscribedRoom = useAppSelector(state => state.room.subscribedRoom);

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

	const onPressItem = (item = {} as ISubscription) => {
		if (!navigation.isFocused()) {
			return;
		}
		if (item.rid === subscribedRoom) {
			return;
		}

		logEvent(events.RL_GO_ROOM);

		// this.cancelSearch();
		goRoom({ item, isMasterDetail });
	};

	const renderItem = ({ item }: { item: ISubscription }) => {
		if (item.separator) {
			return <SectionHeader header={item.rid} />;
		}

		const id = item.search && item.t === 'd' ? item._id : getUidDirectMessage(item);
		const swipeEnabled = false; // this.isSwipeEnabled(item);

		return (
			<RoomItem
				item={item}
				id={id}
				username={username}
				showLastMessage={showLastMessage}
				onPress={onPressItem}
				width={isMasterDetail ? MAX_SIDEBAR_WIDTH : width}
				// toggleFav={this.toggleFav}
				// toggleRead={this.toggleRead}
				// hideChannel={this.hideChannel}
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
		return (
			<Container>
				<ActivityIndicator />
			</Container>
		);
	}

	return (
		<Container>
			<FlatList
				// ref={this.getScrollRef}
				data={searching ? search : subscriptions}
				extraData={searching ? search : subscriptions}
				keyExtractor={item => `${item.rid}-${searching}`}
				style={[styles.list, { backgroundColor: colors.surfaceRoom }]}
				renderItem={renderItem}
				ListHeaderComponent={() => <ListHeader searching={searching} />}
				getItemLayout={getItemLayout}
				removeClippedSubviews={isIOS}
				keyboardShouldPersistTaps='always'
				initialNumToRender={INITIAL_NUM_TO_RENDER}
				// refreshControl={
				// 	<RefreshControl refreshing={refreshing} onRefresh={this.onRefresh} tintColor={themes[theme].fontSecondaryInfo} />
				// }
				windowSize={9}
				// onEndReached={this.onEndReached}
				onEndReachedThreshold={0.5}
				keyboardDismissMode={isIOS ? 'on-drag' : 'none'}
			/>
		</Container>
	);
});

export default RoomsListView;
