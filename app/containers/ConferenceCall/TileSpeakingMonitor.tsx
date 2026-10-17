import { useTrackVolume } from '@livekit/react-native';
import { useEffect, useRef } from 'react';

import { useLiveRef } from '~/lib/hooks/useLiveRef';
import { initialSpeechState, releaseSpeech, SPEAKING_RING_TIMING, stepSpeech } from '~/lib/methods/helpers/stepSpeech';
import { type TTrackRef } from './useConferenceTiles';

interface ITileSpeakingMonitor {
	identity: string;
	trackRef: TTrackRef | undefined;
	onChange: (identity: string, speaking: boolean) => void;
}

const TileSpeakingMonitor = ({ identity, trackRef, onChange }: ITileSpeakingMonitor): null => {
	const volume = useTrackVolume(trackRef);
	const listening = !!trackRef;
	const state = useRef(initialSpeechState);
	const report = useLiveRef(onChange);

	useEffect(() => {
		if (!listening) {
			return;
		}
		const reportSilence = () => report.current(identity, false);
		return () => {
			state.current = initialSpeechState;
			reportSilence();
		};
	}, [listening, identity, report]);

	useEffect(() => {
		if (!listening) {
			return;
		}
		const now = Date.now();
		const next = stepSpeech(state.current, volume, now, SPEAKING_RING_TIMING);
		if (next.speaking !== state.current.speaking) {
			report.current(identity, next.speaking);
		}
		state.current = next;
		if (!next.speaking || next.lastLoudAt === undefined) {
			return;
		}
		const wait = Math.max(0, next.lastLoudAt + SPEAKING_RING_TIMING.releaseMs - now);
		const release = setTimeout(() => {
			const released = releaseSpeech(state.current, Date.now(), SPEAKING_RING_TIMING);
			if (released.speaking !== state.current.speaking) {
				report.current(identity, false);
			}
			state.current = released;
		}, wait);
		return () => clearTimeout(release);
	}, [volume, listening, identity, report]);

	return null;
};

export default TileSpeakingMonitor;
