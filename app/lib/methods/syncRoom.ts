import { getSubscriptionByRoomId } from '../database/services/Subscription';
import { loadMessagesForRoom } from './loadMessagesForRoom';
import { loadMissedMessages } from './loadMissedMessages';
import { isRoomType, type RoomTypes } from './roomTypeToApiType';

export interface ISyncRoomParams {
	rid: string;
	fallbackRoomType?: RoomTypes;
}

interface IRequest {
	params: ISyncRoomParams;
	resolve: () => void;
	reject: (reason: unknown) => void;
}

const activeRooms = new Set<string>();
const requestedReruns = new Map<string, IRequest[]>();

async function routeFromLatestSubscription({ rid, fallbackRoomType }: ISyncRoomParams): Promise<void> {
	const subscription = await getSubscriptionByRoomId(rid);

	if (subscription?.lastOpen) {
		return loadMissedMessages({ rid, cursor: subscription.lastOpen });
	}

	const roomType = isRoomType(subscription?.t) ? subscription.t : fallbackRoomType;
	if (!isRoomType(roomType)) {
		return;
	}

	return loadMessagesForRoom({ rid, t: roomType });
}

async function drain(rid: string, firstRequests: IRequest[]): Promise<void> {
	let requests: IRequest[] | undefined = firstRequests;
	try {
		while (requests) {
			try {
				await routeFromLatestSubscription(requests[requests.length - 1].params);
				requests.forEach(({ resolve }) => resolve());
			} catch (error) {
				requests.forEach(({ reject }) => reject(error));
			}
			requests = requestedReruns.get(rid);
			requestedReruns.delete(rid);
		}
	} finally {
		requestedReruns.delete(rid);
		activeRooms.delete(rid);
	}
}

export function syncRoom(params: ISyncRoomParams): Promise<void> {
	const { rid } = params;
	return new Promise<void>((resolve, reject) => {
		const request = { params, resolve, reject };

		if (activeRooms.has(rid)) {
			const rerun = requestedReruns.get(rid);
			if (rerun) {
				rerun.push(request);
			} else {
				requestedReruns.set(rid, [request]);
			}
			return;
		}

		activeRooms.add(rid);
		drain(rid, [request]);
	});
}
