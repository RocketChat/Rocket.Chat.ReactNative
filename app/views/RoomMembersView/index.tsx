import { type NavigationProp, type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { type ReactElement, useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { shallowEqual } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { type TActionSheetOptionsItem, useActionSheet } from '~/containers/ActionSheet';
import { sendLoadingEvent } from '~/containers/Loading';
import ActivityIndicator from '~/containers/ActivityIndicator';
import { CustomIcon, type TIconsName } from '~/containers/CustomIcon';
import * as HeaderButton from '~/containers/Header/components/HeaderButton';
import * as List from '~/containers/List';
import SafeAreaView from '~/containers/SafeAreaView';
import SearchBox from '~/containers/SearchBox';
import UserItem from '~/containers/UserItem';
import Radio from '~/containers/Radio';
import { type IGetRoomRoles, type TSubscriptionModel, type TUserModel } from '~/definitions';
import I18n from '~/i18n';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { useMasterDetail } from '~/lib/hooks/useMasterDetail';
import { usePermissions } from '~/lib/hooks/usePermissions';
import { compareServerVersion, getRoomTitle, isGroupChat, useDebounce } from '~/lib/methods/helpers';
import { handleIgnore } from '~/lib/methods/helpers/handleIgnore';
import { groupMembersByRole, type TMemberListItem } from '~/lib/methods/helpers/groupMembersByRole';
import { isMembersOrderedByRoleSupported } from '~/lib/methods/helpers/isMembersOrderedByRoleSupported';
import { showConfirmationAlert } from '~/lib/methods/helpers/info';
import log from '~/lib/methods/helpers/log';
import scrollPersistTaps from '~/lib/methods/helpers/scrollPersistTaps';
import { getRoomMembers } from '~/lib/services/restApi';
import { type TSupportedPermissions } from '~/reducers/permissions';
import { getUserSelector } from '~/selectors/login';
import { type ModalStackParamList } from '~/stacks/MasterDetailStack/types';
import { useTheme } from '~/theme';
import ActionsSection from './components/ActionsSection';
import RoleGroupHeader from './components/RoleGroupHeader';
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
	type TRoomType
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
	roomRoles?: IGetRoomRoles[];
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
			color={check ? colors.fontHint : undefined}
		/>
	);
};

const RoomMembersView = (): ReactElement => {
	const { showActionSheet } = useActionSheet();
	const { colors } = useTheme();

	const { params } = useRoute<RouteProp<ModalStackParamList, 'RoomMembersView'>>();
	const navigation = useNavigation<NavigationProp<ModalStackParamList, 'RoomMembersView'>>();
	const { bottom } = useSafeAreaInsets();

	const latestSearchRequest = useRef(0);
	const [refreshKey, setRefreshKey] = useState(0);

	const { serverVersion, useRealName, user, loading } = useAppSelector(
		state => ({
			useRealName: state.settings.UI_Use_Real_Name,
			user: getUserSelector(state),
			serverVersion: state.server.version,
			loading: state.selectedUsers.loading
		}),
		shallowEqual
	);
	const isMasterDetail = useMasterDetail();

	useEffect(() => {
		sendLoadingEvent({ visible: loading });
	}, [loading]);

	const [state, updateState] = useReducer(
		(state: IRoomMembersViewState, newState: Partial<IRoomMembersViewState>) => ({ ...state, ...newState }),
		{
			isLoading: false,
			allUsers: true,
			filtering: '',
			members: [],
			room: params.room || ({} as TSubscriptionModel),
			end: false,
			roomRoles: undefined,
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
		setHeader(true);
		return () => subscription?.unsubscribe();
	}, []);

	const membersHaveRoles = isMembersOrderedByRoleSupported(serverVersion, state.room.t);

	const fetchRoles = () => {
		if (isGroupChat(state.room) || membersHaveRoles) {
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

	const fetchMembers = useCallback(async () => {
		const { members, isLoading, end, room, filter, page, allUsers } = state;
		const { t } = room;

		if (isLoading || end) {
			return;
		}

		const requestId = ++latestSearchRequest.current;
		updateState({ isLoading: true });

		try {
			const membersResult = await getRoomMembers({
				rid: room.rid,
				roomType: t,
				type: allUsers ? 'all' : 'online',
				filter,
				skip: PAGE_SIZE * page,
				limit: PAGE_SIZE,
				allUsers
			});

			if (requestId !== latestSearchRequest.current) {
				return;
			}

			const existingIds = new Set(members.map(m => m._id));
			const membersResultFiltered = membersResult?.filter((member: TUserModel) => !existingIds.has(member._id));

			// Safety check: if page is 0, we replace the list entirely
			const newMembers = page === 0 ? membersResultFiltered : [...members, ...(membersResultFiltered || [])];
			const isEnd = membersResult?.length < PAGE_SIZE;

			updateState({
				members: newMembers,
				isLoading: false,
				end: isEnd,
				page: page + 1
			});
		} catch (e) {
			log(e);
			if (requestId === latestSearchRequest.current) {
				updateState({ isLoading: false });
			}
		}
	}, [state.isLoading, state.end, state.room.t, state.filter, state.page, state.allUsers]);

	useEffect(() => {
		const unsubscribe = navigation.addListener('focus', () => {
			fetchMembers();
		});

		return unsubscribe;
	}, [navigation]);

	useEffect(() => {
		fetchRoles();
	}, [
		muteUserPermission,
		setLeaderPermission,
		setOwnerPermission,
		setModeratorPermission,
		removeUserPermission,
		editTeamMemberPermission,
		viewAllTeamChannelsPermission,
		viewAllTeamsPermission,
		state.room?.rid,
		state.room?.t
	]);

	useEffect(() => {
		fetchMembers();
	}, [state.filter, state.allUsers, refreshKey]);

	const refreshAfterRoleChange = async () => {
		latestSearchRequest.current += 1;
		updateState({ members: [], page: 0, end: false, isLoading: false });
		setRefreshKey(key => key + 1);
		if (!membersHaveRoles) {
			await fetchRoomMembersRoles(state.room.t as TRoomType, state.room.rid, updateState);
		}
	};

	const hasRole = (role: string, selectedUser: TUserModel) =>
		membersHaveRoles ? !!selectedUser.roles?.includes(role) : fetchRole(role, selectedUser, state.roomRoles);

	const debounceFilterChange = useDebounce((text: string) => {
		const trimmedFilter = text.trim();

		if (!trimmedFilter) {
			latestSearchRequest.current += 1;
		}

		updateState({
			filter: trimmedFilter,
			page: 0,
			members: [],
			end: false,
			isLoading: false
		});
	}, 500);

	const toggleStatus = (status: boolean) => {
		try {
			// We only update 'allUsers'. 'filter' remains in state, so the next fetch uses both.
			updateState({ members: [], allUsers: status, end: false, page: 0 });
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
										onPress: () => toggleStatus(false),
										right: () => <Radio check={!allUsers} />,
										testID: 'room-members-view-toggle-status-online'
									},
									{
										title: I18n.t('All'),
										onPress: () => toggleStatus(true),
										right: () => <Radio check={allUsers} />,
										testID: 'room-members-view-toggle-status-all'
									}
								],
								enableContentPanningGesture: false
							})
						}
						testID='room-members-view-filter'
					/>
				</HeaderButton.Container>
			)
		});
	};

	const getUserDisplayName = (user: TUserModel) => {
		const preferred = useRealName ? user.name : user.username;
		const fallback = useRealName ? user.username : user.name;
		return preferred || fallback || user._id;
	};

	const onPressUser = (selectedUser: TUserModel) => {
		const { room, members } = state;

		const options: TActionSheetOptionsItem[] = [
			{
				icon: 'message',
				title: I18n.t('Direct_message'),
				onPress: () => navToDirectMessage(selectedUser, isMasterDetail)
			}
		];

		// Owner
		if (setOwnerPermission) {
			const isOwner = hasRole('owner', selectedUser);
			options.push({
				icon: 'shield-check',
				title: I18n.t('Owner'),
				onPress: () => handleOwner(selectedUser, !isOwner, getUserDisplayName(selectedUser), room, refreshAfterRoleChange),
				right: () => <RightIcon check={isOwner} label='owner' />,
				testID: 'action-sheet-set-owner'
			});
		}

		// Leader
		if (setLeaderPermission) {
			const isLeader = hasRole('leader', selectedUser);
			options.push({
				icon: 'shield-alt',
				title: I18n.t('Leader'),
				onPress: () => handleLeader(selectedUser, !isLeader, room, getUserDisplayName(selectedUser), refreshAfterRoleChange),
				right: () => <RightIcon check={isLeader} label='leader' />,
				testID: 'action-sheet-set-leader'
			});
		}

		// Moderator
		if (setModeratorPermission) {
			const isModerator = hasRole('moderator', selectedUser);
			options.push({
				icon: 'shield',
				title: I18n.t('Moderator'),
				onPress: () =>
					handleModerator(selectedUser, !isModerator, room, getUserDisplayName(selectedUser), refreshAfterRoleChange),
				right: () => <RightIcon check={isModerator} label='moderator' />,
				testID: 'action-sheet-set-moderator'
			});
		}

		if (muteUserPermission) {
			const { muted = [], ro: readOnly, unmuted = [] } = room;
			let userIsMuted = !!muted.find?.(m => m === selectedUser.username);
			let icon: TIconsName = userIsMuted ? 'mic' : 'mic-off';
			let title = I18n.t(userIsMuted ? 'Unmute' : 'Mute');
			if (compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '6.4.0')) {
				if (readOnly) {
					userIsMuted = !unmuted?.find?.(m => m === selectedUser.username);
				}
				icon = userIsMuted ? 'message' : 'message-disabled';
				title = I18n.t(userIsMuted ? 'Enable_writing_in_room' : 'Disable_writing_in_room');
			}
			selectedUser.muted = !!userIsMuted;
			options.push({
				icon,
				title,
				onPress: () => {
					showConfirmationAlert({
						message: I18n.t(`The_user_${userIsMuted ? 'will' : 'wont'}_be_able_to_type_in_roomName`, {
							roomName: getRoomTitle(room)
						}),
						confirmationText: title,
						onPress: () => handleMute(selectedUser, room.rid)
					});
				},
				testID: 'action-sheet-mute-user'
			});
		}

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

	const listItems: TMemberListItem<TUserModel>[] = membersHaveRoles
		? groupMembersByRole(state.members)
		: state.members.map(member => ({ type: 'member' as const, member }));
	// Offset by one because FlatList counts ListHeaderComponent as the first child
	const stickyHeaderIndices = listItems.flatMap((item, index) => (item.type === 'header' ? [index + 1] : []));

	return (
		<SafeAreaView testID='room-members-view'>
			<FlatList<TMemberListItem<TUserModel>>
				data={listItems}
				renderItem={({ item }) =>
					item.type === 'header' ? (
						<RoleGroupHeader group={item.group} count={item.count} />
					) : (
						<View style={{ backgroundColor: colors.surfaceRoom }}>
							<UserItem
								name={item.member.name || item.member.username || ''}
								username={item.member.username || ''}
								onPress={() => onPressUser(item.member)}
								testID={`room-members-view-item-${item.member.username}`}
							/>
						</View>
					)
				}
				stickyHeaderIndices={stickyHeaderIndices}
				// Android's clipped-subview insertion crashes with sticky headers (addViewAt IndexOutOfBounds)
				removeClippedSubviews={false}
				style={styles.list}
				contentContainerStyle={{ paddingBottom: bottom }}
				keyExtractor={item => (item.type === 'header' ? `header-${item.group}` : item.member._id)}
				ItemSeparatorComponent={({ leadingItem }: { leadingItem: TMemberListItem<TUserModel> }) =>
					leadingItem.type === 'header' ? null : <List.Separator />
				}
				ListHeaderComponent={
					<>
						<ActionsSection
							joined={params.joined as boolean}
							rid={state.room.rid}
							t={state.room.t}
							abacAttributes={state.room.abacAttributes}
						/>
						<SearchBox onChangeText={text => debounceFilterChange(text)} testID='room-members-view-search' />
					</>
				}
				ListFooterComponent={() => (state.isLoading ? <ActivityIndicator /> : null)}
				onEndReachedThreshold={0.1}
				onEndReached={() => fetchMembers()}
				ListEmptyComponent={() =>
					state.end ? (
						<Text style={[styles.noResult, { color: colors.fontTitlesLabels }]}>{I18n.t('No_members_found')}</Text>
					) : null
				}
				{...scrollPersistTaps}
			/>
		</SafeAreaView>
	);
};

export default RoomMembersView;
