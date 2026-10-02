import { type CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch } from 'react-redux';

import { setLoading } from '~/actions/selectedUsers';
import { type TIconsName } from '~/containers/CustomIcon';
import { type TSubscriptionModel } from '~/definitions';
import i18n from '~/i18n';
import { usePermissions } from '~/lib/hooks/usePermissions';
import log, { events, logEvent } from '~/lib/methods/helpers/log';
import { addUsersToRoom } from '~/lib/services/restApi';
import { type MasterDetailInsideStackParamList } from '~/stacks/MasterDetailStack/types';
import { type ChatsStackParamList } from '~/stacks/types';

type TNavigation = CompositeNavigationProp<
	NativeStackNavigationProp<ChatsStackParamList, 'RoomActionsView'>,
	NativeStackNavigationProp<MasterDetailInsideStackParamList>
>;

export interface IActionsSection {
	rid: TSubscriptionModel['rid'];
	t: TSubscriptionModel['t'];
	joined: boolean;
	abacAttributes: TSubscriptionModel['abacAttributes'];
}

export interface IMemberAction {
	title: string;
	icon: TIconsName;
	onPress: () => void;
	testID: string;
	disabled?: boolean;
	disabledReason?: string;
}

export const useMemberActions = ({ rid, t, joined, abacAttributes }: IActionsSection): IMemberAction[] => {
	const { navigate, pop } = useNavigation<TNavigation>();
	const dispatch = useDispatch();
	const [addUserToJoinedRoomPermission, addUserToAnyCRoomPermission, addUserToAnyPRoomPermission, createInviteLinksPermission] =
		usePermissions(['add-user-to-joined-room', 'add-user-to-any-c-room', 'add-user-to-any-p-room', 'create-invite-links'], rid);

	if (!['c', 'p'].includes(t)) {
		return [];
	}

	const canAddUser =
		(joined && addUserToJoinedRoomPermission) ||
		(t === 'c' && addUserToAnyCRoomPermission) ||
		(t === 'p' && addUserToAnyPRoomPermission) ||
		false;

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
			await addUsersToRoom(rid);
			pop();
		} catch (e) {
			log(e);
		} finally {
			dispatch(setLoading(false));
		}
	};

	const actions: IMemberAction[] = [];
	if (canAddUser) {
		actions.push({
			title: 'Add_users',
			icon: 'add',
			testID: 'room-actions-add-user',
			onPress: () =>
				handleOnPress({
					route: 'SelectedUsersView',
					params: { title: i18n.t('Add_users'), nextAction: addUser, showSkipText: false }
				})
		});
	}
	if (createInviteLinksPermission) {
		actions.push({
			title: 'Invite_users',
			icon: 'user-add',
			testID: 'room-actions-invite-user',
			onPress: () => handleOnPress({ route: 'InviteUsersView', params: { rid } }),
			disabled: !!abacAttributes,
			disabledReason: abacAttributes ? i18n.t('ABAC_disabled_action_reason') : undefined
		});
	}
	return actions;
};
