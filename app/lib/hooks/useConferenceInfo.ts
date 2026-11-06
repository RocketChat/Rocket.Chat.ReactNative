import { useCallback, useEffect, useState } from 'react';

import type { IDDPMessage } from '~/definitions/IDDPMessage';
import type { VideoConfCall } from '~/definitions/IVideoConference';
import type { Serialized } from '~/definitions/rest/helpers';
import log from '~/lib/methods/helpers/log';
import { isPreflightCallId } from '~/lib/services/conference/useConferenceCallStore';
import { videoConferenceInfo } from '~/lib/services/restApi';
import sdk from '~/lib/services/sdk';
import { useAppSelector } from './useAppSelector';

const STREAM = 'stream-video-conference';
const COALESCE_MS = 50;

export type TConferenceInfoResult = Serialized<VideoConfCall>;

type TConferenceInfo = {
	info?: TConferenceInfoResult;
	loading: boolean;
	failed: boolean;
	reload: () => void;
};

type TResponse = { requestKey: string; callId: string; info?: TConferenceInfoResult; failed: boolean };

type TUpdatesSubscription = { holders: number; ready: ReturnType<typeof sdk.subscribe> };

const updatesSubscriptions = new Map<string, TUpdatesSubscription>();

const scheduledRequests = new Map<string, ReturnType<typeof videoConferenceInfo>>();

const requestConferenceInfo = (callId: string): ReturnType<typeof videoConferenceInfo> => {
	const scheduled = scheduledRequests.get(callId);
	if (scheduled) {
		return scheduled;
	}
	const request: ReturnType<typeof videoConferenceInfo> = new Promise((resolve, reject) => {
		setTimeout(() => {
			scheduledRequests.delete(callId);
			videoConferenceInfo(callId).then(resolve, reject);
		}, COALESCE_MS);
	});
	scheduledRequests.set(callId, request);
	return request;
};

const retainUpdates = (eventName: string): TUpdatesSubscription['ready'] => {
	const existing = updatesSubscriptions.get(eventName);
	if (existing) {
		existing.holders += 1;
		return existing.ready;
	}
	const ready = sdk.subscribe(STREAM, eventName);
	updatesSubscriptions.set(eventName, { holders: 1, ready });
	ready.catch(() => updatesSubscriptions.delete(eventName));
	return ready;
};

const releaseUpdates = (eventName: string): void => {
	const entry = updatesSubscriptions.get(eventName);
	if (!entry) {
		return;
	}
	entry.holders -= 1;
	if (entry.holders > 0) {
		return;
	}
	entry.ready
		.then(subscription => {
			if (!subscription || entry.holders > 0 || updatesSubscriptions.get(eventName) !== entry) {
				return;
			}
			updatesSubscriptions.delete(eventName);
			return sdk.unsubscribe(subscription);
		})
		.catch(log);
};

export const useConferenceInfo = (callId: string | undefined, { live = false }: { live?: boolean } = {}): TConferenceInfo => {
	const [response, setResponse] = useState<TResponse>();
	const [reloadCount, setReloadCount] = useState(0);
	const userId = useAppSelector(state => state.login.user.id);
	const connected = useAppSelector(state => state.meteor.connected);
	const known = !!callId && !isPreflightCallId(callId);
	const requestKey = `${callId}|${reloadCount}|${connected}`;

	const reload = useCallback(() => setReloadCount(count => count + 1), []);

	useEffect(() => {
		if (!known) {
			return;
		}
		let ignore = false;
		requestConferenceInfo(callId)
			.then(result => {
				if (!ignore) {
					setResponse(previous => ({
						requestKey,
						callId,
						info: result.success ? result : previous?.info,
						failed: !result.success
					}));
				}
			})
			.catch(error => {
				if (!ignore) {
					log(error);
					setResponse(previous => ({ requestKey, callId, info: previous?.info, failed: true }));
				}
			});
		return () => {
			ignore = true;
		};
	}, [callId, known, requestKey]);

	useEffect(() => {
		if (!live || !known || !connected || !userId) {
			return;
		}
		const eventName = `${callId}/updated`;
		let stopped = false;
		let listener: Awaited<ReturnType<typeof sdk.onStreamData>> | undefined;

		const start = async () => {
			await retainUpdates(eventName);
			const created = await sdk.onStreamData(STREAM, (ddpMessage: IDDPMessage) => {
				if (ddpMessage.fields?.eventName === eventName) {
					reload();
				}
			});
			if (stopped) {
				created.stop();
				return;
			}
			listener = created;
			reload();
		};
		start().catch(log);

		return () => {
			stopped = true;
			listener?.stop();
			releaseUpdates(eventName);
		};
	}, [live, known, connected, userId, callId, reload]);

	const current = known && response?.callId === callId ? response : undefined;

	return {
		info: current?.info,
		loading: known && response?.requestKey !== requestKey,
		failed: !!current?.failed,
		reload
	};
};
