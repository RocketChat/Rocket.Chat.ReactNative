import { renderHook } from '@testing-library/react-native';

import { subscribeWaveform } from '~/lib/methods/audioWaveform/waveformStore';
import { useAudioWaveform } from '../useAudioWaveform';

jest.mock('~/lib/methods/audioWaveform/waveformStore', () => ({
	getWaveform: jest.fn(() => null),
	subscribeWaveform: jest.fn(() => () => {})
}));

afterEach(() => jest.clearAllMocks());

test('decodes a downloaded file saved on the device', () => {
	renderHook(() => useAudioWaveform('file:///audio.m4a', true));
	expect(subscribeWaveform).toHaveBeenCalledWith('file:///audio.m4a', expect.any(Function));
});

test('never decodes a server address, even when the file reads as downloaded', () => {
	const { result } = renderHook(() => useAudioWaveform('https://open.example/file-upload/audio.m4a?rc_token=t', true));
	expect(subscribeWaveform).not.toHaveBeenCalled();
	expect(result.current).toBeUndefined();
});

test('shows the flat placeholder when the decode failed', () => {
	const { result } = renderHook(() => useAudioWaveform('file:///audio.m4a', true));
	expect(result.current).toBeUndefined();
});
