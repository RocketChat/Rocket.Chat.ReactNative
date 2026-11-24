import { renderHook } from '@testing-library/react-native';

import AudioManager from '~/lib/methods/AudioManager';
import { useCloseAudioOnWorkspaceExit } from '../useCloseAudioOnWorkspaceExit';

jest.mock('~/lib/methods/AudioManager', () => ({ closeAudio: jest.fn() }));

let mockServer = 'https://one.example';
jest.mock('~/lib/hooks/useAppSelector', () => ({ useAppSelector: () => mockServer }));

describe('useCloseAudioOnWorkspaceExit', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockServer = 'https://one.example';
	});

	it('closes the audio when the workspace changes', () => {
		const { rerender } = renderHook(() => useCloseAudioOnWorkspaceExit());
		expect(AudioManager.closeAudio).not.toHaveBeenCalled();

		mockServer = 'https://two.example';
		rerender({});

		expect(AudioManager.closeAudio).toHaveBeenCalledTimes(1);
	});

	it('closes the audio when the rooms list unmounts', () => {
		const { unmount } = renderHook(() => useCloseAudioOnWorkspaceExit());

		unmount();

		expect(AudioManager.closeAudio).toHaveBeenCalledTimes(1);
	});
});
