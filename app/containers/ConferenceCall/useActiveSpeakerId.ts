import { useEffect, useRef, useState } from 'react';

import { useLiveRef } from '~/lib/hooks/useLiveRef';
import {
	ACTIVE_SPEAKER_SAMPLE_INTERVAL_MS,
	type ActiveSpeaker,
	NO_ACTIVE_SPEAKER,
	pickActiveSpeaker,
	SPEAKING_THRESHOLD,
	type SpeakerLevel
} from '~/lib/methods/helpers/pickActiveSpeaker';

type TSpeaker = { identity: string; audioLevel: number };

const toSpeakerLevel = (audioLevel: number): number => SPEAKING_THRESHOLD + audioLevel * (1 - SPEAKING_THRESHOLD);

const toLevels = (speakers: TSpeaker[]): SpeakerLevel[] =>
	speakers.map(({ identity, audioLevel }) => ({ id: identity, level: toSpeakerLevel(audioLevel) }));

export const useActiveSpeakerId = (remoteSpeakers: TSpeaker[], enabled: boolean): string | null => {
	const [speakerId, setSpeakerId] = useState<string | null>(null);
	const held = useRef<ActiveSpeaker>(NO_ACTIVE_SPEAKER);
	const latest = useLiveRef(remoteSpeakers);

	useEffect(() => {
		if (!enabled) {
			return;
		}
		const interval = setInterval(() => {
			held.current = pickActiveSpeaker(held.current, toLevels(latest.current), Date.now());
			setSpeakerId(held.current.id);
		}, ACTIVE_SPEAKER_SAMPLE_INTERVAL_MS);
		return () => {
			clearInterval(interval);
			held.current = NO_ACTIVE_SPEAKER;
		};
	}, [enabled, latest]);

	return enabled ? speakerId : null;
};
