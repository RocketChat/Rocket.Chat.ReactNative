import { useEffect } from 'react';

import { getRoutingConfig } from '../../../lib/services/restApi';
import { hasPermission } from '../../../lib/methods/helpers';
import { type IRoomViewState } from '../definitions';
import { type RoomStore } from '../stores/RoomStore';

export interface IUseOmnichannelPermissionsParams {
	rid?: string;
	t?: string;
	room: IRoomViewState['room'];
	roomUpdate: IRoomViewState['roomUpdate'];
	joined: boolean;
	transferLivechatGuestPermission?: string[];
	viewCannedResponsesPermission?: string[];
	livechatAllowManualOnHold?: boolean;
	roomStore: RoomStore;
}

const getPermissionFlag = async (permission: string[] | undefined, rid?: string) => {
	const permissions = await hasPermission([permission], rid);
	return permissions[0] as boolean;
};

const getCanReturnQueue = async () => {
	try {
		const { returnQueue } = await getRoutingConfig();
		return returnQueue;
	} catch {
		return false;
	}
};

const getCanPlaceLivechatOnHold = (livechatAllowManualOnHold: boolean | undefined, room: IRoomViewState['room']) =>
	!!(livechatAllowManualOnHold && !room?.lastMessage?.token && room?.lastMessage?.u && !room.onHold);

export function useOmnichannelPermissions({
	rid,
	t,
	room,
	roomUpdate,
	joined,
	transferLivechatGuestPermission,
	viewCannedResponsesPermission,
	livechatAllowManualOnHold,
	roomStore
}: IUseOmnichannelPermissionsParams): void {
	'use memo';

	// If it's a livechat room
	useEffect(() => {
		if (t !== 'l') {
			return;
		}
		let cancelled = false;
		const updateOmnichannel = async () => {
			const [canForwardGuest, canReturnQueue, canViewCannedResponse] = await Promise.all([
				getPermissionFlag(transferLivechatGuestPermission, rid),
				getCanReturnQueue(),
				getPermissionFlag(viewCannedResponsesPermission, rid)
			]);
			if (cancelled) {
				return;
			}
			const canPlaceLivechatOnHold = getCanPlaceLivechatOnHold(livechatAllowManualOnHold, room);
			roomStore.setState({ canForwardGuest, canReturnQueue, canViewCannedResponse, canPlaceLivechatOnHold });
		};
		updateOmnichannel();
		return () => {
			cancelled = true;
		};
	}, [
		t,
		rid,
		room,
		roomStore,
		transferLivechatGuestPermission,
		viewCannedResponsesPermission,
		livechatAllowManualOnHold,
		roomUpdate.lastMessage?.token,
		roomUpdate.visitor,
		roomUpdate.status,
		joined
	]);
}
