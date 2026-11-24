import { useCallback, useSyncExternalStore } from 'react';

import { getWaveform, subscribeWaveform, type TWaveform } from '~/lib/methods/audioWaveform/waveformStore';

const ignoreChanges = () => () => {};
const noWaveform = () => undefined;

export const useAudioWaveform = (fileUri: string, isDownloaded: boolean): TWaveform | undefined => {
	const enabled = isDownloaded && !!fileUri;
	const subscribe = useCallback((onChange: () => void) => subscribeWaveform(fileUri, onChange), [fileUri]);
	const getSnapshot = useCallback(() => getWaveform(fileUri), [fileUri]);
	return useSyncExternalStore(enabled ? subscribe : ignoreChanges, enabled ? getSnapshot : noWaveform);
};
