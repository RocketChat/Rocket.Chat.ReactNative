import { renderHook } from '@testing-library/react-native';

import AudioManager from '~/lib/methods/AudioManager';
import { useRoomAudioLifecycle } from '../useRoomAudioLifecycle';

jest.mock('~/lib/methods/AudioManager', () => ({ pauseAudio: jest.fn(), unloadRoomAudios: jest.fn() }));

const mockUnloadRoomAudios = AudioManager.unloadRoomAudios as jest.Mock;
const mockPauseAudio = AudioManager.pauseAudio as jest.Mock;

const renderRoomAudioLifecycle = (rid: string | undefined, tmid: string | undefined) =>
	renderHook(
		({ rid: nextRid, tmid: nextTmid }: { rid: string | undefined; tmid: string | undefined }) =>
			useRoomAudioLifecycle(nextRid, nextTmid),
		{ initialProps: { rid, tmid } }
	);

describe('useRoomAudioLifecycle', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('unloads room audio on unmount when there is no tmid, without pausing it', () => {
		const { unmount } = renderRoomAudioLifecycle('rid-1', undefined);

		unmount();

		expect(mockUnloadRoomAudios).toHaveBeenCalledWith('rid-1');
		expect(mockPauseAudio).not.toHaveBeenCalled();
	});

	it('does not unload room audio on unmount when there is a tmid', () => {
		const { unmount } = renderRoomAudioLifecycle('rid-1', 'tmid-1');

		unmount();

		expect(mockUnloadRoomAudios).not.toHaveBeenCalled();
	});
});
