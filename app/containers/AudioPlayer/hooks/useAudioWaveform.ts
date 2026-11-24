import { useCallback, useSyncExternalStore } from 'react';

import { getWaveform, subscribeWaveform } from '~/lib/methods/audioWaveform/waveformStore';

const ignoreChanges = () => () => {};
const noWaveform = () => undefined;

const isLocalFile = (fileUri: string) => fileUri.startsWith('file://');

export const useAudioWaveform = (fileUri: string, isDownloaded: boolean): number[] | undefined => {
	const enabled = isDownloaded && isLocalFile(fileUri);
	const subscribe = useCallback((onChange: () => void) => subscribeWaveform(fileUri, onChange), [fileUri]);
	const getSnapshot = useCallback(() => getWaveform(fileUri), [fileUri]);
	return useSyncExternalStore(enabled ? subscribe : ignoreChanges, enabled ? getSnapshot : noWaveform) ?? undefined;
};
