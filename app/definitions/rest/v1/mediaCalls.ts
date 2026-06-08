import type { ServerMediaSignal } from '@rocket.chat/media-signaling';

export type MediaCallsEndpoints = {
	'media-calls.stateSignals': {
		GET: (params: { contractId: string }) => { signals: ServerMediaSignal[]; success: boolean };
	};
};
