import { useEffect } from 'react';

import { usePermissions } from '../../../lib/hooks/usePermissions';
import { type IUseOmnichannelPermissionsParams } from '../definitions';

export function useOmnichannelPermissions({ rid, t, roomStore }: IUseOmnichannelPermissionsParams): void {
	const [canForwardGuest, canViewCannedResponse] = usePermissions(
		['transfer-livechat-guest', 'view-canned-responses'],
		t === 'l' ? rid : undefined
	);

	const isLivechat = t === 'l';
	useEffect(() => {
		roomStore.setState({
			canForwardGuest: isLivechat && canForwardGuest,
			canViewCannedResponse: isLivechat && canViewCannedResponse
		});
	}, [isLivechat, canForwardGuest, canViewCannedResponse, roomStore]);
}
