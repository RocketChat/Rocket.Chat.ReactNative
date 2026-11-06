import { act, renderHook, waitFor } from '@testing-library/react-native';
import { type ReactNode } from 'react';
import { Provider } from 'react-redux';

import { connectSuccess, disconnect } from '~/actions/connect';
import { setUser } from '~/actions/login';
import { preflightCallId } from '~/lib/services/conference/useConferenceCallStore';
import { videoConferenceInfo } from '~/lib/services/restApi';
import sdk from '~/lib/services/sdk';
import { mockedStore } from '~/reducers/mockedStore';
import { useConferenceInfo } from '../useConferenceInfo';

jest.mock('~/lib/methods/helpers/log', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('~/lib/services/restApi', () => ({ videoConferenceInfo: jest.fn() }));
jest.mock('~/lib/services/sdk', () => ({
	__esModule: true,
	default: { subscribe: jest.fn(), onStreamData: jest.fn(), unsubscribe: jest.fn() }
}));

const infoMock = videoConferenceInfo as jest.Mock;
const sdkMock = sdk as unknown as { subscribe: jest.Mock; onStreamData: jest.Mock; unsubscribe: jest.Mock };

const wrapper = ({ children }: { children: ReactNode }) => <Provider store={mockedStore}>{children}</Provider>;

const titleOf = (info?: unknown) => (info as { title?: string } | undefined)?.title;

const callInfo = (extra: object = {}) => ({ success: true, _id: 'call1', title: 'Standup', users: [], ...extra });

describe('useConferenceInfo', () => {
	let streamListeners: ((message: unknown) => void)[] = [];
	const emitStreamEvent = (eventName: string) => streamListeners.forEach(listener => listener({ fields: { eventName } }));
	const stopListening = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
		mockedStore.dispatch(setUser({ id: 'uid1', token: 'tok1' }));
		mockedStore.dispatch(connectSuccess());
		infoMock.mockResolvedValue(callInfo());
		sdkMock.subscribe.mockResolvedValue({ id: 'subscription' });
		streamListeners = [];
		sdkMock.onStreamData.mockImplementation(async (_stream: string, callback: (message: unknown) => void) => {
			streamListeners.push(callback);
			return { stop: stopListening };
		});
	});

	it('is loading until the call has been fetched, then has it', async () => {
		const { result } = renderHook(() => useConferenceInfo('call1'), { wrapper });
		expect(result.current.loading).toBe(true);

		await waitFor(() => expect(titleOf(result.current.info)).toBe('Standup'));

		expect(result.current.loading).toBe(false);
		expect(result.current.failed).toBe(false);
		expect(infoMock).toHaveBeenCalledWith('call1');
	});

	it('has nothing to fetch for a call that has not been started yet', () => {
		const { result } = renderHook(() => useConferenceInfo(preflightCallId('GENERAL')), { wrapper });

		expect(infoMock).not.toHaveBeenCalled();
		expect(result.current.info).toBeUndefined();
		expect(result.current.loading).toBe(false);
	});

	it('reports a failure when the Workspace says no', async () => {
		infoMock.mockResolvedValue({ success: false });
		const { result } = renderHook(() => useConferenceInfo('call1'), { wrapper });

		await waitFor(() => expect(result.current.failed).toBe(true));

		expect(result.current.info).toBeUndefined();
	});

	it('reports a failure when the request itself fails, as a dropped connection does', async () => {
		infoMock.mockRejectedValue(new Error('Network request failed'));
		const { result } = renderHook(() => useConferenceInfo('call1'), { wrapper });

		await waitFor(() => expect(result.current.failed).toBe(true));
	});

	it('keeps what it had when a refresh fails', async () => {
		const { result } = renderHook(() => useConferenceInfo('call1'), { wrapper });
		await waitFor(() => expect(titleOf(result.current.info)).toBe('Standup'));
		infoMock.mockRejectedValue(new Error('Network request failed'));

		act(() => result.current.reload());

		await waitFor(() => expect(result.current.failed).toBe(true));
		expect(titleOf(result.current.info)).toBe('Standup');
	});

	it('does not show one call as another', async () => {
		const { result, rerender } = renderHook(({ callId }: { callId: string }) => useConferenceInfo(callId), {
			wrapper,
			initialProps: { callId: 'call1' }
		});
		await waitFor(() => expect(titleOf(result.current.info)).toBe('Standup'));
		infoMock.mockResolvedValue(callInfo({ _id: 'call2', title: 'Retro' }));

		rerender({ callId: 'call2' });

		expect(result.current.info).toBeUndefined();
		await waitFor(() => expect(titleOf(result.current.info)).toBe('Retro'));
	});

	describe('watching a call live', () => {
		it('subscribes to the call and fetches it again whenever it is updated', async () => {
			const { result } = renderHook(() => useConferenceInfo('call1', { live: true }), { wrapper });
			await waitFor(() => expect(sdkMock.onStreamData).toHaveBeenCalled());
			expect(sdkMock.subscribe).toHaveBeenCalledWith('stream-video-conference', 'call1/updated');
			await waitFor(() => expect(result.current.info).toBeDefined());
			infoMock.mockClear();

			act(() => emitStreamEvent('call1/updated'));

			await waitFor(() => expect(infoMock).toHaveBeenCalledTimes(1));
		});

		it('asks the server once when several screens refresh for the same update', async () => {
			const screen = renderHook(() => useConferenceInfo('call1', { live: true }), { wrapper });
			const sheet = renderHook(() => useConferenceInfo('call1', { live: true }), { wrapper });
			await waitFor(() => expect(streamListeners).toHaveLength(2));
			await waitFor(() => expect(screen.result.current.info).toBeDefined());
			await waitFor(() => expect(sheet.result.current.info).toBeDefined());
			await act(async () => {
				await new Promise(resolve => setTimeout(resolve, 150));
			});
			infoMock.mockClear();
			infoMock.mockResolvedValue(callInfo({ title: 'Retro' }));

			act(() => emitStreamEvent('call1/updated'));
			await act(async () => {
				await new Promise(resolve => setTimeout(resolve, 150));
			});

			expect(infoMock).toHaveBeenCalledTimes(1);
			await waitFor(() => expect(titleOf(screen.result.current.info)).toBe('Retro'));
			expect(titleOf(sheet.result.current.info)).toBe('Retro');
		});

		it('fetches again for an update that arrives after the request has gone out, so nothing stale is kept', async () => {
			const { result } = renderHook(() => useConferenceInfo('call1', { live: true }), { wrapper });
			await waitFor(() => expect(result.current.info).toBeDefined());
			await act(async () => {
				await new Promise(resolve => setTimeout(resolve, 150));
			});
			infoMock.mockClear();

			act(() => emitStreamEvent('call1/updated'));
			await waitFor(() => expect(infoMock).toHaveBeenCalledTimes(1));
			act(() => emitStreamEvent('call1/updated'));

			await waitFor(() => expect(infoMock).toHaveBeenCalledTimes(2));
		});

		it('ignores updates to other calls', async () => {
			const { result } = renderHook(() => useConferenceInfo('call1', { live: true }), { wrapper });
			await waitFor(() => expect(sdkMock.onStreamData).toHaveBeenCalled());
			await waitFor(() => expect(result.current.info).toBeDefined());
			infoMock.mockClear();

			act(() => emitStreamEvent('call2/updated'));

			expect(infoMock).not.toHaveBeenCalled();
		});

		it('stops listening when the screen goes away', async () => {
			const { result, unmount } = renderHook(() => useConferenceInfo('call1', { live: true }), { wrapper });
			await waitFor(() => expect(sdkMock.onStreamData).toHaveBeenCalled());
			await waitFor(() => expect(result.current.info).toBeDefined());

			unmount();

			expect(stopListening).toHaveBeenCalled();
			await waitFor(() => expect(sdkMock.unsubscribe).toHaveBeenCalledWith({ id: 'subscription' }));
		});

		it('shares one subscription between screens and keeps it until the last one goes away', async () => {
			const screen = renderHook(() => useConferenceInfo('call1', { live: true }), { wrapper });
			const sheet = renderHook(() => useConferenceInfo('call1', { live: true }), { wrapper });
			await waitFor(() => expect(sdkMock.onStreamData).toHaveBeenCalledTimes(2));

			sheet.unmount();
			await waitFor(() => expect(stopListening).toHaveBeenCalledTimes(1));

			expect(sdkMock.subscribe).toHaveBeenCalledTimes(1);
			expect(sdkMock.unsubscribe).not.toHaveBeenCalled();

			screen.unmount();

			await waitFor(() => expect(sdkMock.unsubscribe).toHaveBeenCalledTimes(1));
		});

		it('still lets go of the subscription when the screen goes away before it was confirmed', async () => {
			let confirm: (subscription: { id: string }) => void = () => {};
			sdkMock.subscribe.mockReturnValueOnce(
				new Promise(resolve => {
					confirm = resolve;
				})
			);
			const { unmount } = renderHook(() => useConferenceInfo('call1', { live: true }), { wrapper });
			await waitFor(() => expect(sdkMock.subscribe).toHaveBeenCalledTimes(1));

			unmount();
			confirm({ id: 'late-subscription' });

			await waitFor(() => expect(sdkMock.unsubscribe).toHaveBeenCalledWith({ id: 'late-subscription' }));
		});

		it('keeps the subscription when it is let go and wanted again in the same moment', async () => {
			const first = renderHook(() => useConferenceInfo('call1', { live: true }), { wrapper });
			await waitFor(() => expect(sdkMock.onStreamData).toHaveBeenCalledTimes(1));

			first.unmount();
			const second = renderHook(() => useConferenceInfo('call1', { live: true }), { wrapper });
			await waitFor(() => expect(sdkMock.onStreamData).toHaveBeenCalledTimes(2));

			expect(sdkMock.unsubscribe).not.toHaveBeenCalled();
			second.unmount();
		});

		it('does not subscribe unless asked to watch', async () => {
			const { result } = renderHook(() => useConferenceInfo('call1'), { wrapper });
			await waitFor(() => expect(result.current.info).toBeDefined());

			expect(sdkMock.subscribe).not.toHaveBeenCalled();
		});

		it('does not subscribe for a call that has not been started yet', () => {
			renderHook(() => useConferenceInfo(preflightCallId('GENERAL'), { live: true }), { wrapper });

			expect(sdkMock.subscribe).not.toHaveBeenCalled();
		});

		it('waits for a connection, because a subscription refused too early is never retried', async () => {
			act(() => {
				mockedStore.dispatch(disconnect());
			});
			const { result } = renderHook(() => useConferenceInfo('call1', { live: true }), { wrapper });
			await waitFor(() => expect(result.current.info).toBeDefined());

			expect(sdkMock.subscribe).not.toHaveBeenCalled();

			act(() => {
				mockedStore.dispatch(connectSuccess());
			});

			await waitFor(() => expect(sdkMock.subscribe).toHaveBeenCalledTimes(1));
			await waitFor(() => expect(result.current.loading).toBe(false));
		});
	});
});
