import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { View } from 'react-native';
import { useDispatch } from 'react-redux';

import { setLoading } from '../../../actions/selectedUsers';
import * as List from '../../../containers/List';
import { TSubscriptionModel } from '../../../definitions';
import i18n from '../../../i18n';
import { usePermissions } from '../../../lib/hooks';
import log, { events, logEvent } from '../../../lib/methods/helpers/log';
import { Services } from '../../../lib/services';
import { MasterDetailInsideStackParamList } from '../../../stacks/MasterDetailStack/types';
import { ChatsStackParamList } from '../../../stacks/types';

type TNavigation = CompositeNavigationProp<
	NativeStackNavigationProp<ChatsStackParamList, 'RoomActionsView'>,
	NativeStackNavigationProp<MasterDetailInsideStackParamList>
>;

interface IActionsSection {
	rid: TSubscriptionModel['rid'];
	t: TSubscriptionModel['t'];
	joined: boolean;
}

export default function ActionsSection({ rid, t, joined }: IActionsSection): React.ReactElement {
	const { navigate, pop } = useNavigation<TNavigation>();
	const dispatch = useDispatch();
	const [addUserToJoinedRoomPermission, addUserToAnyCRoomPermission, addUserToAnyPRoomPermission, createInviteLinksPermission] =
		usePermissions(['add-user-to-joined-room', 'add-user-to-any-c-room', 'add-user-to-any-p-room', 'create-invite-links'], rid);

	const canAddUser =
		(joined && addUserToJoinedRoomPermission) ||
		(t === 'c' && addUserToAnyCRoomPermission) ||
		(t === 'p' && addUserToAnyPRoomPermission) ||
		false;

	const canInviteUser = createInviteLinksPermission;

	const handleOnPress = ({
		route,
		params
	}: {
		route: keyof ChatsStackParamList;
		params: ChatsStackParamList[keyof ChatsStackParamList];
	}) => {
		// @ts-ignore
		navigate(route, params);
		// @ts-ignore
		logEvent(events[`RM_GO_${route.replace('View', '').toUpperCase()}`]);
	};

	const addUser = async () => {
		try {
			dispatch(setLoading(true));
			await Services.addUsersToRoom(rid);
			pop();
		} catch (e) {
			log(e);
		} finally {
			dispatch(setLoading(false));
		}
	};

	return (
		<View style={{ paddingTop: canAddUser || canInviteUser ? 16 : 0, paddingBottom: canAddUser || canInviteUser ? 16 : 0 }}>
			{['c', 'p'].includes(t) && canAddUser ? (
				<>
					<List.Separator />
					<List.Item
						title='Add_users'
						onPress={() =>
							handleOnPress({
								route: 'SelectedUsersView',
								params: {
									title: i18n.t('Add_users'),
									nextAction: addUser,
									showSkipText: false
								}
							})
						}
						testID='room-actions-add-user'
						left={() => <List.Icon name='add' />}
						showActionIndicator
					/>
					<List.Separator />
				</>
			) : null}

			{['c', 'p'].includes(t) && canInviteUser ? (
				<>
					<List.Item
						title='Invite_users'
						onPress={() =>
							handleOnPress({
								route: 'InviteUsersView',
								params: { rid }
							})
						}
						testID='room-actions-invite-user'
						left={() => <List.Icon name='user-add' />}
						showActionIndicator
					/>
					<List.Separator />
				</>
			) : null}
		</View>
	);
}
