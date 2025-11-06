import { liveLocationStart, liveLocationUpdate, liveLocationStop, liveLocationGet } from '../../../lib/services/restApi';
import I18n from '../../../i18n';

export type Coordinates = {
	lat: number;
	lon: number;
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
	ownerUsername?: string;
	ownerName?: string;
	isActive: boolean;
	startedAt: string;
	lastUpdateAt: string;
	stoppedAt?: string;
	coords: { lat: number; lon: number };
	expiresAt?: string;
	version?: number;
};

export class LiveLocationApi {
	static async start(rid: string, options: LiveLocationStartOptions = {}): Promise<LiveLocationStartResponse> {
		const initial = options.initial
			? { lat: options.initial.lat, lon: options.initial.lon, acc: options.initial.acc }
			: undefined;
		const res = await liveLocationStart(rid, options.durationSec, initial);
		if ('success' in res && !res.success) {
			throw new Error(typeof res.error === 'string' ? res.error : I18n.t('Live_Location_Start_Failed'));
		}
		return { msgId: res.msgId };
	}

	static async update(rid: string, msgId: string, coords: Coordinates): Promise<LiveLocationUpdateResponse> {
		const serverCoords = { lat: coords.lat, lon: coords.lon, acc: coords.acc };
		const res = await liveLocationUpdate(rid, msgId, serverCoords);
		if ('success' in res && !res.success) {
			throw new Error(typeof res.error === 'string' ? res.error : I18n.t('Live_Location_Update_Error'));
		}
		return { updated: res.updated, ignored: res.ignored, reason: res.reason };
	}

	static async stop(rid: string, msgId: string, finalCoords?: Coordinates): Promise<LiveLocationStopResponse> {
		const serverCoords = finalCoords ? { lat: finalCoords.lat, lon: finalCoords.lon, acc: finalCoords.acc } : undefined;
		const res = await liveLocationStop(rid, msgId, serverCoords);
		if ('success' in res && !res.success) {
			throw new Error(typeof res.error === 'string' ? res.error : I18n.t('Live_Location_Stop_Error'));
		}
		return { stopped: !!res.stopped };
	}

	static async get(rid: string, msgId: string): Promise<LiveLocationGetResponse> {
		const res = await liveLocationGet(rid, msgId);
		if ('success' in res && !res.success) {
			throw new Error(typeof res.error === 'string' ? res.error : I18n.t('Live_Location_Get_Error'));
		}
		if (!res.startedAt || !res.lastUpdateAt || !res.coords) {
			throw new Error(I18n.t('Live_Location_Invalid_Response'));
		}
		if (!res.messageId || !res.ownerId || typeof res.isActive !== 'boolean' || typeof res.version !== 'number') {
			throw new Error(I18n.t('Live_Location_Invalid_Response'));
		}
		return {
			messageId: res.messageId,
			ownerId: res.ownerId,
			ownerUsername: res.ownerUsername ?? '',
			ownerName: res.ownerName ?? '',
			isActive: res.isActive,
			startedAt: res.startedAt,
			lastUpdateAt: res.lastUpdateAt,
			stoppedAt: res.stoppedAt,
			coords: res.coords,
			expiresAt: res.expiresAt,
			version: res.version
		};
	}
}

export function mobileToServerCoords(coords: { latitude: number; longitude: number; accuracy?: number }): {
	lat: number;
	lon: number;
	acc?: number;
} {
	return {
		lat: coords.latitude,
		lon: coords.longitude,
		acc: coords.accuracy
	};
}

export function serverToMobileCoords(coords: Coordinates | { lat: number; lon: number; acc?: number }): {
	latitude: number;
	longitude: number;
	accuracy?: number;
} {
	if (coords.lon == null) {
		throw new Error(I18n.t('Live_Location_Invalid_Coordinates'));
	}
	return {
		latitude: coords.lat,
		longitude: coords.lon,
		accuracy: coords.acc
	};
}
