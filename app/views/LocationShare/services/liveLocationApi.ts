import sdk from '../../../lib/services/sdk';

export type Coordinates = {
	lat: number;
	lng: number; // internal client representation uses `lng`
	acc?: number;
};

export type LiveLocationStartOptions = {
	durationSec?: number;
	initial?: Coordinates;
};

export type LiveLocationStartResponse = {
	msgId: string;
};

export type LiveLocationUpdateResponse = {
	updated?: boolean;
	ignored?: boolean;
	reason?: string;
};

export type LiveLocationStopResponse = {
	stopped: boolean;
};

export type LiveLocationGetResponse = {
	messageId: string;
	ownerId: string;
	ownerUsername: string;
	ownerName: string;
	isActive: boolean;
	startedAt: Date;
	lastUpdateAt: Date;
	stoppedAt?: Date;
	coords: { lat: number; lon: number };
	expiresAt?: Date;
	version: number;
};

/**
 * Live Location API service for communicating with server-side methods
 */
export class LiveLocationApi {
	/**
	 * Start a live location session
	 * @param rid Room ID
	 * @param options Start options including duration and initial coordinates
	 * @returns Promise with message ID
	 */
	static async start(rid: string, options: LiveLocationStartOptions = {}): Promise<LiveLocationStartResponse> {
		const payload: {
			rid: string;
			durationSec?: number;
			initial?: { lat: number; lon: number };
		} = {
			rid,
			...(typeof options.durationSec === 'number' && { durationSec: options.durationSec }),
			...(options.initial && { initial: { lat: options.initial.lat, lon: options.initial.lng } })
		};
		try {
			const res = await (sdk.post as any)('liveLocation.start', payload);
			return { msgId: res.msgId };
		} catch (e: any) {
			// Common case: server returns plain text "Not Found" if route isn't deployed
			throw e;
		}
	}

	/**
	 * Update live location coordinates
	 * @param rid Room ID
	 * @param msgId Message ID returned from start
	 * @param coords Current coordinates
	 * @returns Promise with update result
	 */
	static async update(rid: string, msgId: string, coords: Coordinates): Promise<LiveLocationUpdateResponse> {
		const payload = {
			rid,
			msgId,
			coords: { lat: coords.lat, lon: coords.lng }
		};
		const res = await (sdk.post as any)('liveLocation.update', payload);
		return { updated: res.updated, ignored: res.ignored, reason: res.reason };
	}

	/**
	 * Stop live location session
	 * @param rid Room ID
	 * @param msgId Message ID returned from start
	 * @param finalCoords Optional final coordinates
	 * @returns Promise with stop result
	 */
	static async stop(rid: string, msgId: string, finalCoords?: Coordinates): Promise<LiveLocationStopResponse> {
		const payload: { rid: string; msgId: string; finalCoords?: { lat: number; lon: number } } = {
			rid,
			msgId,
			...(finalCoords && { finalCoords: { lat: finalCoords.lat, lon: finalCoords.lng } })
		};
		const res = await (sdk.post as any)('liveLocation.stop', payload);
		return { stopped: !!res.stopped };
	}

	/**
	 * Get live location data for viewing by other users
	 * @param rid Room ID
	 * @param msgId Message ID of the live location
	 * @returns Promise with live location data
	 */
	static get(rid: string, msgId: string): Promise<LiveLocationGetResponse> {
		return (sdk.get as any)('liveLocation.get', { rid, msgId });
	}


}

/**
 * Convert from mobile coordinate format to server format
 */
export function mobileToServerCoords(coords: { latitude: number; longitude: number; accuracy?: number }): Coordinates {
	return {
		lat: coords.latitude,
		lng: coords.longitude,
		acc: coords.accuracy
	};
}

/**
 * Convert from server coordinate format to mobile format
 */
export function serverToMobileCoords(
	coords: Coordinates | { lat: number; lon: number; acc?: number }
): { latitude: number; longitude: number; accuracy?: number } {
	const longitude = (coords as any).lng ?? (coords as any).lon;
	return {
		latitude: coords.lat,
		longitude,
		accuracy: (coords as any).acc
	};
}