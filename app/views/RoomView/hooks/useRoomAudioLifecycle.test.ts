import { renderHook } from '@testing-library/react-native';

import AudioManager from '../../../lib/methods/AudioManager';
import { useRoomAudioLifecycle } from './useRoomAudioLifecycle';

jest.mock('../../../lib/methods/AudioManager', () => ({ pauseAudio: jest.fn(), unloadRoomAudios: jest.fn() }));

const mockUnloadRoomAudios = AudioManager.unloadRoomAudios as jest.Mock;
const mockPauseAudio = AudioManager.pauseAudio as jest.Mock;

const renderRoomAudioLifecycle = (rid: string | undefined, tmid: string | undefined) => {
	const unsubscribeBlur = jest.fn();
	const navigation = { addListener: jest.fn((_event: string, _handler: () => void) => unsubscribeBlur) };
	const { unmount, rerender } = renderHook(
		({ rid: nextRid, tmid: nextTmid }: { rid: string | undefined; tmid: string | undefined }) =>
			useRoomAudioLifecycle(nextRid, nextTmid, navigation as any),
		{ initialProps: { rid, tmid } }
	);

	return { unmount, rerender, navigation, unsubscribeBlur };
};

describe('useRoomAudioLifecycle', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('pauses audio on blur', () => {
		const { navigation } = renderRoomAudioLifecycle('rid-1', undefined);

		expect(navigation.addListener).toHaveBeenCalledWith('blur', expect.any(Function));
		const [, blurHandler] = navigation.addListener.mock.calls[0];
		blurHandler();

		expect(mockPauseAudio).toHaveBeenCalledTimes(1);
	});

	it('unsubscribes the blur listener and unloads room audio on unmount when there is no tmid', () => {
		const { unmount, unsubscribeBlur } = renderRoomAudioLifecycle('rid-1', undefined);

		unmount();

		expect(unsubscribeBlur).toHaveBeenCalledTimes(1);
		expect(mockUnloadRoomAudios).toHaveBeenCalledWith('rid-1');
	});

	it('does not unload room audio on unmount when there is a tmid', () => {
		const { unmount } = renderRoomAudioLifecycle('rid-1', 'tmid-1');

		unmount();

		expect(mockUnloadRoomAudios).not.toHaveBeenCalled();
	});
});
