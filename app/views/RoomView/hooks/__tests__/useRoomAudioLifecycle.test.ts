import { renderHook } from '@testing-library/react-native';

import AudioManager from '~/lib/methods/AudioManager';
import { useRoomAudioLifecycle } from '../useRoomAudioLifecycle';
import { useFocusedRoomStore } from '~/lib/methods/useFocusedRoomStore';

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

	it('marks its room as the focused room while the screen is focused', () => {
		const { unmount } = renderRoomAudioLifecycle('rid-1', undefined);

		expect(useFocusedRoomStore.getState().screen).toEqual({ rid: 'rid-1', tmid: undefined });

		unmount();

		expect(useFocusedRoomStore.getState().screen).toBeNull();
	});

	it('marks a thread as its own screen, apart from its room', () => {
		const { unmount } = renderRoomAudioLifecycle('rid-1', 'tmid-1');

		expect(useFocusedRoomStore.getState().screen).toEqual({ rid: 'rid-1', tmid: 'tmid-1' });
		useFocusedRoomStore.setState({ screen: { rid: 'rid-1' } });

		unmount();

		expect(useFocusedRoomStore.getState().screen).toEqual({ rid: 'rid-1' });
	});

	it('keeps another room focused when it closes after that room took focus', () => {
		const { unmount } = renderRoomAudioLifecycle('rid-1', undefined);
		useFocusedRoomStore.setState({ screen: { rid: 'rid-2' } });

		unmount();

		expect(useFocusedRoomStore.getState().screen).toEqual({ rid: 'rid-2' });
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
