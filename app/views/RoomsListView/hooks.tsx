import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Keyboard, RefreshControl, Text, useWindowDimensions, View } from 'react-native';
import { useDispatch } from 'react-redux';
import { Subscription } from 'rxjs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp, RouteProp, useFocusEffect } from '@react-navigation/native';
import { LegendList, LegendListRef, LegendListRenderItemProps } from '@legendapp/list';

import database from '../../lib/database';
import RoomItem from '../../containers/RoomItem';
import log, { logEvent, events } from '../../lib/methods/helpers/log';
import I18n from '../../i18n';
import { closeSearchHeader, openSearchHeader, roomsRequest } from '../../actions/rooms';
import * as HeaderButton from '../../containers/HeaderButton';
import StatusBar from '../../containers/StatusBar';
import ActivityIndicator from '../../containers/ActivityIndicator';
import { animateNextTransition } from '../../lib/methods/helpers/layoutAnimation';
import { useTheme, withTheme } from '../../theme';
import { getUserSelector } from '../../selectors/login';
import { goRoom } from '../../lib/methods/helpers/goRoom';
import SafeAreaView from '../../containers/SafeAreaView';
import { getInquiryQueueSelector } from '../../ee/omnichannel/selectors/inquiry';
import { ISubscription, SubscriptionType, TSubscriptionModel } from '../../definitions';
import styles from './styles';
import ListHeader, { TEncryptionBanner } from './ListHeader';
import RoomsListHeaderView from './Header';
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
import { E2E_BANNER_TYPE, SortBy, MAX_SIDEBAR_WIDTH, themes, colors, textInputDebounceTime } from '../../lib/constants';
import { Services } from '../../lib/services';
import { SupportedVersionsExpired } from '../../containers/SupportedVersions';
import { ChangePasswordRequired } from '../../containers/ChangePasswordRequired';
import CustomHeader from '../../containers/CustomHeader';
import { useAppSelector } from '../../lib/hooks';
import useSubscription from './hooks/useSubscription';

interface IRoomItem extends ISubscription {
	search?: boolean;
	outside?: boolean;
}

const keyExtractor = (item: ISubscription, isSearching = false) => `${item.rid}-${isSearching}`;

type TNavigation = CompositeNavigationProp<
	NativeStackNavigationProp<ChatsStackParamList, 'RoomsListView'>,
	CompositeNavigationProp<NativeStackNavigationProp<ChatsStackParamList>, NativeStackNavigationProp<DrawerParamList>>
>;

interface IRoomsListViewProps {
	navigation: TNavigation;
	route: RouteProp<ChatsStackParamList, 'RoomsListView'>;
}

// PS: Just starting the hook migration and comparing with class components;

const RoomsListView = ({ navigation, route }: IRoomsListViewProps) => {
	//  header
	const getHeader = (): any => {
		if (searching) {
			return {
				headerLeft: () => (
					<HeaderButton.Container style={{ marginLeft: 1 }} left>
						<HeaderButton.Item iconName='close' onPress={cancelSearch} />
					</HeaderButton.Container>
				),
				headerTitle: () => <RoomsListHeaderView />,
				headerRight: () => null
			};
		}

		const getBadge = () => {
			if (supportedVersionsStatus === 'warn') {
				return <HeaderButton.BadgeWarn color={colors.buttonBackgroundDangerDefault} />;
			}
			if (notificationPresenceCap) {
				return <HeaderButton.BadgeWarn color={colors.userPresenceDisabled} />;
			}
			return null;
		};

		const disabled = supportedVersionsStatus === 'expired' || user.requirePasswordChange;

		return {
			headerLeft: () => (
				<HeaderButton.Drawer
					navigation={navigation}
					testID='rooms-list-view-sidebar'
					onPress={
						isMasterDetail
							? () => navigation.navigate('ModalStackNavigator', { screen: 'SettingsView' })
							: // @ts-ignore
							  () => navigation.toggleDrawer()
					}
					badge={() => getBadge()}
					disabled={disabled}
				/>
			),
			headerTitle: () => <RoomsListHeaderView />,
			headerRight: () => (
				<HeaderButton.Container>
					{issuesWithNotifications ? (
						<HeaderButton.Item
							iconName='notification-disabled'
							onPress={navigateToPushTroubleshootView}
							testID='rooms-list-view-push-troubleshoot'
							color={colors.fontDanger}
						/>
					) : null}
					{canCreateRoom ? (
						<HeaderButton.Item
							iconName='create'
							onPress={navigateToToNewMessage}
							testID='rooms-list-view-create-channel'
							disabled={disabled}
						/>
					) : null}
					<HeaderButton.Item iconName='search' onPress={initSearching} testID='rooms-list-view-search' disabled={disabled} />
					<HeaderButton.Item
						iconName='directory'
						onPress={navigateToDirectory}
						testID='rooms-list-view-directory'
						disabled={disabled}
					/>
				</HeaderButton.Container>
			)
		};
	};

	const setHeader = () => {
		const options = getHeader();
		navigation.setOptions(options);
	};
	const {
		user,
		StoreLastMessage,
		displayMode,
		encryptionBanner,
		inquiryEnabled,
		isMasterDetail,
		issuesWithNotifications,
		notificationPresenceCap,
		queueSize,
		refreshing,
		serverVersion,
		showAvatar,
		subscribedRoom,
		supportedVersionsStatus,
		useRealName,
		createPublicChannelPermission,
		createPrivateChannelPermission,
		createTeamPermission,
		createDirectMessagePermission,
		createDiscussionPermission
	} = useAppSelector(state => ({
		user: getUserSelector(state),
		isMasterDetail: state.app.isMasterDetail,
		notificationPresenceCap: state.app.notificationPresenceCap,
		supportedVersionsStatus: state.supportedVersions.status,
		server: state.server.server,
		changingServer: state.server.changingServer,
		searchText: state.rooms.searchText,
		loadingServer: state.server.loading,
		refreshing: state.rooms.refreshing,
		sortBy: state.sortPreferences.sortBy,
		groupByType: state.sortPreferences.groupByType,
		showFavorites: state.sortPreferences.showFavorites,
		showUnread: state.sortPreferences.showUnread,
		useRealName: state.settings.UI_Use_Real_Name as boolean,
		StoreLastMessage: state.settings.Store_Last_Message as boolean,
		subscribedRoom: state.room.subscribedRoom,
		queueSize: getInquiryQueueSelector(state).length,
		inquiryEnabled: state.inquiry.enabled,
		encryptionBanner: state.encryption.banner as TEncryptionBanner,
		showAvatar: state.sortPreferences.showAvatar,
		displayMode: state.sortPreferences.displayMode,
		createTeamPermission: state.permissions['create-team'],
		createDirectMessagePermission: state.permissions['create-d'],
		createPublicChannelPermission: state.permissions['create-c'],
		createPrivateChannelPermission: state.permissions['create-p'],
		createDiscussionPermission: state.permissions['start-discussion'],
		serverVersion: state.server.version,
		issuesWithNotifications: state.troubleshootingNotification.issuesWithNotifications
	}));
	const { colors } = useTheme();
	const dispatch = useDispatch();
	const { width } = useWindowDimensions();
	const [canCreateRoom, setCanCreateRoom] = useState<boolean>(false);
	const [loading, setLoading] = useState(true);
	const { chats, omnichannelUpdate, onEndReached } = useSubscription({ canCreateRoom, user, setHeader, setLoading });
	const [searching, setSearching] = useState<boolean>(false);
	const [searchResult, setSearch] = useState<IRoomItem[]>([]);

	const [item, setItem] = useState<ISubscription>({} as ISubscription);

	const scrollRef = useRef<LegendListRef>(null);

	const isSwipeEnabled = (item: IRoomItem) => !(item?.search || item?.joinCodeRequired || item?.outside);

	useFocusEffect(
		useCallback(() => {
			const onBackPress = () => {
				if (searching) {
					cancelSearch();
					return true;
				}
				return false;
			};

			const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
			return () => subscription.remove();
		}, [searching])
	);

	const scrollToTop = () => {
		if (scrollRef?.current?.scrollToOffset) {
			scrollRef?.current?.scrollToOffset({ offset: 0 });
		}
	};

	const handleBackPress = () => {
		if (searching) {
			cancelSearch();
			return true;
		}
		return false;
	};

	const onRefresh = () => {
		if (!searching) {
			dispatch(roomsRequest({ allData: true }));
		}
	};

	//  room item functions
	const onPressItem = (item = {} as ISubscription) => {
		if (!navigation.isFocused()) {
			return;
		}

		cancelSearch();
		navigateToRoom({ newItem: item, isMasterDetail });
	};

	const toggleFav = async (rid: string, favorite: boolean): Promise<void> => {
		logEvent(favorite ? events.RL_UNFAVORITE_CHANNEL : events.RL_FAVORITE_CHANNEL);
		try {
			const db = database.active;
			const result = await Services.toggleFavorite(rid, !favorite);
			if (result.success) {
				const subCollection = db.get('subscriptions');
				await db.write(async () => {
					try {
						const subRecord = await subCollection.find(rid);
						await subRecord.update(sub => {
							sub.f = !favorite;
						});
					} catch (e) {
						log(e);
					}
				});
			}
		} catch (e) {
			logEvent(events.RL_TOGGLE_FAVORITE_F);
			log(e);
		}
	};

	const toggleRead = async (rid: string, tIsRead: boolean) => {
		logEvent(tIsRead ? events.RL_UNREAD_CHANNEL : events.RL_READ_CHANNEL);
		try {
			const db = database.active;
			const includeThreads = compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '5.4.0');
			const result = await Services.toggleReadStatus(tIsRead, rid, includeThreads);

			if (result.success) {
				const subCollection = db.get('subscriptions');
				await db.write(async () => {
					try {
						const subRecord = await subCollection.find(rid);
						await subRecord.update(sub => {
							sub.alert = tIsRead;
							sub.unread = 0;
							if (includeThreads) {
								sub.tunread = [];
							}
						});
					} catch (e) {
						log(e);
					}
				});
			}
		} catch (e) {
			logEvent(events.RL_TOGGLE_READ_F);
			log(e);
		}
	};

	const hideChannel = async (rid: string, type: SubscriptionType) => {
		logEvent(events.RL_HIDE_CHANNEL);
		try {
			const db = database.active;
			const result = await Services.hideRoom(rid, type as RoomTypes);
			if (result.success) {
				const subCollection = db.get('subscriptions');
				await db.write(async () => {
					try {
						const subRecord = await subCollection.find(rid);
						await subRecord.destroyPermanently();
					} catch (e) {
						log(e);
					}
				});
			}
		} catch (e) {
			logEvent(events.RL_HIDE_CHANNEL_F);
			log(e);
		}
	};

	//  navigation
	const navigateToDirectory = () => {
		logEvent(events.RL_GO_DIRECTORY);
		if (isMasterDetail) {
			navigation.navigate('ModalStackNavigator', { screen: 'DirectoryView' });
		} else {
			navigation.navigate('DirectoryView');
		}
	};

	const navigateToPushTroubleshootView = () => {
		if (isMasterDetail) {
			navigation.navigate('ModalStackNavigator', { screen: 'PushTroubleshootView' });
		} else {
			navigation.navigate('PushTroubleshootView');
		}
	};

	const navigateToQueue = () => {
		logEvent(events.RL_GO_QUEUE);

		if (!inquiryEnabled) {
			return;
		}

		if (isMasterDetail) {
			navigation.navigate('ModalStackNavigator', { screen: 'QueueListView' });
		} else {
			navigation.navigate('QueueListView');
		}
	};

	const navigateToRoom = ({ newItem, isMasterDetail }: { newItem: ISubscription; isMasterDetail: boolean }) => {
		logEvent(events.RL_GO_ROOM);

		if (item?.rid === newItem.rid || subscribedRoom === newItem.rid) {
			return;
		}
		// Only mark room as focused when in master detail layout
		if (isMasterDetail) {
			setItem(newItem);
		}
		navigateToRoom({ newItem, isMasterDetail });
	};

	const navigateToToNewMessage = () => {
		logEvent(events.RL_GO_NEW_MSG);

		if (isMasterDetail) {
			navigation.navigate('ModalStackNavigator', { screen: 'NewMessageView' });
		} else {
			navigation.navigate('NewMessageStackNavigator');
		}
	};

	const navigateToEncryption = () => {
		logEvent(events.RL_GO_E2E_SAVE_PASSWORD);

		const isSavePassword = encryptionBanner === E2E_BANNER_TYPE.SAVE_PASSWORD;
		if (isMasterDetail) {
			const screen = isSavePassword ? 'E2ESaveYourPasswordView' : 'E2EEnterYourPasswordView';
			navigation.navigate('ModalStackNavigator', { screen });
		} else {
			const screen = isSavePassword ? 'E2ESaveYourPasswordStackNavigator' : 'E2EEnterYourPasswordStackNavigator';
			// @ts-ignore
			navigation.navigate(screen);
		}
	};

	// search
	const initSearching = () => {
		logEvent(events.RL_SEARCH);
		setSearching(true);
		dispatch(openSearchHeader());
		handleSearch('');
	};

	const handleSearch = debounce(async (text: string) => {
		setLoading(true);
		const result = await search({ text });

		// if the search was cancelled before the promise is resolved
		if (!searching) {
			return;
		}
		setLoading(false);
		setSearching(true);
		setSearch(result as IRoomItem[]);
		scrollToTop();
	}, textInputDebounceTime);

	const cancelSearch = () => {
		if (!searching) return;
		Keyboard.dismiss();
		setSearching(false);
		setSearch([]);
		dispatch(closeSearchHeader());
		setTimeout(() => {
			scrollToTop();
		}, 200);
	};

	const handleHasPermission = async () => {
		const permissions = [
			createPublicChannelPermission,
			createPrivateChannelPermission,
			createTeamPermission,
			createDirectMessagePermission,
			createDiscussionPermission
		];
		const permissionsToCreate = await hasPermission(permissions);
		const canCreateRoom = permissionsToCreate.filter((r: boolean) => r === true).length > 0;
		setCanCreateRoom(canCreateRoom);
		setHeader();
	};

	useEffect(() => {
		if (server !== previousServer && loadingServer && !previousLoadingServer) {
			setLoading(true);
		}

		if (changingServer && previousLoadingServer && !loadingServer) {
			getSubscriptions();
		}

		if (searchText !== previousSearchText) {
			handleSearch(searchText);
		}

		setPreviousLoadingServer(loadingServer);
		setPreviousSearchText(searchText);
		setPreviousServer(server);
	}, [server, loadingServer, changingServer, searchText]);

	useEffect(() => {
		handleHasPermission();
		const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

		return () => {
			backHandler.remove();
		};
	}, []);

	// elements to render
	const renderItem = ({ newItem }: { newItem: LegendListRenderItemProps<IRoomItem> }) => {
		const itemToRender = newItem.item;
		if (itemToRender.separator) {
			return renderSectionHeader(item.rid);
		}

		const id = itemToRender.search && item.t === 'd' ? item._id : getUidDirectMessage(newItem);
		const swipeEnabled = isSwipeEnabled(itemToRender);

		return (
			<RoomItem
				item={itemToRender}
				id={id}
				username={user.username}
				showLastMessage={StoreLastMessage}
				onPress={onPressItem}
				width={isMasterDetail ? MAX_SIDEBAR_WIDTH : width}
				toggleFav={toggleFav}
				toggleRead={toggleRead}
				hideChannel={hideChannel}
				useRealName={useRealName}
				getRoomTitle={getRoomTitle}
				getRoomAvatar={getRoomAvatar}
				getIsRead={isRead}
				isFocused={item?.rid === item.rid}
				swipeEnabled={swipeEnabled}
				showAvatar={showAvatar}
				displayMode={displayMode}
			/>
		);
	};

	const renderSectionHeader = (header: string) => {
		return (
			<View style={[styles.groupTitleContainer, { backgroundColor: colors.surfaceRoom }]}>
				<Text style={[styles.groupTitle, { color: colors.fontHint }]}>{I18n.t(header)}</Text>
			</View>
		);
	};

	const renderListHeader = () => {
		return (
			<ListHeader
				searching={searching as boolean}
				goEncryption={navigateToEncryption}
				goQueue={navigateToQueue}
				queueSize={queueSize}
				inquiryEnabled={inquiryEnabled}
				encryptionBanner={encryptionBanner}
				user={user}
			/>
		);
	};

	const renderScroll = () => {
		if (loading) {
			return <ActivityIndicator />;
		}

		if (supportedVersionsStatus === 'expired') {
			return <SupportedVersionsExpired />;
		}

		if (user.requirePasswordChange) {
			return <ChangePasswordRequired />;
		}

		return (
			<LegendList
				ref={scrollRef}
				waitForInitialLayout
				data={(searching ? search : chats) as IRoomItem[]}
				extraData={{ list: searching ? search : chats, displayMode, showAvatar }}
				keyExtractor={item => keyExtractor(item, searching)}
				style={[styles.list, { backgroundColor: colors.surfaceRoom }]}
				renderItem={item => renderItem({ newItem: item })}
				ListHeaderComponent={renderListHeader}
				keyboardShouldPersistTaps='always'
				refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.fontSecondaryInfo} />}
				onEndReached={onEndReached}
				onEndReachedThreshold={0.5}
				keyboardDismissMode={isIOS ? 'on-drag' : 'none'}
			/>
		);
	};

	const renderHeader = () => {
		if (!isMasterDetail) {
			return null;
		}

		const options = getHeader();
		return <CustomHeader options={options} navigation={navigation} route={route} />;
	};

	return (
		<SafeAreaView style={{ backgroundColor: colors.surfaceRoom }}>
			<StatusBar />
			{renderHeader()}
			{renderScroll()}
		</SafeAreaView>
	);
};

export default RoomsListView;
