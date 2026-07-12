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

	const getCanForwardGuest = async () => {
		const permissions = await hasPermission([transferLivechatGuestPermission], rid);
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

	const getCanViewCannedResponse = async () => {
		const permissions = await hasPermission([viewCannedResponsesPermission], rid);
		return permissions[0] as boolean;
	};

	const getCanPlaceLivechatOnHold = () =>
		!!(livechatAllowManualOnHold && !room?.lastMessage?.token && room?.lastMessage?.u && !room.onHold);

	const updateOmnichannel = async (isCancelled: () => boolean) => {
		const [canForwardGuest, canReturnQueue, canViewCannedResponse] = await Promise.all([
			getCanForwardGuest(),
			getCanReturnQueue(),
			getCanViewCannedResponse()
		]);
		if (isCancelled()) {
			return;
		}
		const canPlaceLivechatOnHold = getCanPlaceLivechatOnHold();
		roomStore.setState({ canForwardGuest, canReturnQueue, canViewCannedResponse, canPlaceLivechatOnHold });
	};

	// If it's a livechat room
	useEffect(() => {
		if (t !== 'l') {
			return;
		}
		let cancelled = false;
		updateOmnichannel(() => cancelled);
		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [roomUpdate.lastMessage?.token, roomUpdate.visitor, roomUpdate.status, joined]);
}
