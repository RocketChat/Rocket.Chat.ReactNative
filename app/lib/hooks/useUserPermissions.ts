import { useEffect, useState } from 'react';

import { TSubscriptionModel } from '../../definitions';
import { hasPermission } from '../methods/helpers';
import { useAppSelector } from './useAppSelector';

interface IMembersSection {
	rid: TSubscriptionModel['rid'];
	t: TSubscriptionModel['t'];
	joined: boolean;
}
// Promise.allSettled() is not working for react native, in the future use this instead of various useEffects
// https://github.com/facebook/react-native/issues/30236#issuecomment-939286987
export const useUserPermissions = ({ rid, t, joined }: IMembersSection): { canAddUser: boolean; canInviteUser: boolean } => {
	const [canAddUser, setCanAddUser] = useState(false);
	const [canInviteUser, setCanInviteUser] = useState(false);
	const addUserToJoinedRoomPermission = useAppSelector(state => state.permissions['add-user-to-joined-room']);
	const addUserToAnyCRoomPermission = useAppSelector(state => state.permissions['add-user-to-any-c-room']);
	const addUserToAnyPRoomPermission = useAppSelector(state => state.permissions['add-user-to-any-p-room']);
	const createInviteLinksPermission = useAppSelector(state => state.permissions['create-invite-links']);

	useEffect(() => {
		const canAddUserHandler = async () => {
			const permissions = await hasPermission(
				[addUserToJoinedRoomPermission, addUserToAnyCRoomPermission, addUserToAnyPRoomPermission],
				rid
			);
			if (joined && permissions[0]) {
				return setCanAddUser(true);
			}
			if (t === 'c' && permissions[1]) {
				return setCanAddUser(true);
			}
			if (t === 'p' && permissions[2]) {
				return setCanAddUser(true);
			}
		};
		canAddUserHandler();
	}, []);

	useEffect(() => {
		const canInviteUserHandler = async () => {
			const permissions = await hasPermission([createInviteLinksPermission], rid);
			const canInviteUser = permissions[0];
			return setCanInviteUser(canInviteUser);
		};
		canInviteUserHandler();
	}, []);

	return { canAddUser, canInviteUser };
};
