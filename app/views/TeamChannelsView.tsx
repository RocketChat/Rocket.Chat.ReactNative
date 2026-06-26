import { Q } from '@nozbe/watermelondb';
import { type NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { Alert, FlatList, Keyboard, PixelRatio, useWindowDimensions } from 'react-native';
import { shallowEqual, useDispatch } from 'react-redux';
import { useEffect, useReducer } from 'react';

import { deleteRoom } from '../actions/room';
import { type DisplayMode } from '../lib/constants/constantDisplayMode';
import { textInputDebounceTime } from '../lib/constants/debounceConfig';
import { type TActionSheetOptionsItem, useActionSheet } from '../containers/ActionSheet';
import ActivityIndicator from '../containers/ActivityIndicator';
import BackgroundContainer from '../containers/BackgroundContainer';
import * as HeaderButton from '../containers/Header/components/HeaderButton';
import RoomHeader from '../containers/RoomHeader';
import SafeAreaView from '../containers/SafeAreaView';
import SearchHeader from '../containers/SearchHeader';
import { type TSubscriptionModel } from '../definitions';
import { ERoomType } from '../definitions/ERoomType';
import { useMasterDetail } from '../lib/hooks/useMasterDetail';
import { useAppSelector } from '../lib/hooks/useAppSelector';
import { useAppNavigation, useAppRoute } from '../lib/hooks/navigation';
import I18n from '../i18n';
import database from '../lib/database';
import { CustomIcon } from '../containers/CustomIcon';
import RoomItem from '../containers/RoomItem';
import { type ChatsStackParamList } from '../stacks/types';
import { useTheme } from '../theme';
import { goRoom } from '../lib/methods/helpers/goRoom';
import { showErrorAlert } from '../lib/methods/helpers/info';
import log, { events, logEvent } from '../lib/methods/helpers/log';
import { getRoomAvatar, getRoomTitle, hasPermission, useDebounce, isIOS, compareServerVersion } from '../lib/methods/helpers';
import { getRoomInfo, getTeamListRoom, updateTeamRoom, removeTeamRoom } from '../lib/services/restApi';

const API_FETCH_COUNT = 25;

const EMPTY_PERMISSION: string[] = [];

const getItemLayout = (data: ArrayLike<IItem> | null | undefined, index: number) => {
	const rowHeight = 75 * PixelRatio.getFontScale();
	return {
		length: data?.length || 0,
		offset: rowHeight * index,
		index
	};
};
const keyExtractor = (item: IItem) => item._id;

export interface IItem {
	_id: ERoomType;
	fname: string;
	customFields: object;
	broadcast: boolean;
	encrypted: boolean;
	name: string;
	t: string;
	msgs: number;
	usersCount: number;
	u: { _id: string; name: string };
	ts: string;
	ro: boolean;
	teamId: string;
	default: boolean;
	sysMes: boolean;
	_updatedAt: string;
	teamDefault: boolean;
}

interface ITeamChannelsViewState {
	loading: boolean;
	loadingMore: boolean;
	data: IItem[];
	isSearching: boolean;
	searchText: string | null;
	search: IItem[];
	end: boolean;
	showCreate: boolean;
	team: TSubscriptionModel | null;
}

interface ITeamChannelsViewSelector {
	serverVersion: string;
	useRealName: boolean;
	StoreLastMessage: boolean;
	addTeamChannelPermission: string[];
	moveRoomToTeamPermission: string[];
	editTeamChannelPermission: string[];
	removeTeamChannelPermission: string[];
	createCPermission: string[];
	createTeamChannelPermission: string[];
	createPPermission: string[];
	createTeamGroupPermission: string[];
	deleteCPermission: string[];
	deletePPermission: string[];
	showAvatar: boolean;
	displayMode: DisplayMode;
}

const initialState: ITeamChannelsViewState = {
	loading: true,
	loadingMore: false,
	data: [],
	isSearching: false,
	searchText: '',
	search: [],
	end: false,
	showCreate: false,
	team: null
};

type TeamChannelsStateUpdate =
	| Partial<ITeamChannelsViewState>
	| ((state: ITeamChannelsViewState) => Partial<ITeamChannelsViewState>);

const stateReducer = (state: ITeamChannelsViewState, update: TeamChannelsStateUpdate): ITeamChannelsViewState => ({
	...state,
	...(typeof update === 'function' ? update(state) : update)
});

const TeamChannelsView = () => {
	'use memo';

	const navigation = useAppNavigation<ChatsStackParamList, 'TeamChannelsView'>();
	const {
		params: { teamId, joined }
	} = useAppRoute<ChatsStackParamList, 'TeamChannelsView'>();

	const { colors } = useTheme();
	const { showActionSheet } = useActionSheet();
	const isMasterDetail = useMasterDetail();
	const dispatch = useDispatch();
	const { width } = useWindowDimensions();

	const {
		serverVersion,
		useRealName,
		StoreLastMessage,
		addTeamChannelPermission,
		moveRoomToTeamPermission,
		editTeamChannelPermission,
		removeTeamChannelPermission,
		createCPermission,
		createTeamChannelPermission,
		createPPermission,
		createTeamGroupPermission,
		deleteCPermission,
		deletePPermission,
		showAvatar,
		displayMode
	} = useAppSelector(
		(state): ITeamChannelsViewSelector => ({
			serverVersion: state.server.version as string,
			useRealName: state.settings.UI_Use_Real_Name as boolean,
			StoreLastMessage: state.settings.Store_Last_Message as boolean,
			addTeamChannelPermission: state.permissions['add-team-channel'] ?? EMPTY_PERMISSION,
			moveRoomToTeamPermission: state.permissions['move-room-to-team'] ?? EMPTY_PERMISSION,
			editTeamChannelPermission: state.permissions['edit-team-channel'] ?? EMPTY_PERMISSION,
			removeTeamChannelPermission: state.permissions['remove-team-channel'] ?? EMPTY_PERMISSION,
			createCPermission: state.permissions['create-c'] ?? EMPTY_PERMISSION,
			createTeamChannelPermission: state.permissions['create-team-channel'] ?? EMPTY_PERMISSION,
			createPPermission: state.permissions['create-p'] ?? EMPTY_PERMISSION,
			createTeamGroupPermission: state.permissions['create-team-group'] ?? EMPTY_PERMISSION,
			deleteCPermission: state.permissions['delete-c'] ?? EMPTY_PERMISSION,
			deletePPermission: state.permissions['delete-p'] ?? EMPTY_PERMISSION,
			showAvatar: state.sortPreferences.showAvatar,
			displayMode: state.sortPreferences.displayMode
		}),
		shallowEqual
	);

	const [state, updateState] = useReducer(stateReducer, initialState);
	const { loading, loadingMore, data, isSearching, searchText, search, showCreate, team } = state;

	const load = useDebounce(async () => {
		// Safe: useDebounce forwards the latest committed closure via an internal ref, so `state` here is current.
		const { loadingMore, data, search, isSearching, searchText, end } = state;
		const length = isSearching ? search.length : data.length;
		if (loadingMore || end) {
			return;
		}

		updateState({ loadingMore: true });
		try {
			const result = await getTeamListRoom({
				teamId,
				offset: length,
				count: API_FETCH_COUNT,
				type: 'all',
				filter: searchText
			});

			if (result.success) {
				const newState: Partial<ITeamChannelsViewState> = {
					loading: false,
					loadingMore: false,
					end: result.rooms.length < API_FETCH_COUNT
				};

				if (isSearching) {
					newState.search = [...search, ...result.rooms] as IItem[];
				} else {
					newState.data = [...data, ...result.rooms] as IItem[];
				}

				updateState(newState);
			} else {
				updateState({ loading: false, loadingMore: false });
			}
		} catch (e) {
			log(e);
			updateState({ loading: false, loadingMore: false });
		}
	}, 300);

	const onSearchChangeText = useDebounce((text: string) => {
		updateState({
			searchText: text,
			search: [],
			loading: !!text,
			loadingMore: false,
			end: false
		});
		if (text) {
			load();
		}
	}, textInputDebounceTime);

	useEffect(() => {
		if (!team) {
			return;
		}

		const onSearchPress = () => {
			logEvent(events.TC_SEARCH);
			updateState({ isSearching: true });
		};

		const onCancelSearchPress = () => {
			logEvent(events.TC_CANCEL_SEARCH);
			if (!isSearching) {
				return;
			}
			Keyboard.dismiss();
			updateState({
				searchText: null,
				isSearching: false,
				search: [],
				loadingMore: false,
				end: false
			});
		};

		const goRoomActionsView = (screen?: string) => {
			logEvent(events.TC_GO_ACTIONS);
			if (isMasterDetail && screen) {
				navigation.navigate('ModalStackNavigator', {
					screen: 'RoomActionsView',
					params: {
						rid: team.rid,
						t: team.t,
						room: team,
						joined
					}
				});
			} else {
				navigation.navigate('RoomActionsView', {
					rid: team.rid,
					t: team.t,
					room: team,
					joined
				});
			}
		};

		if (isSearching) {
			const options: NativeStackNavigationOptions = {
				headerLeft: () => (
					<HeaderButton.Container left>
						<HeaderButton.Item iconName='close' onPress={onCancelSearchPress} />
					</HeaderButton.Container>
				),
				headerTitle: () => <SearchHeader onSearchChangeText={onSearchChangeText} testID='team-channels-view-search-header' />,
				headerRight: undefined
			};
			navigation.setOptions(options);
			return;
		}

		const options: NativeStackNavigationOptions = {
			headerLeft: undefined,
			headerTitle: () => (
				<RoomHeader title={getRoomTitle(team)} subtitle={team.topic} type={team.t} onPress={goRoomActionsView} teamMain />
			),
			headerRight: () => (
				<HeaderButton.Container>
					{showCreate ? (
						<HeaderButton.Item
							iconName='create'
							testID='team-channels-view-create'
							onPress={() => navigation.navigate('AddChannelTeamView', { teamId, rid: team.rid, t: team.t as any })}
						/>
					) : null}
					<HeaderButton.Item iconName='search' testID='team-channels-view-search' onPress={onSearchPress} />
				</HeaderButton.Container>
			)
		};

		navigation.setOptions(options);
	}, [team, isSearching, showCreate, navigation, teamId, onSearchChangeText, isMasterDetail, joined]);

	useEffect(() => {
		const loadTeam = async () => {
			const db = database.active;
			const failNotFound = () => {
				navigation.pop();
				showErrorAlert(I18n.t('Team_not_found'));
			};
			const canCreateChannel = async (resolvedTeam: TSubscriptionModel) => {
				if (compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '7.0.0')) {
					const createPermissions =
						resolvedTeam.t === 'c'
							? [createCPermission, createTeamChannelPermission]
							: [createPPermission, createTeamGroupPermission];
					const result = await hasPermission([moveRoomToTeamPermission, ...createPermissions], resolvedTeam.rid);
					return result.some(Boolean);
				}
				const createPermissions = resolvedTeam.t === 'c' ? [createCPermission] : [createPPermission];
				const result = await hasPermission([addTeamChannelPermission, ...createPermissions], resolvedTeam.rid);
				return result.some(Boolean);
			};

			try {
				const subCollection = db.get('subscriptions');
				const teamChannels = (await subCollection.query(Q.where('team_id', Q.eq(teamId))).fetch()) as TSubscriptionModel[];
				const resolvedTeam = teamChannels.find(channel => channel.teamMain);
				if (!resolvedTeam) {
					failNotFound();
					return;
				}
				const canCreate = await canCreateChannel(resolvedTeam);
				updateState({ team: resolvedTeam, showCreate: canCreate });
			} catch {
				failNotFound();
			}
		};

		loadTeam();
		load();
	}, [
		load,
		teamId,
		navigation,
		serverVersion,
		moveRoomToTeamPermission,
		createCPermission,
		createTeamChannelPermission,
		createPPermission,
		createTeamGroupPermission,
		addTeamChannelPermission
	]);

	const onPressItem = useDebounce(
		async (item: IItem) => {
			logEvent(events.TC_GO_ROOM);
			try {
				let params = {};
				const result = await getRoomInfo(item._id);
				if (result.success) {
					params = {
						rid: item._id,
						name: getRoomTitle(result.room),
						joinCodeRequired: result.room.joinCodeRequired,
						t: result.room.t,
						teamId: result.room.teamId
					};
				}
				goRoom({ item: params, isMasterDetail });
			} catch (e: any) {
				if (e.data.error === 'not-allowed') {
					showErrorAlert(I18n.t('error-not-allowed'));
				} else {
					showErrorAlert(e.data.error);
				}
			}
		},
		1000,
		{ leading: true, trailing: false }
	);

	const toggleAutoJoin = async (item: IItem) => {
		logEvent(events.TC_TOGGLE_AUTOJOIN);
		try {
			const result = await updateTeamRoom({ roomId: item._id, isDefault: !item.teamDefault });
			if (result.success) {
				updateState(prev => ({
					data: prev.data.map(i => (i._id === item._id ? { ...i, teamDefault: !i.teamDefault } : i))
				}));
			}
		} catch (e) {
			logEvent(events.TC_TOGGLE_AUTOJOIN_F);
			log(e);
		}
	};

	const removeRoom = async (item: IItem) => {
		logEvent(events.TC_DELETE_ROOM);
		if (!team) {
			return;
		}
		try {
			const result = await removeTeamRoom({ roomId: item._id, teamId: team.teamId as string });
			if (result.success) {
				updateState(prev => ({ data: prev.data.filter(room => result.room._id !== room._id) }));
			}
		} catch (e) {
			logEvent(events.TC_DELETE_ROOM_F);
			log(e);
		}
	};

	const remove = (item: IItem) => {
		Alert.alert(
			I18n.t('Confirmation'),
			I18n.t('Remove_Team_Room_Warning'),
			[
				{
					text: I18n.t('Cancel'),
					style: 'cancel'
				},
				{
					text: I18n.t('Yes_action_it', { action: I18n.t('remove') }),
					style: 'destructive',
					onPress: () => removeRoom(item)
				}
			],
			{ cancelable: false }
		);
	};

	const deleteChannel = (item: IItem) => {
		logEvent(events.TC_DELETE_ROOM);

		Alert.alert(
			I18n.t('Are_you_sure_question_mark'),
			I18n.t('Delete_Room_Warning'),
			[
				{
					text: I18n.t('Cancel'),
					style: 'cancel'
				},
				{
					text: I18n.t('Yes_action_it', { action: I18n.t('delete') }),
					style: 'destructive',
					onPress: () => dispatch(deleteRoom(ERoomType.c, item))
				}
			],
			{ cancelable: false }
		);
	};

	const showChannelActions = async (item: IItem) => {
		logEvent(events.ROOM_SHOW_BOX_ACTIONS);
		if (!team) {
			return;
		}
		const isAutoJoinChecked = item.teamDefault;
		const autoJoinIcon = isAutoJoinChecked ? 'checkbox-checked' : 'checkbox-unchecked';
		const autoJoinIconColor = isAutoJoinChecked ? colors.fontHint : colors.fontDefault;

		const options: TActionSheetOptionsItem[] = [];

		const permissionsTeam = await hasPermission([editTeamChannelPermission], team.rid);
		if (permissionsTeam[0]) {
			options.push({
				title: I18n.t('Auto-join'),
				icon: item.t === 'p' ? 'channel-private' : 'channel-public',
				onPress: () => toggleAutoJoin(item),
				right: () => (
					<CustomIcon
						testID={isAutoJoinChecked ? 'auto-join-checked' : 'auto-join-unchecked'}
						name={autoJoinIcon}
						size={20}
						color={autoJoinIconColor}
					/>
				),
				testID: 'action-sheet-auto-join'
			});
		}

		const permissionsRemoveTeam = await hasPermission([removeTeamChannelPermission], team.rid);
		if (permissionsRemoveTeam[0]) {
			options.push({
				title: I18n.t('Remove_from_Team'),
				icon: 'close',
				danger: true,
				onPress: () => remove(item),
				testID: 'action-sheet-remove-from-team'
			});
		}

		const permissionsChannel = await hasPermission([item.t === 'c' ? deleteCPermission : deletePPermission], item._id);
		if (permissionsChannel[0]) {
			options.push({
				title: I18n.t('Delete'),
				icon: 'delete',
				danger: true,
				onPress: () => deleteChannel(item),
				testID: 'action-sheet-delete'
			});
		}

		if (options.length === 0) {
			return;
		}
		showActionSheet({ options });
	};

	const renderItem = ({ item }: { item: IItem }) => (
		<RoomItem
			item={item}
			showLastMessage={StoreLastMessage}
			onPress={onPressItem}
			width={width}
			onLongPress={showChannelActions}
			useRealName={useRealName}
			getRoomTitle={getRoomTitle}
			getRoomAvatar={getRoomAvatar}
			swipeEnabled={false}
			autoJoin={item.teamDefault}
			showAvatar={showAvatar}
			displayMode={displayMode}
		/>
	);

	const renderFooter = () => {
		if (loadingMore) {
			return <ActivityIndicator />;
		}
		return null;
	};

	const renderScroll = () => {
		if (loading) {
			return <BackgroundContainer loading />;
		}
		if (isSearching && !search.length) {
			return <BackgroundContainer text={searchText ? I18n.t('No_channels_in_team') : ''} />;
		}
		if (!isSearching && !data.length) {
			return <BackgroundContainer text={I18n.t('No_channels_in_team')} />;
		}

		return (
			<FlatList
				data={isSearching ? search : data}
				extraData={isSearching ? search : data}
				keyExtractor={keyExtractor}
				renderItem={renderItem}
				getItemLayout={getItemLayout}
				removeClippedSubviews={isIOS}
				keyboardShouldPersistTaps='always'
				onEndReached={load}
				onEndReachedThreshold={0.5}
				ListFooterComponent={renderFooter}
			/>
		);
	};

	return <SafeAreaView testID='team-channels-view'>{renderScroll()}</SafeAreaView>;
};

export default TeamChannelsView;
