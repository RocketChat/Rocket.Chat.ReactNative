import { useEffect } from 'react';

import { getRoutingConfig } from '../../../lib/services/restApi';
import { usePermissions } from '../../../lib/hooks/usePermissions';
import { type IRoomViewState, type IUseOmnichannelPermissionsParams } from '../definitions';

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
	livechatAllowManualOnHold,
	roomStore
}: IUseOmnichannelPermissionsParams): void {
	'use memo';

	const [canForwardGuest, canViewCannedResponse] = usePermissions(
		['transfer-livechat-guest', 'view-canned-responses'],
		t === 'l' ? rid : undefined
	);

	useEffect(() => {
		if (t !== 'l') {
			return;
		}
		roomStore.setState({ canForwardGuest, canViewCannedResponse });
	}, [t, canForwardGuest, canViewCannedResponse, roomStore]);

	useEffect(() => {
		if (t !== 'l') {
			return;
		}
		let cancelled = false;
		getCanReturnQueue().then(canReturnQueue => {
			if (cancelled) {
				return;
			}
			roomStore.setState({
				canReturnQueue,
				canPlaceLivechatOnHold: getCanPlaceLivechatOnHold(livechatAllowManualOnHold, room)
			});
		});
		return () => {
			cancelled = true;
		};
	}, [
		t,
		room,
		roomStore,
		livechatAllowManualOnHold,
		roomUpdate.lastMessage?.token,
		roomUpdate.visitor,
		roomUpdate.status,
		joined
	]);
}
