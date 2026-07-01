import { Q } from '@nozbe/watermelondb';
import { type NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { Alert, FlatList, PixelRatio, useWindowDimensions } from 'react-native';
import { shallowEqual, useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';

import { deleteRoom } from '../../actions/room';
import { type DisplayMode } from '../../lib/constants/constantDisplayMode';
import { type TActionSheetOptionsItem, useActionSheet } from '../../containers/ActionSheet';
import ActivityIndicator from '../../containers/ActivityIndicator';
import BackgroundContainer from '../../containers/BackgroundContainer';
import * as HeaderButton from '../../containers/Header/components/HeaderButton';
import RoomHeader from '../../containers/RoomHeader';
import SafeAreaView from '../../containers/SafeAreaView';
import SearchHeader from '../../containers/SearchHeader';
import { type TSubscriptionModel } from '../../definitions';
import { ERoomType } from '../../definitions/ERoomType';
import { useMasterDetail } from '../../lib/hooks/useMasterDetail';
import { useAppSelector } from '../../lib/hooks/useAppSelector';
import { useAppNavigation, useAppRoute } from '../../lib/hooks/navigation';
import I18n from '../../i18n';
import database from '../../lib/database';
import { CustomIcon } from '../../containers/CustomIcon';
import RoomItem from '../../containers/RoomItem';
import { type ChatsStackParamList } from '../../stacks/types';
import { useTheme } from '../../theme';
import { goRoom } from '../../lib/methods/helpers/goRoom';
import { showErrorAlert } from '../../lib/methods/helpers/info';
import log, { events, logEvent } from '../../lib/methods/helpers/log';
import { getRoomAvatar, getRoomTitle, useDebounce, isIOS } from '../../lib/methods/helpers';
import { getRoomInfo, updateTeamRoom, removeTeamRoom } from '../../lib/services/restApi';
import { useCanCreateTeamChannel } from '../../lib/hooks/useTeamChannelPermissions';
import { useTeamChannels, type IItem } from './useTeamChannels';
import { getChannelActionPermissions } from './channelActionPermissions';

export { type IItem } from './useTeamChannels';

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

interface ITeamChannelsViewSelector {
	useRealName: boolean;
	StoreLastMessage: boolean;
	editTeamChannelPermission: string[];
	removeTeamChannelPermission: string[];
	deleteCPermission: string[];
	deletePPermission: string[];
	showAvatar: boolean;
	displayMode: DisplayMode;
}

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
		useRealName,
		StoreLastMessage,
		editTeamChannelPermission,
		removeTeamChannelPermission,
		deleteCPermission,
		deletePPermission,
		showAvatar,
		displayMode
	} = useAppSelector(
		(state): ITeamChannelsViewSelector => ({
			useRealName: state.settings.UI_Use_Real_Name as boolean,
			StoreLastMessage: state.settings.Store_Last_Message as boolean,
			editTeamChannelPermission: state.permissions['edit-team-channel'] ?? EMPTY_PERMISSION,
			removeTeamChannelPermission: state.permissions['remove-team-channel'] ?? EMPTY_PERMISSION,
			deleteCPermission: state.permissions['delete-c'] ?? EMPTY_PERMISSION,
			deletePPermission: state.permissions['delete-p'] ?? EMPTY_PERMISSION,
			showAvatar: state.sortPreferences.showAvatar,
			displayMode: state.sortPreferences.displayMode
		}),
		shallowEqual
	);

	const [team, setTeam] = useState<TSubscriptionModel | null>(null);
	const showCreate = useCanCreateTeamChannel(team?.rid ?? '', (team?.t ?? 'c') as 'c' | 'p');
	const {
		list,
		loading,
		loadingMore,
		isSearching,
		searchText,
		loadMore,
		startSearch,
		cancelSearch,
		onSearchChangeText,
		updateItem,
		removeItem
	} = useTeamChannels(teamId);

	useEffect(() => {
		if (!team) {
			return;
		}

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
						<HeaderButton.Item iconName='close' onPress={cancelSearch} />
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
					<HeaderButton.Item iconName='search' testID='team-channels-view-search' onPress={startSearch} />
				</HeaderButton.Container>
			)
		};

		navigation.setOptions(options);
	}, [team, isSearching, showCreate, navigation, teamId, onSearchChangeText, startSearch, cancelSearch, isMasterDetail, joined]);

	useEffect(() => {
		const loadTeam = async () => {
			const db = database.active;
			const failNotFound = () => {
				navigation.pop();
				showErrorAlert(I18n.t('Team_not_found'));
			};

			try {
				const subCollection = db.get('subscriptions');
				const teamChannels = (await subCollection.query(Q.where('team_id', Q.eq(teamId))).fetch()) as TSubscriptionModel[];
				const resolvedTeam = teamChannels.find(channel => channel.teamMain);
				if (!resolvedTeam) {
					failNotFound();
					return;
				}
				setTeam(resolvedTeam);
			} catch {
				failNotFound();
			}
		};

		loadTeam();
	}, [teamId, navigation]);

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
				updateItem(item._id, { teamDefault: !item.teamDefault });
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
				removeItem(result.room._id);
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
		const { canAutoJoin, canRemove, canDelete } = await getChannelActionPermissions(item, team, {
			edit: editTeamChannelPermission,
			remove: removeTeamChannelPermission,
			deleteC: deleteCPermission,
			deleteP: deletePPermission
		});

		const isAutoJoinChecked = item.teamDefault;
		const autoJoinIcon = isAutoJoinChecked ? 'checkbox-checked' : 'checkbox-unchecked';
		const autoJoinIconColor = isAutoJoinChecked ? colors.fontHint : colors.fontDefault;

		const options: TActionSheetOptionsItem[] = [];

		if (canAutoJoin) {
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

		if (canRemove) {
			options.push({
				title: I18n.t('Remove_from_Team'),
				icon: 'close',
				danger: true,
				onPress: () => remove(item),
				testID: 'action-sheet-remove-from-team'
			});
		}

		if (canDelete) {
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
		if (isSearching && !list.length) {
			return <BackgroundContainer text={searchText ? I18n.t('No_channels_in_team') : ''} />;
		}
		if (!isSearching && !list.length) {
			return <BackgroundContainer text={I18n.t('No_channels_in_team')} />;
		}

		return (
			<FlatList
				data={list}
				extraData={list}
				keyExtractor={keyExtractor}
				renderItem={renderItem}
				getItemLayout={getItemLayout}
				removeClippedSubviews={isIOS}
				keyboardShouldPersistTaps='always'
				onEndReached={loadMore}
				onEndReachedThreshold={0.5}
				ListFooterComponent={renderFooter}
			/>
		);
	};

	return <SafeAreaView testID='team-channels-view'>{renderScroll()}</SafeAreaView>;
};

export default TeamChannelsView;
