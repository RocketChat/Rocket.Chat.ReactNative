import { useEffect, useState } from 'react';
import { useStore } from 'zustand';

import { getRoutingConfig } from '../../../lib/services/restApi';
import { usePermissions } from '../../../lib/hooks/usePermissions';
import { type IUseOmnichannelPermissionsParams } from '../definitions';

const getCanReturnQueue = async () => {
	try {
		const { returnQueue } = await getRoutingConfig();
		return returnQueue;
	} catch {
		return false;
	}
};

export function useOmnichannelPermissions({
	rid,
	t,
	roomUpdate,
	joined,
	livechatAllowManualOnHold,
	roomStore
}: IUseOmnichannelPermissionsParams): void {
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

	const [canReturnQueue, setCanReturnQueue] = useState(false);

	// The routing config is server-global, so it is fetched once per screen rather than again on
	// every rid swap or join.
	useEffect(() => {
		if (t !== 'l') {
			return;
		}
		let cancelled = false;
		getCanReturnQueue().then(returnQueue => {
			if (cancelled) {
				return;
			}
			setCanReturnQueue(returnQueue);
		});
		return () => {
			cancelled = true;
		};
	}, [t]);

	const lastMessageFromAgent = useStore(roomStore, s => s.lastMessageFromAgent);

	useEffect(() => {
		if (t !== 'l') {
			return;
		}
		roomStore.setState({
			canReturnQueue,
			canPlaceLivechatOnHold: !!(livechatAllowManualOnHold && lastMessageFromAgent && !roomUpdate.onHold)
		});
	}, [t, roomStore, canReturnQueue, livechatAllowManualOnHold, lastMessageFromAgent, roomUpdate.onHold, joined]);
}
