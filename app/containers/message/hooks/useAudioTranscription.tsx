import { useEffect, useRef, useState } from 'react';
import { useSpeechToText, WHISPER_TINY } from 'react-native-executorch';
import { decodeAudioData } from 'react-native-audio-api';

import log from '../../../lib/methods/helpers/log';

export type TTranscriptionStatus = 'loading-model' | 'transcribing' | 'done' | 'error';

const TARGET_SAMPLE_RATE = 16000;

export const useAudioTranscription = (uri: string) => {
	const model = useSpeechToText({ model: WHISPER_TINY });

	const [status, setStatus] = useState<TTranscriptionStatus>('loading-model');
	const [text, setText] = useState<string>('');
	const startedRef = useRef(false);

	useEffect(() => {
		if (!uri || startedRef.current) return;
		if (!model.isReady) return;
		startedRef.current = true;
		(async () => {
			try {
				setStatus('transcribing');
				const decoded = await decodeAudioData(uri, TARGET_SAMPLE_RATE);
				const waveform = decoded.getChannelData(0);
				const result = await model.transcribe(waveform);
				setText(result?.text ?? '');
				setStatus('done');
			} catch (e) {
				log(e);
				setStatus('error');
			}
		})();
	}, [uri, model.isReady, model]);

	return { status, text, downloadProgress: model.downloadProgress };
};
