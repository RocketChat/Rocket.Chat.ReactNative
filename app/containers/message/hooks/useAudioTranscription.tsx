import { useEffect, useRef, useState } from 'react';
import { type SpeechToTextLanguage, useSpeechToText, WHISPER_TINY } from 'react-native-executorch';
import { decodeAudioData } from 'react-native-audio-api';

import i18n from '../../../i18n';
import log from '../../../lib/methods/helpers/log';

export type TTranscriptionStatus = 'loading-model' | 'transcribing' | 'done' | 'error';

const TARGET_SAMPLE_RATE = 16000;

const getTranscriptionLanguage = (): SpeechToTextLanguage => {
	const base = (i18n.locale || 'en').toLowerCase().split('-')[0];
	return base as SpeechToTextLanguage;
};

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
				const result = await model.transcribe(waveform, { language: getTranscriptionLanguage() });
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
