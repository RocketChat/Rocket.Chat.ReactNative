import { useNavigation } from '@react-navigation/native';
import React, { memo, useContext } from 'react';
import { RefreshControl } from 'react-native';
import { useSafeAreaFrame } from 'react-native-safe-area-context';
import { shallowEqual } from 'react-redux';
import { FlashList } from '@shopify/flash-list';

import ActivityIndicator from '../../containers/ActivityIndicator';
import BackgroundContainer from '../../containers/BackgroundContainer';
import { ChangePasswordRequired } from '../../containers/ChangePasswordRequired';
import RoomItem from '../../containers/RoomItem';
import { type IRoomItem } from '../../containers/RoomItem/interfaces';
import { SupportedVersionsExpired } from '../../containers/SupportedVersions';
import i18n from '../../i18n';
import { MAX_SIDEBAR_WIDTH } from '../../lib/constants';
import { useAppSelector } from '../../lib/hooks/useAppSelector';
import { getRoomAvatar, getRoomTitle, getUidDirectMessage, isIOS, isRead } from '../../lib/methods/helpers';
import { goRoom } from '../../lib/methods/helpers/goRoom';
import { events, logEvent } from '../../lib/methods/helpers/log';
import { getUserSelector } from '../../selectors/login';
import { useTheme } from '../../theme';
import Container from './components/Container';
import ListHeader from './components/ListHeader';
import SectionHeader from './components/SectionHeader';
import RoomsSearchProvider, { RoomsSearchContext } from './contexts/RoomsSearchProvider';
import { useHeader } from './hooks/useHeader';
import { useRefresh } from './hooks/useRefresh';
import { useSubscriptions } from './hooks/useSubscriptions';

const RoomsListView = memo(function RoomsListView() {
	useHeader();
	const { searching, searchEnabled, searchResults, stopSearch } = useContext(RoomsSearchContext);
	const { colors } = useTheme();
	const username = useAppSelector(state => getUserSelector(state).username);
	const requirePasswordChange = useAppSelector(state => getUserSelector(state).requirePasswordChange);
	const useRealName = useAppSelector(state => state.settings.UI_Use_Real_Name) as boolean;
	const showLastMessage = useAppSelector(state => state.settings.Store_Last_Message) as boolean;
	const { displayMode, showAvatar } = useAppSelector(state => state.sortPreferences, shallowEqual);
	const isMasterDetail = useAppSelector(state => state.app.isMasterDetail);
	const navigation = useNavigation();
	const { width } = useSafeAreaFrame();
	const { subscriptions, loading } = useSubscriptions();
	const subscribedRoom = useAppSelector(state => state.room.subscribedRoom);
	const changingServer = useAppSelector(state => state.server.changingServer);
	const { refreshing, onRefresh } = useRefresh({ searching });
	const supportedVersionsStatus = useAppSelector(state => state.supportedVersions.status);

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
		return <ChangePasswordRequired navigation={navigation} />;
	}

	return (
		<FlashList
			data={searchEnabled ? searchResults : subscriptions}
			extraData={searchEnabled ? searchResults : subscriptions}
			keyExtractor={item => `${item.rid}-${searchEnabled}`}
			renderItem={renderItem}
			ListHeaderComponent={ListHeader}
			removeClippedSubviews={isIOS}
			keyboardShouldPersistTaps='always'
			refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.fontSecondaryInfo} />}
			onEndReachedThreshold={0.5}
			keyboardDismissMode={isIOS ? 'on-drag' : 'none'}
		/>
	);
});

const RoomsListViewWithProvider = () => (
	<RoomsSearchProvider>
		<Container>
			<RoomsListView />
		</Container>
	</RoomsSearchProvider>
);

export default memo(RoomsListViewWithProvider);
