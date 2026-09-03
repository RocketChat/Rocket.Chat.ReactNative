import { useEffect } from 'react';

import { usePermissions } from '../../../lib/hooks/usePermissions';
import { type IUseOmnichannelPermissionsParams } from '../definitions';

export function useOmnichannelPermissions({ rid, t, roomStore }: IUseOmnichannelPermissionsParams): void {
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
}
