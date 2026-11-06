import { renderHook, waitFor } from '@testing-library/react-native';
import { AppState } from 'react-native';

import { expandConferenceCall } from '~/lib/services/conference/conferenceCallNavigation';
import {
	consumeConferenceCallOpenRequest,
	onConferenceCallOpenRequested
} from '~/lib/services/conference/conferenceCallOpenRequest';
import { useConferenceCallOpenRequest } from '../useConferenceCallOpenRequest';

const mockRequests = { remove: jest.fn() };
const mockAppState = { remove: jest.fn() };

jest.mock('~/lib/methods/helpers/log', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('~/lib/services/conference/conferenceCallNavigation', () => ({ expandConferenceCall: jest.fn() }));
jest.mock('~/lib/services/conference/conferenceCallOpenRequest', () => ({
	consumeConferenceCallOpenRequest: jest.fn(),
	onConferenceCallOpenRequested: jest.fn(() => mockRequests)
}));

const consume = consumeConferenceCallOpenRequest as jest.Mock;
const subscribe = onConferenceCallOpenRequested as jest.Mock;
describe('useConferenceCallOpenRequest', () => {
	let appStateListener: (state: string) => void;

	beforeEach(() => {
		jest.clearAllMocks();
		consume.mockResolvedValue(false);
		jest.spyOn(AppState, 'addEventListener').mockImplementation(((_: string, listener: (state: string) => void) => {
			appStateListener = listener;
			return mockAppState;
		}) as never);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('opens the call at once when the notification was tapped before the app was listening', async () => {
		consume.mockResolvedValueOnce(true);

		renderHook(() => useConferenceCallOpenRequest());

		await waitFor(() => expect(expandConferenceCall).toHaveBeenCalledTimes(1));
	});

	it('leaves the call as it is when nothing was tapped', async () => {
		renderHook(() => useConferenceCallOpenRequest());

		await waitFor(() => expect(consume).toHaveBeenCalledTimes(1));
		expect(expandConferenceCall).not.toHaveBeenCalled();
	});

	it('opens the call when the notification is tapped while the app is running', async () => {
		renderHook(() => useConferenceCallOpenRequest());
		await waitFor(() => expect(consume).toHaveBeenCalledTimes(1));
		consume.mockResolvedValueOnce(true);

		subscribe.mock.calls[0][0]();

		await waitFor(() => expect(expandConferenceCall).toHaveBeenCalledTimes(1));
	});

	it('looks again each time the app comes back to the foreground, and only then', async () => {
		renderHook(() => useConferenceCallOpenRequest());
		await waitFor(() => expect(consume).toHaveBeenCalledTimes(1));

		appStateListener('background');
		expect(consume).toHaveBeenCalledTimes(1);

		consume.mockResolvedValueOnce(true);
		appStateListener('active');

		await waitFor(() => expect(expandConferenceCall).toHaveBeenCalledTimes(1));
		expect(consume).toHaveBeenCalledTimes(2);
	});

	it('stops listening when the guard goes away', () => {
		const { unmount } = renderHook(() => useConferenceCallOpenRequest());

		unmount();

		expect(mockRequests.remove).toHaveBeenCalledTimes(1);
		expect(mockAppState.remove).toHaveBeenCalledTimes(1);
	});
});
