import React, { memo, useEffect } from 'react';
import { BackHandler, FlatList, Keyboard, NativeEventSubscription, PixelRatio, RefreshControl, Text, View } from 'react-native';
import { connect, useSelector } from 'react-redux';
import { dequal } from 'dequal';
import { Q } from '@nozbe/watermelondb';
import { useSafeAreaFrame, withSafeAreaInsets } from 'react-native-safe-area-context';
import { Subscription } from 'rxjs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp, RouteProp } from '@react-navigation/native';
import { Dispatch } from 'redux';

import database from '../../lib/database';
import RoomItem from '../../containers/RoomItem';
import log, { logEvent, events } from '../../lib/methods/helpers/log';
import I18n from '../../i18n';
import { closeSearchHeader, openSearchHeader, roomsRequest } from '../../actions/rooms';
import * as HeaderButton from '../../containers/Header/components/HeaderButton';
import ActivityIndicator from '../../containers/ActivityIndicator';
import { animateNextTransition } from '../../lib/methods/helpers/layoutAnimation';
import { TSupportedThemes, useTheme, withTheme } from '../../theme';
import { getUserSelector } from '../../selectors/login';
import { goRoom } from '../../lib/methods/helpers/goRoom';
import { withDimensions } from '../../dimensions';
import { getInquiryQueueSelector } from '../../ee/omnichannel/selectors/inquiry';
import { IApplicationState, ISubscription, IUser, TSVStatus, SubscriptionType, TSubscriptionModel } from '../../definitions';
import styles from './styles';
import ListHeader, { TEncryptionBanner } from './components/ListHeader';
import RoomsListHeaderView from './components/Header';
import { ChatsStackParamList, DrawerParamList } from '../../stacks/types';
import { RoomTypes, search } from '../../lib/methods';
import {
	getRoomAvatar,
	getRoomTitle,
	getUidDirectMessage,
	hasPermission,
	isRead,
	debounce,
	isIOS,
	isTablet,
	compareServerVersion
} from '../../lib/methods/helpers';
import {
	E2E_BANNER_TYPE,
	DisplayMode,
	SortBy,
	MAX_SIDEBAR_WIDTH,
	themes,
	colors,
	textInputDebounceTime
} from '../../lib/constants';
import { Services } from '../../lib/services';
import { SupportedVersionsExpired } from '../../containers/SupportedVersions';
import { ChangePasswordRequired } from '../../containers/ChangePasswordRequired';
import Header from '../../containers/Header';
import Container from './components/Container';
import { useSubscriptions } from './hooks/useSubscriptions';
import { useAppSelector } from '../../lib/hooks/useAppSelector';

const INITIAL_NUM_TO_RENDER = isTablet ? 20 : 12;

const RoomsListView = memo(() => {
	console.count(`RoomsListView.render calls`);
	// const { loading, chats, search, searching } = this.state;
	// const { theme, refreshing, displayMode, supportedVersionsStatus, user } = this.props;
	const searching = false;
	const search = [];
	const { colors } = useTheme();
	const username = useAppSelector(state => getUserSelector(state).username);
	const useRealName = useAppSelector(state => state.settings.UI_Use_Real_Name);
	const showLastMessage = useAppSelector(state => state.settings.Store_Last_Message);
	const { sortBy, displayMode, showAvatar } = useAppSelector(state => state.sortPreferences);
	const isMasterDetail = false;
	const { width } = useSafeAreaFrame();
	const fontScale = PixelRatio.getFontScale();
	const rowHeight = 75 * fontScale;
	const rowHeightCondensed = 60 * fontScale;
	const { subscriptions } = useSubscriptions({ isGrouping: false, sortBy });
	const height = displayMode === DisplayMode.Condensed ? rowHeightCondensed : rowHeight;

	// if (loading) {
	// 	return (
	// 		<Container>
	// 			<ActivityIndicator />
	// 		</Container>
	// 	);
	// }

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

	useEffect(() => {
		console.count(`RoomsListView.render calls`);
	}, []);

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

	// const getItemLayout = (data: ArrayLike<ISubscription> | null | undefined, index: number, height: number) => ({
	// 	length: height,
	// 	offset: height * index,
	// 	index
	// });

	return (
		<Container>
			<FlatList
				// ref={this.getScrollRef}
				data={searching ? search : subscriptions}
				extraData={searching ? search : subscriptions}
				keyExtractor={item => `${item.rid}-${searching}`}
				style={[styles.list, { backgroundColor: colors.surfaceRoom }]}
				renderItem={renderItem}
				// ListHeaderComponent={this.renderListHeader}
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
