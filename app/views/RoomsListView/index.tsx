import React, { memo, useContext, useEffect } from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { useSafeAreaFrame } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { shallowEqual } from 'react-redux';

import RoomItem from '../../containers/RoomItem';
import ActivityIndicator from '../../containers/ActivityIndicator';
import { useTheme } from '../../theme';
import { getUserSelector } from '../../selectors/login';
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
import { SupportedVersionsExpired } from '../../containers/SupportedVersions';
import { ChangePasswordRequired } from '../../containers/ChangePasswordRequired';
import BackgroundContainer from '../../containers/BackgroundContainer';
import i18n from '../../i18n';

const INITIAL_NUM_TO_RENDER = isTablet ? 20 : 12;

const RoomsListView = memo(function RoomsListView() {
	console.count(`RoomsListView.render calls`);
	useHeader();
	const { searching, searchEnabled, searchResults, stopSearch } = useContext(RoomsContext);
	const { colors } = useTheme();
	const username = useAppSelector(state => getUserSelector(state).username);
	const requirePasswordChange = useAppSelector(state => getUserSelector(state).requirePasswordChange);
	const useRealName = useAppSelector(state => state.settings.UI_Use_Real_Name) as boolean;
	const showLastMessage = useAppSelector(state => state.settings.Store_Last_Message) as boolean;
	const { displayMode, showAvatar } = useAppSelector(state => state.sortPreferences, shallowEqual);
	const isMasterDetail = useAppSelector(state => state.app.isMasterDetail);
	const navigation = useNavigation();
	const { width } = useSafeAreaFrame();
	const getItemLayout = useGetItemLayout();
	const { subscriptions, loading } = useSubscriptions();
	const subscribedRoom = useAppSelector(state => state.room.subscribedRoom);
	const changingServer = useAppSelector(state => state.server.changingServer);
	const { refreshing, onRefresh } = useRefresh({ searching });
	const supportedVersionsStatus = useAppSelector(state => state.supportedVersions.status);

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
				// TODO: move to RoomItem
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

	if (searchEnabled) {
		if (searching) {
			return <ActivityIndicator />;
		}
		if (searchResults.length === 0) {
			return <BackgroundContainer text={i18n.t('No_rooms_found')} />;
		}
	}

	if (loading || changingServer) {
		return <ActivityIndicator />;
	}

	if (supportedVersionsStatus === 'expired') {
		return <SupportedVersionsExpired />;
	}

	if (requirePasswordChange) {
		return <ChangePasswordRequired />;
	}

	return (
		<FlatList
			data={searchEnabled ? searchResults : subscriptions}
			extraData={searchEnabled ? searchResults : subscriptions}
			keyExtractor={item => `${item.rid}-${searchEnabled}`}
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

const RoomsListViewWithProvider = () => (
	<RoomsProvider>
		<Container>
			<RoomsListView />
		</Container>
	</RoomsProvider>
);

export default memo(RoomsListViewWithProvider);
