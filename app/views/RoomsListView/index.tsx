import { useNavigation } from '@react-navigation/native';
import { memo, useContext, useEffect } from 'react';
import { BackHandler, Platform, RefreshControl } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context';
import { shallowEqual } from 'react-redux';

import ActivityIndicator from '~/containers/ActivityIndicator';
import BackgroundContainer from '~/containers/BackgroundContainer';
import { ChangePasswordRequired } from '~/containers/ChangePasswordRequired';
import { FLOATING_ACTION_BUTTON_CLEARANCE } from '~/containers/FloatingActionButton';
import { type IRoomItem } from '~/containers/RoomItem/interfaces';
import { SupportedVersionsExpired } from '~/containers/SupportedVersions';
import i18n from '~/i18n';
import { MAX_SIDEBAR_WIDTH } from '~/lib/constants/tablet';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { useMasterDetail } from '~/lib/hooks/useMasterDetail';
import {
	getRoomAvatar,
	getRoomTitle,
	getUidDirectMessage,
	hasNativeHeaderBar,
	isIOS,
	isRead,
	isTablet
} from '~/lib/methods/helpers';
import { goRoom } from '~/lib/methods/helpers/goRoom';
import { events, logEvent } from '~/lib/methods/helpers/log';
import { getUserSelector } from '~/selectors/login';
import { useTheme } from '~/theme';
import Container from './components/Container';
import ListHeader from './components/ListHeader';
import NewMessageButton from './components/NewMessageButton';
import SectionHeader from './components/SectionHeader';
import SectionRevealFooter from './components/SectionRevealFooter';
import SectionRoomItem from './components/SectionRoomItem';
import RoomsSearchProvider, { RoomsSearchContext } from './contexts/RoomsSearchProvider';
import { useCollapsedGroups } from './hooks/useCollapsedGroups';
import { useGetItemLayout } from './hooks/useGetItemLayout';
import { useHeader } from './hooks/useHeader';
import { useNewMessage } from './hooks/useNewMessage';
import { useRefresh } from './hooks/useRefresh';
import { SECTION_REFLOW, useSectionToggleAnimation } from './hooks/useSectionToggleAnimation';
import { useSubscriptions } from './hooks/useSubscriptions';
import styles from './styles';

const INITIAL_NUM_TO_RENDER = isTablet ? 20 : 12;

const RoomsListView = memo(function RoomsListView() {
	useHeader();
	const { searching, searchEnabled, searchResults, stopSearch } = useContext(RoomsSearchContext);
	const { colors } = useTheme();
	const username = useAppSelector(state => getUserSelector(state).username);
	const requirePasswordChange = useAppSelector(state => getUserSelector(state).requirePasswordChange);
	const useRealName = useAppSelector(state => state.settings.UI_Use_Real_Name) as boolean;
	const showLastMessage = useAppSelector(state => state.settings.Store_Last_Message) as boolean;
	const { displayMode, showAvatar } = useAppSelector(state => state.sortPreferences, shallowEqual);
	const isMasterDetail = useMasterDetail();
	const navigation = useNavigation();
	const { width } = useSafeAreaFrame();
	const { bottom } = useSafeAreaInsets();
	const getItemLayout = useGetItemLayout();
	const { collapsedGroups, toggleGroup } = useCollapsedGroups();
	const { subscriptions, loading } = useSubscriptions(collapsedGroups);
	const { onToggle, rowEntering, rowExiting, badgeEntering, badgeExiting, revealKey, coverEntering, coverExiting } =
		useSectionToggleAnimation(collapsedGroups, toggleGroup, subscriptions.length);
	const subscribedRoom = useAppSelector(state => state.room.subscribedRoom);
	const changingServer = useAppSelector(state => state.server.changingServer);
	const { refreshing, onRefresh } = useRefresh({ searching });
	const supportedVersionsStatus = useAppSelector(state => state.supportedVersions.status);
	const { canCreateRoom, goToNewMessage } = useNewMessage();
	const showNewMessageButton = !hasNativeHeaderBar && canCreateRoom && !searchEnabled;

	useEffect(() => {
		const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
			if (searchEnabled) {
				stopSearch();
				navigation.goBack();
				return true;
			}
			return false;
		});
		return () => subscription.remove();
	}, [searchEnabled]);

	const onPressItem = (item = {} as IRoomItem) => {
		if (!isMasterDetail && !navigation.isFocused()) {
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
			return (
				<SectionHeader
					header={item.rid}
					title={item.name}
					collapsed={item.collapsed ?? false}
					unread={item.unread}
					userMentions={item.userMentions}
					groupMentions={item.groupMentions}
					tunread={item.tunread}
					tunreadUser={item.tunreadUser}
					tunreadGroup={item.tunreadGroup}
					onToggle={onToggle}
					badgeEntering={badgeEntering}
					badgeExiting={badgeExiting}
				/>
			);
		}

		const id = item.search && item.t === 'd' ? item._id : getUidDirectMessage(item);
		// TODO: move to RoomItem
		const swipeEnabled = !(item?.search || item?.joinCodeRequired || item?.outside);

		return (
			<SectionRoomItem
				entering={rowEntering}
				exiting={rowExiting}
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
				isFocused={isMasterDetail && subscribedRoom === item.rid}
				swipeEnabled={swipeEnabled}
				showAvatar={showAvatar}
				displayMode={displayMode}
			/>
		);
	};

	if (searchEnabled && searchResults.length === 0) {
		if (searching) {
			return <ActivityIndicator />;
		}
		return <BackgroundContainer text={i18n.t('No_rooms_found')} />;
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
		<>
			<Animated.FlatList
				data={searchEnabled ? searchResults : subscriptions}
				keyExtractor={item => `${item.rid}-${searchEnabled}`}
				style={[styles.list, { backgroundColor: colors.surfaceRoom }]}
				contentContainerStyle={{
					paddingBottom:
						Platform.select({ ios: 0, default: bottom }) + (showNewMessageButton ? FLOATING_ACTION_BUTTON_CLEARANCE : 0)
				}}
				renderItem={renderItem}
				itemLayoutAnimation={SECTION_REFLOW}
				ListHeaderComponent={ListHeader}
				ListFooterComponent={
					searching ? (
						<ActivityIndicator />
					) : (
						<SectionRevealFooter revealKey={revealKey} entering={coverEntering} exiting={coverExiting} />
					)
				}
				removeClippedSubviews={false}
				getItemLayout={getItemLayout}
				contentInsetAdjustmentBehavior={isIOS ? 'automatic' : undefined}
				keyboardShouldPersistTaps='always'
				initialNumToRender={INITIAL_NUM_TO_RENDER}
				refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.fontSecondaryInfo} />}
				windowSize={9}
				onEndReachedThreshold={0.5}
				keyboardDismissMode={isIOS ? 'on-drag' : 'none'}
			/>
			{showNewMessageButton ? <NewMessageButton onPress={goToNewMessage} /> : null}
		</>
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
