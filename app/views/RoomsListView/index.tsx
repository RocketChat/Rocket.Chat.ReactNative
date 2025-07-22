import React, { memo, useEffect } from 'react';
import { FlatList, PixelRatio } from 'react-native';
import { useSafeAreaFrame } from 'react-native-safe-area-context';

import RoomItem from '../../containers/RoomItem';
import ActivityIndicator from '../../containers/ActivityIndicator';
import { useTheme } from '../../theme';
import { getUserSelector } from '../../selectors/login';
import { ISubscription } from '../../definitions';
import styles from './styles';
import ListHeader from './components/ListHeader';
import { getRoomAvatar, getRoomTitle, getUidDirectMessage, isRead, isIOS, isTablet } from '../../lib/methods/helpers';
import { DisplayMode, MAX_SIDEBAR_WIDTH } from '../../lib/constants';
import Container from './components/Container';
import { useSubscriptions } from './hooks/useSubscriptions';
import { useAppSelector } from '../../lib/hooks/useAppSelector';
import { useHeader } from './hooks/useHeader';

const INITIAL_NUM_TO_RENDER = isTablet ? 20 : 12;

const RoomsListView = memo(() => {
	console.count(`RoomsListView.render calls`);
	// const { loading, chats, search, searching } = this.state;
	// const { theme, refreshing, displayMode, supportedVersionsStatus, user } = this.props;
	useHeader();
	const searching = false;
	const search = [];
	const { colors } = useTheme();
	const { username } = useAppSelector(state => getUserSelector(state));
	const useRealName = useAppSelector(state => state.settings.UI_Use_Real_Name);
	const showLastMessage = useAppSelector(state => state.settings.Store_Last_Message);
	const { displayMode, showAvatar } = useAppSelector(state => state.sortPreferences);
	const isMasterDetail = false;
	const { width } = useSafeAreaFrame();
	const fontScale = PixelRatio.getFontScale();
	const rowHeight = 75 * fontScale;
	const rowHeightCondensed = 60 * fontScale;
	const height = displayMode === DisplayMode.Condensed ? rowHeightCondensed : rowHeight;
	const { subscriptions, loading } = useSubscriptions();

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

	const renderItem = ({ item }: { item: ISubscription }) => {
		// if (item.separator) {
		// 	return this.renderSectionHeader(item.rid);
		// }

		// const { item: currentItem } = this.state;
		// const {
		// 	user: { username },
		// 	StoreLastMessage,
		// 	useRealName,
		// 	isMasterDetail,
		// 	width,
		// 	showAvatar,
		// 	displayMode
		// } = this.props;
		const id = item.search && item.t === 'd' ? item._id : getUidDirectMessage(item);
		const swipeEnabled = false; // this.isSwipeEnabled(item);

		return (
			<RoomItem
				item={item}
				id={id}
				username={username}
				showLastMessage={showLastMessage}
				// onPress={this.onPressItem}
				width={isMasterDetail ? MAX_SIDEBAR_WIDTH : width}
				// toggleFav={this.toggleFav}
				// toggleRead={this.toggleRead}
				// hideChannel={this.hideChannel}
				useRealName={useRealName}
				getRoomTitle={getRoomTitle}
				getRoomAvatar={getRoomAvatar}
				getIsRead={isRead}
				// isFocused={currentItem?.rid === item.rid}
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
				getItemLayout={(_, index) => ({
					length: height,
					offset: height * index,
					index
				})}
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
