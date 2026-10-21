import { useEffect, useState } from 'react';

import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { isAndroid } from '~/lib/methods/helpers';
import log from '~/lib/methods/helpers/log';
import { initialSpeechState, MUTED_SPEECH_TIMING, releaseSpeech, stepSpeech } from '~/lib/methods/helpers/stepSpeech';
import {
	onConferenceMicLevel,
	startConferenceMicLevelMonitor,
	stopConferenceMicLevelMonitor
} from '~/lib/services/conference/conferenceMicLevel';

export const useSpeakingWhileMuted = (enabled: boolean): boolean => {
	const foreground = useAppSelector(state => state.app.foreground);
	const [speaking, setSpeaking] = useState(false);
	const monitoring = isAndroid && enabled && foreground;

	useEffect(() => {
		if (!monitoring) {
			return;
		}
		let state = initialSpeechState;
		const levels = onConferenceMicLevel(level => {
			const now = Date.now();
			state = releaseSpeech(stepSpeech(state, level, now, MUTED_SPEECH_TIMING), now, MUTED_SPEECH_TIMING);
			setSpeaking(state.speaking);
		});
		startConferenceMicLevelMonitor().catch(log);
		return () => {
			levels.remove();
			stopConferenceMicLevelMonitor().catch(log);
			setSpeaking(false);
		};
	}, [monitoring]);

	return monitoring && speaking;
};
