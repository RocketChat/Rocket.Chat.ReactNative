import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useCallStore } from '~/lib/services/voip/useCallStore';
import { fetchMediaCallAppActions, triggerMediaCallAppAction } from '~/lib/services/voip/mediaCallAppActions';
import { useMediaCallAppActions, useMediaCallAppActionsStore } from './useMediaCallAppActions';

jest.mock('~/lib/services/voip/mediaCallAppActions', () => ({
	fetchMediaCallAppActions: jest.fn(),
	triggerMediaCallAppAction: jest.fn()
}));

jest.mock('react-native-incall-manager', () => ({
	start: jest.fn(),
	stop: jest.fn(),
	setForceSpeakerphoneOn: jest.fn(() => Promise.resolve())
}));

const mockFetch = fetchMediaCallAppActions as jest.Mock;
const mockTrigger = triggerMediaCallAppAction as jest.Mock;

describe('useMediaCallAppActions', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		useMediaCallAppActionsStore.setState({ callId: null, actions: [], overrides: {} });
		mockFetch.mockResolvedValue([
			{ appId: 'app', actionId: 'record', label: 'Record' },
			{ appId: 'app', actionId: 'answer-note', label: 'Note', callStates: ['ringing'] }
		]);
		useCallStore.setState({ callId: 'call-1', callState: 'active', direction: 'outgoing', roomId: 'rid' });
	});

	it('filters actions by widget state', async () => {
		const { result } = renderHook(() => useMediaCallAppActions());
		await waitFor(() => expect(result.current).toHaveLength(1));
		expect(result.current[0].label).toBe('Record');
	});

	it('applies the update returned by the app', async () => {
		mockTrigger.mockResolvedValue({ label: 'Stop recording', variant: 'danger' });
		const { result } = renderHook(() => useMediaCallAppActions());
		await waitFor(() => expect(result.current).toHaveLength(1));

		await act(() => result.current[0].onPress());

		expect(mockTrigger).toHaveBeenCalledWith({ appId: 'app', actionId: 'record', callId: 'call-1', rid: 'rid' });
		expect(result.current[0]).toMatchObject({ label: 'Stop recording', variant: 'danger', disabled: false });
	});
});
