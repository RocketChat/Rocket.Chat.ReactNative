import { useEffect } from 'react';

import { usePermissions } from '../../../lib/hooks/usePermissions';
import { type IUseOmnichannelPermissionsParams } from '../definitions';

export function useOmnichannelPermissions({ rid, t, roomStore }: IUseOmnichannelPermissionsParams): void {
	const isLivechat = t === 'l';
	const [canForwardGuest, canViewCannedResponse] = usePermissions(
		['transfer-livechat-guest', 'view-canned-responses'],
		isLivechat ? rid : undefined
	);

	useEffect(() => {
		roomStore.setState({
			canForwardGuest: isLivechat && canForwardGuest,
			canViewCannedResponse: isLivechat && canViewCannedResponse
		});
	}, [isLivechat, canForwardGuest, canViewCannedResponse, roomStore]);
}
