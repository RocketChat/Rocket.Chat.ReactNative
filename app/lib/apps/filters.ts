import {
	type IAppActionButton,
	type IAppActionButtonRoom,
	type TAppActionButtonCategory,
	type TRoomTypeFilter,
	RoomTypeFilter
} from './definitions';

const isTeamRoom = ({ teamMain }: IAppActionButtonRoom): boolean => !!teamMain;
const isDiscussion = ({ prid }: IAppActionButtonRoom): boolean => !!prid;

const roomTypeMatchers: { [K in TRoomTypeFilter]: (room: IAppActionButtonRoom) => boolean } = {
	[RoomTypeFilter.PUBLIC_CHANNEL]: room => room.t === 'c',
	[RoomTypeFilter.PRIVATE_CHANNEL]: room => room.t === 'p',
	[RoomTypeFilter.PUBLIC_TEAM]: room => isTeamRoom(room) && room.t === 'c',
	[RoomTypeFilter.PRIVATE_TEAM]: room => isTeamRoom(room) && room.t === 'p',
	[RoomTypeFilter.PUBLIC_DISCUSSION]: room => isDiscussion(room) && room.t === 'c',
	[RoomTypeFilter.PRIVATE_DISCUSSION]: room => isDiscussion(room) && room.t === 'p',
	[RoomTypeFilter.DIRECT]: room => room.t === 'd',
	[RoomTypeFilter.DIRECT_MULTIPLE]: room => room.t === 'd' && (room.uids?.length ?? 0) > 2,
	[RoomTypeFilter.LIVE_CHAT]: room => room.t === 'l'
};

export const applyRoomFilter = (button: IAppActionButton, room: IAppActionButtonRoom): boolean => {
	const { roomTypes } = button.when || {};
	return !roomTypes || roomTypes.some(filter => roomTypeMatchers[filter]?.(room));
};

export const applyCategoryFilter = (button: IAppActionButton, category: TAppActionButtonCategory): boolean => {
	const { category: buttonCategory } = button;

	if (category === 'default') {
		return !buttonCategory || buttonCategory === 'default';
	}

	return buttonCategory === category;
};

export interface IAppActionButtonAuth {
	roles: string[];
	permissions: { [permission: string]: string[] };
}

export const applyAuthFilter = (button: IAppActionButton, { roles, permissions }: IAppActionButtonAuth): boolean => {
	const { hasAllPermissions, hasOnePermission, hasAllRoles, hasOneRole } = button.when || {};

	const grants = (permission: string): boolean => (permissions[permission] ?? []).some(role => roles.includes(role));
	const holds = (role: string): boolean => roles.includes(role);

	return (
		(!hasAllPermissions || hasAllPermissions.every(grants)) &&
		(!hasOnePermission || hasOnePermission.some(grants)) &&
		(!hasAllRoles || hasAllRoles.every(holds)) &&
		(!hasOneRole || hasOneRole.some(holds))
	);
};

export const collectPermissions = (buttons: IAppActionButton[]): string[] => [
	...new Set(buttons.flatMap(({ when }) => [...(when?.hasAllPermissions ?? []), ...(when?.hasOnePermission ?? [])]))
];
