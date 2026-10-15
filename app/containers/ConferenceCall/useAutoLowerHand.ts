import { useEffect, useRef } from 'react';

import { useLiveRef } from '~/lib/hooks/useLiveRef';
import { advanceAutoLowerHand, type SpeakingStreak } from '~/lib/methods/helpers/advanceAutoLowerHand';
import log from '~/lib/methods/helpers/log';
import { conferenceSession } from '~/lib/services/conference/ConferenceSession';

const SAMPLE_INTERVAL_MS = 200;
const SPEAKING_LEVEL = 1;
const SILENT_LEVEL = 0;

interface IAutoLowerHandOptions {
	handRaised: boolean;
	micEnabled: boolean;
	isSpeaking: boolean;
}

export const useAutoLowerHand = ({ handRaised, micEnabled, isSpeaking }: IAutoLowerHandOptions): void => {
	const streak = useRef<SpeakingStreak | null>(null);
	const speaking = useLiveRef(isSpeaking);
	const active = handRaised && micEnabled;

	useEffect(() => {
		if (!active) {
			return;
		}
		const interval = setInterval(() => {
			const step = advanceAutoLowerHand(streak.current, {
				micLevel: speaking.current ? SPEAKING_LEVEL : SILENT_LEVEL,
				now: Date.now()
			});
			streak.current = step.streak;
			if (step.lower) {
				conferenceSession.lowerHand().catch(log);
			}
		}, SAMPLE_INTERVAL_MS);
		return () => {
			clearInterval(interval);
			streak.current = null;
		};
	}, [active, speaking]);
};
