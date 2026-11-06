import { useEffect, useState } from 'react';

import log from '~/lib/methods/helpers/log';
import {
	summarizeConnectionStats,
	type TConnectionSummary,
	type TReceiverStat,
	type TSenderStat,
	type TStatsSample,
	type TVideoSenderStat
} from '~/lib/methods/helpers/summarizeConnectionStats';
import { isAudioTrack, isLocalTrack, isRemoteTrack, isVideoTrack, type Room } from '~/lib/services/conference/livekit';

const SAMPLE_INTERVAL_MS = 1000;

export type TConferenceDiagnostics = Omit<TConnectionSummary, 'sample'> & {
	totalBytesSent: number;
	totalBytesReceived: number;
	connectionState: string;
	connectionQuality: string;
};

const collectStats = async (room: Room) => {
	const audioSenders: TSenderStat[] = [];
	const videoSenders: TVideoSenderStat[] = [];
	const receivers: TReceiverStat[] = [];
	const pending: Promise<void>[] = [];

	room.localParticipant.trackPublications.forEach(({ track }) => {
		if (!track || !isLocalTrack(track)) {
			return;
		}
		if (isVideoTrack(track)) {
			pending.push(
				track.getSenderStats().then(stats => {
					videoSenders.push(...stats);
				})
			);
		} else if (isAudioTrack(track)) {
			pending.push(
				track.getSenderStats().then(stats => {
					if (stats) {
						audioSenders.push(stats);
					}
				})
			);
		}
	});

	room.remoteParticipants.forEach(participant => {
		participant.trackPublications.forEach(({ track }) => {
			if (!track || !isRemoteTrack(track) || (!isVideoTrack(track) && !isAudioTrack(track))) {
				return;
			}
			pending.push(
				track.getReceiverStats().then(stats => {
					if (stats) {
						receivers.push(stats);
					}
				})
			);
		});
	});

	await Promise.all(pending);
	return { audioSenders, videoSenders, receivers };
};

export const useConferenceDiagnostics = (room?: Room): TConferenceDiagnostics | undefined => {
	const [diagnostics, setDiagnostics] = useState<TConferenceDiagnostics>();

	useEffect(() => {
		if (!room) {
			return;
		}
		let stopped = false;
		let previous: TStatsSample | undefined;

		const sampleOnce = async () => {
			try {
				const stats = await collectStats(room);
				if (stopped) {
					return;
				}
				const { sample, ...summary } = summarizeConnectionStats({ ...stats, previous, now: Date.now() });
				previous = sample;
				setDiagnostics({
					...summary,
					totalBytesSent: sample.bytesSent,
					totalBytesReceived: sample.bytesReceived,
					connectionState: room.state,
					connectionQuality: room.localParticipant.connectionQuality
				});
			} catch (error) {
				log(error);
			}
		};

		sampleOnce();
		const interval = setInterval(sampleOnce, SAMPLE_INTERVAL_MS);
		return () => {
			stopped = true;
			clearInterval(interval);
		};
	}, [room]);

	return diagnostics;
};
