import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useReducer } from 'react';
import { FlatList, Text, View } from 'react-native';

import { TActionSheetOptionsItem, useActionSheet } from '../../containers/ActionSheet';
import ActivityIndicator from '../../containers/ActivityIndicator';
import { CustomIcon } from '../../containers/CustomIcon';
import * as HeaderButton from '../../containers/HeaderButton';
import * as List from '../../containers/List';
import { RadioButton } from '../../containers/RadioButton';
import SafeAreaView from '../../containers/SafeAreaView';
import SearchBox from '../../containers/SearchBox';
import StatusBar from '../../containers/StatusBar';
import UserItem from '../../containers/UserItem';
import { TSubscriptionModel, TUserModel } from '../../definitions';
import I18n from '../../i18n';
import { useAppSelector, usePermissions } from '../../lib/hooks';
import { getRoomTitle, isGroupChat } from '../../lib/methods/helpers';
import { handleIgnore } from '../../lib/methods/helpers/handleIgnore';
import { showConfirmationAlert } from '../../lib/methods/helpers/info';
import log from '../../lib/methods/helpers/log';
import scrollPersistTaps from '../../lib/methods/helpers/scrollPersistTaps';
import { Services } from '../../lib/services';
import { TSupportedPermissions } from '../../reducers/permissions';
import { getUserSelector } from '../../selectors/login';
import { ModalStackParamList } from '../../stacks/MasterDetailStack/types';
import { useTheme } from '../../theme';
import ActionsSection from './components/ActionsSection';
import {
	fetchRole,
	fetchRoomMembersRoles,
	handleLeader,
	handleModerator,
	handleMute,
	handleOwner,
	handleRemoveFromTeam,
	handleRemoveUserFromRoom,
	navToDirectMessage,
	TRoomType
} from './helpers';
import styles from './styles';

const PAGE_SIZE = 25;

interface IRoomMembersViewState {
	isLoading: boolean;
	allUsers: boolean;
	filtering: string;
	members: TUserModel[];
	room: TSubscriptionModel;
	end: boolean;
	roomRoles: any;
	filter: string;
	page: number;
}

const RightIcon = ({ check, label }: { check: boolean; label: string }) => {
	const { colors } = useTheme();
	return (
		<CustomIcon
			testID={check ? `action-sheet-set-${label}-checked` : `action-sheet-set-${label}-unchecked`}
			name={check ? 'checkbox-checked' : 'checkbox-unchecked'}
			size={20}
			color={check ? colors.tintActive : colors.auxiliaryTintColor}
		/>
	);
};

const RoomMembersView = (): React.ReactElement => {
	const { showActionSheet } = useActionSheet();
	const { colors } = useTheme();

	const { params } = useRoute<RouteProp<ModalStackParamList, 'RoomMembersView'>>();
	const navigation = useNavigation<NavigationProp<ModalStackParamList, 'RoomMembersView'>>();

	const isMasterDetail = useAppSelector(state => state.app.isMasterDetail);

	const useRealName = useAppSelector(state => state.settings.UI_Use_Real_Name);
	const user = useAppSelector(state => getUserSelector(state));

	const [state, updateState] = useReducer(
		(state: IRoomMembersViewState, newState: Partial<IRoomMembersViewState>) => ({ ...state, ...newState }),
		{
			isLoading: false,
			allUsers: false,
			filtering: '',
			members: [],
			room: params.room || ({} as TSubscriptionModel),
			end: false,
			roomRoles: null,
			filter: '',
			page: 0
		}
	);

	const teamPermissions: TSupportedPermissions[] = state.room.teamMain
		? ['edit-team-member', 'view-all-team-channels', 'view-all-teams']
		: [];

	const [
		muteUserPermission,
		setLeaderPermission,
		setOwnerPermission,
		setModeratorPermission,
		removeUserPermission,
		editTeamMemberPermission,
		viewAllTeamChannelsPermission,
		viewAllTeamsPermission
	] = usePermissions(['mute-user', 'set-leader', 'set-owner', 'set-moderator', 'remove-user', ...teamPermissions], params.rid);

	useEffect(() => {
		const subscription = params?.room?.observe && params.room.observe().subscribe(changes => updateState({ room: changes }));
		setHeader(false);
		fetchMembers(false);
		return () => subscription?.unsubscribe();
	}, []);

	useEffect(() => {
		const fetchRoles = () => {
			if (isGroupChat(state.room)) {
				return;
			}
			if (
				muteUserPermission ||
				setLeaderPermission ||
				setOwnerPermission ||
				setModeratorPermission ||
				removeUserPermission ||
				editTeamMemberPermission ||
				viewAllTeamChannelsPermission ||
				viewAllTeamsPermission
			) {
				fetchRoomMembersRoles(state.room.t as any, state.room.rid, updateState);
			}
		};
		fetchRoles();
	}, [
		muteUserPermission,
		setLeaderPermission,
		setOwnerPermission,
		setModeratorPermission,
		removeUserPermission,
		editTeamMemberPermission,
		viewAllTeamChannelsPermission,
		viewAllTeamsPermission
	]);

	const toggleStatus = (status: boolean) => {
		try {
			updateState({ members: [], allUsers: status, end: false });
			fetchMembers(status);
			setHeader(status);
		} catch (e) {
			log(e);
		}
	};

	const setHeader = (allUsers: boolean) => {
		navigation.setOptions({
			title: I18n.t('Members'),
			headerRight: () => (
				<HeaderButton.Container>
					<HeaderButton.Item
						iconName='filter'
						onPress={() =>
							showActionSheet({
								options: [
									{
										title: I18n.t('Online'),
										onPress: () => toggleStatus(true),
										right: () => <RadioButton check={allUsers} />,
										testID: 'room-members-view-toggle-status-online'
									},
									{
										title: I18n.t('All'),
										onPress: () => toggleStatus(false),
										right: () => <RadioButton check={!allUsers} />,
										testID: 'room-members-view-toggle-status-all'
									}
								]
							})
						}
						testID='room-members-view-filter'
					/>
				</HeaderButton.Container>
			)
		});
	};

	const getUserDisplayName = (user: TUserModel) => (useRealName ? user.name : user.username) || user.username;

	const onPressUser = (selectedUser: TUserModel) => {
		const { room, roomRoles, members } = state;

		const options: TActionSheetOptionsItem[] = [
			{
				icon: 'message',
				title: I18n.t('Direct_message'),
				onPress: () => navToDirectMessage(selectedUser, isMasterDetail)
			}
		];

		// Ignore
		if (selectedUser._id !== user.id) {
			const { ignored } = room;
			const isIgnored = ignored?.includes?.(selectedUser._id);
			options.push({
				icon: 'ignore',
				title: I18n.t(isIgnored ? 'Unignore' : 'Ignore'),
				onPress: () => handleIgnore(selectedUser._id, !isIgnored, room.rid),
				testID: 'action-sheet-ignore-user'
			});
		}

		if (muteUserPermission) {
			const { muted = [] } = room;
			const userIsMuted = muted.find?.(m => m === selectedUser.username);
			selectedUser.muted = !!userIsMuted;
			options.push({
				icon: userIsMuted ? 'audio' : 'audio-disabled',
				title: I18n.t(userIsMuted ? 'Unmute' : 'Mute'),
				onPress: () => {
					showConfirmationAlert({
						message: I18n.t(`The_user_${userIsMuted ? 'will' : 'wont'}_be_able_to_type_in_roomName`, {
							roomName: getRoomTitle(room)
						}),
						confirmationText: I18n.t(userIsMuted ? 'Unmute' : 'Mute'),
						onPress: () => handleMute(selectedUser, room.rid)
					});
				},
				testID: 'action-sheet-mute-user'
			});
		}

		// Owner
		if (setOwnerPermission) {
			const isOwner = fetchRole('owner', selectedUser, roomRoles);
			options.push({
				icon: 'shield-check',
				title: I18n.t('Owner'),
				onPress: () =>
					handleOwner(selectedUser, !isOwner, getUserDisplayName(selectedUser), room, () =>
						fetchRoomMembersRoles(room.t as TRoomType, room.rid, updateState)
					),
				right: () => <RightIcon check={isOwner} label='owner' />,
				testID: 'action-sheet-set-owner'
			});
		}

		// Leader
		if (setLeaderPermission) {
			const isLeader = fetchRole('leader', selectedUser, roomRoles);
			options.push({
				icon: 'shield-alt',
				title: I18n.t('Leader'),
				onPress: () =>
					handleLeader(selectedUser, !isLeader, room, getUserDisplayName(selectedUser), () =>
						fetchRoomMembersRoles(room.t as TRoomType, room.rid, updateState)
					),
				right: () => <RightIcon check={isLeader} label='leader' />,
				testID: 'action-sheet-set-leader'
			});
		}

		// Moderator
		if (setModeratorPermission) {
			const isModerator = fetchRole('moderator', selectedUser, roomRoles);
			options.push({
				icon: 'shield',
				title: I18n.t('Moderator'),
				onPress: () =>
					handleModerator(selectedUser, !isModerator, room, getUserDisplayName(selectedUser), () =>
						fetchRoomMembersRoles(room.t as TRoomType, room.rid, updateState)
					),
				right: () => <RightIcon check={isModerator} label='moderator' />,
				testID: 'action-sheet-set-moderator'
			});
		}

		// Remove from team
		if (editTeamMemberPermission) {
			options.push({
				icon: 'logout',
				danger: true,
				title: I18n.t('Remove_from_Team'),
				onPress: () => handleRemoveFromTeam(selectedUser, updateState, room, members),
				testID: 'action-sheet-remove-from-team'
			});
		}

		// Remove from room
		if (removeUserPermission && !room.teamMain) {
			options.push({
				icon: 'logout',
				title: I18n.t('Remove_from_room'),
				danger: true,
				onPress: () => {
					showConfirmationAlert({
						message: I18n.t('The_user_will_be_removed_from_s', { s: getRoomTitle(room) }),
						confirmationText: I18n.t('Yes_remove_user'),
						onPress: () => {
							handleRemoveUserFromRoom(selectedUser, room, () =>
								updateState({
									members: members.filter(member => member._id !== selectedUser._id)
								})
							);
						}
					});
				},
				testID: 'action-sheet-remove-from-room'
			});
		}

		showActionSheet({
			options,
			hasCancel: true
		});
	};

	const fetchMembers = async (status: boolean) => {
		const { members, isLoading, end, room, filter, page } = state;
		const { t } = room;

		if (isLoading || end) {
			return;
		}

		updateState({ isLoading: true });
		try {
			const membersResult = await Services.getRoomMembers({
				rid: room.rid,
				roomType: t,
				type: !status ? 'all' : 'online',
				filter,
				skip: PAGE_SIZE * page,
				limit: PAGE_SIZE,
				allUsers: !status
			});
			const end = membersResult?.length < PAGE_SIZE;
			const membersResultFiltered = membersResult?.filter((member: TUserModel) => !members.some(m => m._id === member._id));
			updateState({
				members: [...members, ...membersResultFiltered],
				isLoading: false,
				end,
				page: page + 1
			});
		} catch (e) {
			log(e);
			updateState({ isLoading: false });
		}
	};

	const filteredMembers =
		state.members && state.members.length > 0 && state.filter
			? state.members.filter(
					m =>
						m.username.toLowerCase().match(state.filter.toLowerCase()) || m.name?.toLowerCase().match(state.filter.toLowerCase())
			  )
			: null;

	return (
		<SafeAreaView testID='room-members-view'>
			<StatusBar />
			<FlatList
				data={filteredMembers || state.members}
				renderItem={({ item }) => (
					<View style={{ backgroundColor: colors.backgroundColor }}>
						<UserItem
							name={item.name as string}
							username={item.username}
							onPress={() => onPressUser(item)}
							testID={`room-members-view-item-${item.username}`}
						/>
					</View>
				)}
				style={styles.list}
				keyExtractor={item => item._id}
				ItemSeparatorComponent={List.Separator}
				ListHeaderComponent={
					<>
						<ActionsSection joined={params.joined as boolean} rid={state.room.rid} t={state.room.t} />
						<SearchBox onChangeText={text => updateState({ filter: text.trim() })} testID='room-members-view-search' />
					</>
				}
				ListFooterComponent={() => (state.isLoading ? <ActivityIndicator /> : null)}
				onEndReachedThreshold={0.1}
				onEndReached={() => fetchMembers(state.allUsers)}
				ListEmptyComponent={() =>
					state.end ? <Text style={[styles.noResult, { color: colors.titleText }]}>{I18n.t('No_members_found')}</Text> : null
				}
				{...scrollPersistTaps}
			/>
		</SafeAreaView>
	);
};

export default RoomMembersView;
