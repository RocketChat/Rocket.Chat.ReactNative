import { useEffect } from 'react';
import { AppState } from 'react-native';

import { videoConferenceHeartbeat } from '~/lib/services/restApi';

const PRESENCE_HEARTBEAT_MS = 30_000;
const RENEW_THROTTLE_MS = PRESENCE_HEARTBEAT_MS / 2;

// Mirrors web's useConferencePresenceLease: the server infers leaving once renewals stop.
export const usePexipPresenceLease = (callId: string | undefined, active: boolean) => {
	useEffect(() => {
		if (!callId || !active) return;

		let lastRenewedAt: number | undefined;
		let renewing = false;
		const renewNow = () => {
			const now = performance.now();
			if (renewing) return;
			if (lastRenewedAt !== undefined && now - lastRenewedAt < RENEW_THROTTLE_MS) return;

			lastRenewedAt = now;
			renewing = true;
			videoConferenceHeartbeat(callId)
				.catch(() => undefined)
				.finally(() => {
					renewing = false;
				});
		};

		renewNow();
		const interval = setInterval(renewNow, PRESENCE_HEARTBEAT_MS);
		const subscription = AppState.addEventListener('change', state => {
			if (state === 'active') renewNow();
		});

		return () => {
			clearInterval(interval);
			subscription.remove();
		};
	}, [callId, active]);
};
