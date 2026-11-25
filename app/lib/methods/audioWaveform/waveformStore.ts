import { decodeAudioData } from 'react-native-audio-api';
import { getInfoAsync } from 'expo-file-system/legacy';

import log from '../helpers/log';
import { computeWaveformPeaks } from './computeWaveformPeaks';
import { readSavedWaveform, saveWaveform } from './savedWaveforms';

const DECODE_SAMPLE_RATE = 8000;
const MAX_DECODED_FILE_BYTES = 2 * 1024 * 1024;

const waveforms = new Map<string, number[]>();
const listeners = new Map<string, Set<() => void>>();
const queue: string[] = [];
let decoding: string | null = null;

const isWanted = (fileUri: string) => !!listeners.get(fileUri)?.size && !waveforms.has(fileUri);

const isSmallEnoughToDecode = async (fileUri: string) => {
	const info = await getInfoAsync(fileUri);
	return info.exists && info.size <= MAX_DECODED_FILE_BYTES;
};

const decodeWaveform = async (fileUri: string): Promise<number[]> => {
	try {
		if (!(await isSmallEnoughToDecode(fileUri))) {
			return [];
		}
		const buffer = await decodeAudioData(fileUri, DECODE_SAMPLE_RATE);
		return computeWaveformPeaks(buffer.getChannelData(0));
	} catch (error) {
		log(error);
		return [];
	}
};

const loadSavedWaveform = async (fileUri: string) => {
	try {
		return await readSavedWaveform(fileUri);
	} catch (error) {
		log(error);
		return undefined;
	}
};

const saveDecodedWaveform = async (fileUri: string, peaks: number[]) => {
	if (!peaks.length) {
		return;
	}
	try {
		await saveWaveform(fileUri, peaks);
	} catch (error) {
		log(error);
	}
};

const loadWaveform = async (fileUri: string): Promise<number[]> => {
	const saved = await loadSavedWaveform(fileUri);
	if (saved) {
		return saved;
	}
	const decoded = await decodeWaveform(fileUri);
	await saveDecodedWaveform(fileUri, decoded);
	return decoded;
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
	const waveform = await loadWaveform(next);
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
