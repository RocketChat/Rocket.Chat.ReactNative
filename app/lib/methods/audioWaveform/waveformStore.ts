import { decodeAudioData } from 'react-native-audio-api';

import log from '../helpers/log';
import { computeWaveformPeaks } from './computeWaveformPeaks';

const DECODE_SAMPLE_RATE = 8000;

const waveforms = new Map<string, number[]>();
const listeners = new Map<string, Set<() => void>>();
const queue: string[] = [];
let decoding: string | null = null;

const isWanted = (fileUri: string) => !!listeners.get(fileUri)?.size && !waveforms.has(fileUri);

const decodeWaveform = async (fileUri: string): Promise<number[]> => {
	try {
		const buffer = await decodeAudioData(fileUri, DECODE_SAMPLE_RATE);
		return computeWaveformPeaks(buffer.getChannelData(0));
	} catch (error) {
		log(error);
		return [];
	}
};

const decodeNext = async () => {
	if (decoding) {
		return;
	}
	const next = queue.find(isWanted);
	queue.splice(0, next ? queue.indexOf(next) + 1 : queue.length);
	if (!next) {
		return;
	}
	decoding = next;
	const waveform = await decodeWaveform(next);
	waveforms.set(next, waveform);
	decoding = null;
	listeners.get(next)?.forEach(listener => listener());
	decodeNext();
};

export const getWaveform = (fileUri: string): number[] | undefined => waveforms.get(fileUri);

export const subscribeWaveform = (fileUri: string, listener: () => void) => {
	const fileListeners = listeners.get(fileUri) ?? new Set<() => void>();
	listeners.set(fileUri, fileListeners);
	fileListeners.add(listener);
	if (!waveforms.has(fileUri) && decoding !== fileUri && !queue.includes(fileUri)) {
		queue.push(fileUri);
		decodeNext();
	}
	return () => {
		fileListeners.delete(listener);
		if (!fileListeners.size) {
			listeners.delete(fileUri);
		}
	};
};
