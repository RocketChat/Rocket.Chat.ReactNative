import { useCallback } from 'react';
import { shallowEqual } from 'react-redux';

import {
	isDirectRoom,
	isMultipleDirectRoom,
	isOmnichannelRoom,
	isPrivateDiscussion,
	isPrivateRoom,
	isPrivateTeamRoom,
	isPublicDiscussion,
	isPublicRoom,
	isPublicTeamRoom
} from '../methods/helpers';
import { UIActionButtonContext, IAppActionButton, ISubscription, RoomTypeFilter } from '../../definitions';
import { TSupportedPermissions } from '../../reducers/permissions';
import { getUserSelector } from '../../selectors/login';
import { useSubscriptionRoles } from './useSubscriptionRoles';
import { useAppSelector } from './useAppSelector';

const enumToFilter: { [k in RoomTypeFilter]: (room: ISubscription) => boolean } = {
	[RoomTypeFilter.DIRECT]: isDirectRoom,
	[RoomTypeFilter.DIRECT_MULTIPLE]: isMultipleDirectRoom,
	[RoomTypeFilter.PUBLIC_CHANNEL]: isPublicRoom,
	[RoomTypeFilter.PRIVATE_CHANNEL]: isPrivateRoom,
	[RoomTypeFilter.PUBLIC_TEAM]: isPublicTeamRoom,
	[RoomTypeFilter.PRIVATE_TEAM]: isPrivateTeamRoom,
	[RoomTypeFilter.PUBLIC_DISCUSSION]: isPublicDiscussion,
	[RoomTypeFilter.PRIVATE_DISCUSSION]: isPrivateDiscussion,
	[RoomTypeFilter.LIVE_CHAT]: isOmnichannelRoom
};

const applyRoomFilter = (button: IAppActionButton, room?: ISubscription): boolean => {
	if (!room) {
		return true;
	}

	const { roomTypes } = button.when || {};
	return !roomTypes || roomTypes.some((filter): boolean => enumToFilter[filter]?.(room));
};

const useApplyAuthfilter = (rid?: string) => {
	const userRoles = useAppSelector(state => getUserSelector(state).roles || [], shallowEqual);
	const allPermissions = useAppSelector(state => state.permissions, shallowEqual);
	const subscriptionRoles = useSubscriptionRoles(rid);
	const mergedRoles = [...new Set([...subscriptionRoles || [], ...userRoles])];

	return (button: IAppActionButton) => {
		const { hasOnePermission, hasAllPermissions, hasOneRole, hasAllRoles } = button.when || {};

		const hasOnePermissionResult = hasOnePermission
			? hasOnePermission
				.map(permission => (allPermissions[permission as TSupportedPermissions] ?? []).some(r => mergedRoles.includes(r)))
				.includes(true)
			: true;
		const hasAllPermissionsResult = hasAllPermissions
			? hasAllPermissions
				.map(permission => (allPermissions[permission as TSupportedPermissions] ?? []).every(r => mergedRoles.includes(r)))
				.reduce((acc, value) => value && acc, true)
			: true;
		const hasOneRoleResult = hasOneRole ? hasOneRole.some(role => mergedRoles.includes(role)) : true;
		const hasAllRolesResult = hasAllRoles ? hasAllRoles.every(role => mergedRoles.includes(role)) : true;

		return hasOnePermissionResult && hasAllPermissionsResult && hasOneRoleResult && hasAllRolesResult;
	};
};

const useApplyButtonFilters = (room?: ISubscription) => {
	const applyAuthFilter = useApplyAuthfilter(room?.rid);

	return useCallback(
		(button: IAppActionButton) => applyAuthFilter(button) && applyRoomFilter(button, room),
		[applyAuthFilter, room]
	);
};

export const useAppActionButtons = (room?: ISubscription, context?: UIActionButtonContext, category?: string) => {
	const appActionButtons = useAppSelector(state => state.appActionButtons);
	const applyButtonFilters = useApplyButtonFilters(room);
	const parsedButtons = Object.values(appActionButtons);

	console.log('appActionButtons - parsedButtons', { appActionButtons, parsedButtons });

	return parsedButtons.filter(
		button =>
			(!context || button.context === context) && (!category || button.category === category) && applyButtonFilters(button)
	);
};
