import sdk from '../../../lib/services/sdk';

export type Coordinates = {
	lat: number;
	lng: number;
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
	coords: Coordinates;
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
	static start(rid: string, options: LiveLocationStartOptions = {}): Promise<LiveLocationStartResponse> {
		return sdk.methodCallWrapper('liveLocation.start', rid, options);
	}

	/**
	 * Update live location coordinates
	 * @param rid Room ID
	 * @param msgId Message ID returned from start
	 * @param coords Current coordinates
	 * @returns Promise with update result
	 */
	static update(rid: string, msgId: string, coords: Coordinates): Promise<LiveLocationUpdateResponse> {
		return sdk.methodCallWrapper('liveLocation.update', rid, msgId, coords);
	}

	/**
	 * Stop live location session
	 * @param rid Room ID
	 * @param msgId Message ID returned from start
	 * @param finalCoords Optional final coordinates
	 * @returns Promise with stop result
	 */
	static stop(rid: string, msgId: string, finalCoords?: Coordinates): Promise<LiveLocationStopResponse> {
		return sdk.methodCallWrapper('liveLocation.stop', rid, msgId, finalCoords);
	}

	/**
	 * Get live location data for viewing by other users
	 * @param rid Room ID
	 * @param msgId Message ID of the live location
	 * @returns Promise with live location data
	 */
	static get(rid: string, msgId: string): Promise<LiveLocationGetResponse> {
		return sdk.methodCallWrapper('liveLocation.get', rid, msgId);
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
export function serverToMobileCoords(coords: Coordinates): { latitude: number; longitude: number; accuracy?: number } {
	return {
		latitude: coords.lat,
		longitude: coords.lng,
		accuracy: coords.acc
	};
}