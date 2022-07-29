import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import { View } from 'react-native';
import { useDispatch } from 'react-redux';

import { setLoading } from '../../actions/selectedUsers';
import { TSubscriptionModel } from '../../definitions';
import i18n from '../../i18n';
import { useUserPermissions } from '../../lib/hooks/useUserPermissions';
import log, { events, logEvent } from '../../lib/methods/helpers/log';
import { Services } from '../../lib/services';
import { MasterDetailInsideStackParamList } from '../../stacks/MasterDetailStack/types';
import { ChatsStackParamList } from '../../stacks/types';
import * as List from '../List';

type TNavigation = CompositeNavigationProp<
	StackNavigationProp<ChatsStackParamList, 'RoomActionsView'>,
	StackNavigationProp<MasterDetailInsideStackParamList>
>;

interface IMembersSection {
	rid: TSubscriptionModel['rid'];
	t: TSubscriptionModel['t'];
	joined: boolean;
}

export default function MembersSection({ rid, t, joined }: IMembersSection): React.ReactElement {
	const { navigate, pop } = useNavigation<TNavigation>();
	const dispatch = useDispatch();
	const { canAddUser, canInviteUser } = useUserPermissions({ rid, t, joined });

	const handleOnPress = ({
		route,
		params
	}: {
		route: keyof ChatsStackParamList;
		params: ChatsStackParamList[keyof ChatsStackParamList];
	}) => {
		navigate(route, params);
		// @ts-ignore
		logEvent(events[`RA_GO_${route.replace('View', '').toUpperCase()}`]);
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
		<View style={{ paddingTop: canAddUser || canInviteUser ? 16 : 0, paddingBottom: canAddUser || canInviteUser ? 8 : 0 }}>
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
									nextAction: addUser
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
