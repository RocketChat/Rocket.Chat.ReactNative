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

// const useApplyButtonAuthFilters = () => {
//     return (button: IAppActionButton) => {
//         const { hasAllPermissions, hasOnePermission, hasAllRoles, hasOneRole } = button.when || {};

//     }
// }

// const useApplyHasOnePermissionButtonFilter = (appActionButton: IAppActionButton) => {
// 	const { hasOnePermission } = appActionButton.when || {};

// 	if (!hasOnePermission) {
// 		return true;
// 	}

// 	const permissions = usePermissions(hasOnePermission as TSupportedPermissions[]);

// 	return permissions.includes(true);
// };

// const useApplyHasAllPermissionsButtonFilter = (appActionButton: IAppActionButton) => {
// 	const { hasAllPermissions } = appActionButton.when || {};

// 	if (!hasAllPermissions) {
// 		return true;
// 	}

// 	const permissions = usePermissions(hasAllPermissions as TSupportedPermissions[]);

// 	return permissions.reduce((acc, value) => value && acc, true);
// };

// const useApplyButtonAuthFilters = (appActionButtons: IAppActionButton[]) =>
// 	appActionButtons.filter(button => {
// 		const { hasAllPermissions, hasOnePermission, hasAllRoles, hasOneRole } = button.when || {};

// 		const hasOneRoleResult = useHasAtLeastOneRole(hasOneRole || []);
// 		const hasAllRolesResult = useHasAllRoles(hasAllRoles || []);
// 		const hasAllPermissionsResult = usePermissions((hasAllPermissions || []) as TSupportedPermissions[]).reduce(
// 			(acc, value) => value && acc,
// 			true
// 		);
// 		const hasOnePermissionsResult = usePermissions((hasOnePermission || []) as TSupportedPermissions[]).includes(true);

// 		return hasOneRole
// 			? hasOneRoleResult
// 			: true && hasAllRoles
// 			? hasAllRolesResult
// 			: true && hasAllPermissions
// 			? hasAllPermissionsResult
// 			: true && hasOnePermission
// 			? hasOnePermissionsResult
// 			: true;
// 	});

//     import { useMemo } from 'react';

// const useApplyButtonAuthFilters1 = (appActionButtons: IAppActionButton[]) => {
// 	const rolesResults = useMemo(
// 		() =>
// 			appActionButtons.map((button) => ({
// 				hasOneRoleResult: useHasAtLeastOneRole(button.when?.hasOneRole || []),
// 				hasAllRolesResult: useHasAllRoles(button.when?.hasAllRoles || []),
// 			})),
// 		[appActionButtons]
// 	);

// 	const permissionsResults = useMemo(
// 		() =>
// 			appActionButtons.map((button) => ({
// 				hasAllPermissionsResult: usePermissions((button.when?.hasAllPermissions || []) as TSupportedPermissions[])
// 					.reduce((acc, value) => value && acc, true),
// 				hasOnePermissionsResult: usePermissions((button.when?.hasOnePermission || []) as TSupportedPermissions[])
// 					.includes(true),
// 			})),
// 		[appActionButtons]
// 	);

// 	return appActionButtons.filter((button, index) => {
// 		const { hasAllPermissions, hasOnePermission, hasAllRoles, hasOneRole } = button.when || {};
// 		const { hasOneRoleResult, hasAllRolesResult } = rolesResults[index];
// 		const { hasAllPermissionsResult, hasOnePermissionsResult } = permissionsResults[index];

// 		return (
// 			(hasOneRole ? hasOneRoleResult : true) &&
// 			(hasAllRoles ? hasAllRolesResult : true) &&
// 			(hasAllPermissions ? hasAllPermissionsResult : true) &&
// 			(hasOnePermission ? hasOnePermissionsResult : true)
// 		);
// 	});
// };
