import { liveLocationStart, liveLocationUpdate, liveLocationStop, liveLocationGet } from '../../../lib/services/restApi';

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

export class LiveLocationApi {
	static async start(rid: string, options: LiveLocationStartOptions = {}): Promise<LiveLocationStartResponse> {
		const initial = options.initial ? { lat: options.initial.lat, lon: options.initial.lng } : undefined;
		const res = await liveLocationStart(rid, options.durationSec, initial);
		return { msgId: res.msgId };
	}

	static async update(rid: string, msgId: string, coords: Coordinates): Promise<LiveLocationUpdateResponse> {
		const serverCoords = { lat: coords.lat, lon: coords.lng };
		const res = await liveLocationUpdate(rid, msgId, serverCoords);
		return { updated: res.updated, ignored: res.ignored, reason: res.reason };
	}

	static async stop(rid: string, msgId: string, finalCoords?: Coordinates): Promise<LiveLocationStopResponse> {
		const serverCoords = finalCoords ? { lat: finalCoords.lat, lon: finalCoords.lng } : undefined;
		const res = await liveLocationStop(rid, msgId, serverCoords);
		return { stopped: !!res.stopped };
	}

	static get(rid: string, msgId: string): Promise<LiveLocationGetResponse> {
		return liveLocationGet(rid, msgId);
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
	const coordsWithLng = coords as unknown as { lat: number; lng?: number; lon?: number; acc?: number };
	const longitude = coordsWithLng.lng ?? coordsWithLng.lon ?? 0;
	return {
		latitude: coords.lat,
		longitude,
		accuracy: coordsWithLng.acc
	};
}