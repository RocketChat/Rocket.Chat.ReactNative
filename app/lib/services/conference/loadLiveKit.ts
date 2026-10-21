import type * as LiveKitModule from './livekit';

export const loadLiveKit = () => {
	const livekit = require('./livekit') as typeof LiveKitModule;
	livekit.registerLiveKitGlobals();
	return livekit;
};

export type TLiveKit = ReturnType<typeof loadLiveKit>;
