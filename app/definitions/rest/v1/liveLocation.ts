import type { IMessage } from '../../IMessage';
import type { IServerRoom } from '../../IRoom';

export type LiveLocationEndpoints = {
	'liveLocation.start': {
		POST: (params: { rid: IServerRoom['_id']; durationSec?: number; initial?: { lat: number; lon: number; acc?: number } }) => {
			msgId: string;
		};
	};
	'liveLocation.update': {
		POST: (params: { rid: IServerRoom['_id']; msgId: IMessage['_id']; coords: { lat: number; lon: number; acc?: number } }) => {
			updated?: boolean;
			ignored?: boolean;
			reason?: string;
		};
	};
	'liveLocation.stop': {
		POST: (params: {
			rid: IServerRoom['_id'];
			msgId: IMessage['_id'];
			finalCoords?: { lat: number; lon: number; acc?: number };
		}) => {
			stopped?: boolean;
		};
	};
	'liveLocation.get': {
		GET: (params: { rid: IServerRoom['_id']; msgId: IMessage['_id'] }) => {
			messageId: string;
			ownerId: string;
			ownerUsername?: string;
			ownerName?: string;
			isActive: boolean;
			startedAt?: string;
			lastUpdateAt?: string;
			stoppedAt?: string;
			coords?: { lat: number; lon: number };
			expiresAt?: string;
			version: number;
		};
	};
};
