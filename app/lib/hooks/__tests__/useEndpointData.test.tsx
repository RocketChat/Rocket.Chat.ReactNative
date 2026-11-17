import { act, render, renderHook, waitFor } from '@testing-library/react-native';
import { View, Text } from 'react-native';

import sdk from '~/lib/services/sdk';
import { useEndpointData } from '../useEndpointData';

const url = 'chat.getMessage';

const message = {
	_id: '9tYkmJ67wMwmvQouD',
	t: 'uj',
	rid: 'GENERAL',
	ts: '2022-07-05T19:34:30.146Z',
	msg: 'xdani',
	u: {
		_id: 'ombax8oEZnE7N3Mtt',
		username: 'xdani',
		name: 'xdani'
	},
	groupable: false,
	_updatedAt: '2022-07-05T19:34:30.146Z'
};

jest.mock('~/lib/services/sdk', () => ({
	__esModule: true,
	default: { get: jest.fn(() => new Promise(resolve => setTimeout(() => resolve({ success: true, message }), 100))) }
}));

const deferred = () => {
	let resolve!: (value: unknown) => void;
	const promise = new Promise(r => {
		resolve = r;
	});
	return { promise, resolve };
};

function Render() {
	const { loading } = useEndpointData(url, { msgId: message._id });
	if (loading) {
		return (
			<View>
				<Text testID='loading'>loading</Text>
			</View>
		);
	}
	return (
		<View>
			<Text testID='load complete'>load complete</Text>
		</View>
	);
}

describe('useFetch', () => {
	it('should return data after fetch', async () => {
		const { result } = renderHook(() => useEndpointData(url, { msgId: message._id }));
		expect(result.current.loading).toEqual(true);
		expect(result.current.result).toEqual(undefined);
		await waitFor(() => expect(result.current.loading).toEqual(false));
		expect(result.current.loading).toEqual(false);
		expect(result.current.result).toEqual({ success: true, message });
	});

	it('should component load correctly', async () => {
		const renderComponent = render(<Render />);
		const loading = await renderComponent.findByTestId('loading');
		expect(loading.props.children).toBe('loading');
		await waitFor(
			() => {
				expect(renderComponent.getByText('load complete')).toBeTruthy();
			},
			{ timeout: 2000 }
		);
	});

	it('should return error after fetch', async () => {
		(sdk.get as jest.Mock).mockImplementationOnce(
			() => new Promise(resolve => setTimeout(() => resolve({ success: false, error: null }), 100))
		);

		const { result } = renderHook(() => useEndpointData(url, { msgId: message._id }));
		expect(result.current.loading).toEqual(true);
		expect(result.current.result).toEqual(undefined);
		expect(result.current.error).toEqual(undefined);
		await waitFor(() => expect(result.current.loading).toEqual(false));
		expect(result.current.loading).toEqual(false);
		expect(result.current.result).toEqual(undefined);
		expect(result.current.error).toEqual({ success: false, error: null });
	});

	it('ignores a response that resolves after a newer request', async () => {
		const first = deferred();
		const second = deferred();
		(sdk.get as jest.Mock).mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

		const { result } = renderHook(() => useEndpointData('video-conference.info', { callId: 'c1' }));
		act(() => result.current.reload());

		await act(async () => {
			second.resolve({ success: true, status: 3 });
			await second.promise;
		});
		await act(async () => {
			first.resolve({ success: true, status: 1 });
			await first.promise;
		});

		expect(result.current.result).toEqual({ success: true, status: 3 });
		expect(result.current.loading).toBe(false);
	});

	it('refetches only when params change by value', async () => {
		jest
			.mocked(sdk.get)
			.mockReset()
			.mockResolvedValue({ success: true, message } as any);
		const { rerender } = renderHook(({ msgId }: { msgId: string }) => useEndpointData(url, { msgId }), {
			initialProps: { msgId: message._id }
		});
		await waitFor(() => expect(sdk.get).toHaveBeenCalledTimes(1));

		rerender({ msgId: message._id });
		expect(sdk.get).toHaveBeenCalledTimes(1);

		rerender({ msgId: 'another-message' });
		await waitFor(() => expect(sdk.get).toHaveBeenCalledTimes(2));
		expect(sdk.get).toHaveBeenLastCalledWith(url, { msgId: 'another-message' });
	});

	it('refetches when the endpoint changes', async () => {
		jest
			.mocked(sdk.get)
			.mockReset()
			.mockResolvedValue({ success: true, message } as any);
		const { rerender } = renderHook(
			({ endpoint }: { endpoint: typeof url | 'chat.getThreadsList' }) =>
				useEndpointData(endpoint as typeof url, { msgId: message._id }),
			{
				initialProps: { endpoint: url }
			}
		);
		await waitFor(() => expect(sdk.get).toHaveBeenCalledTimes(1));

		rerender({ endpoint: 'chat.getThreadsList' });
		await waitFor(() => expect(sdk.get).toHaveBeenCalledTimes(2));
		expect(sdk.get).toHaveBeenLastCalledWith('chat.getThreadsList', { msgId: message._id });
	});

	it('ignores a response that arrives after a newer request', async () => {
		let resolveFirst: (value: unknown) => void = () => {};
		const latestMessage = { ...message, _id: 'another-message' };
		jest
			.mocked(sdk.get)
			.mockReset()
			.mockImplementationOnce(() => new Promise(resolve => (resolveFirst = resolve)) as any)
			.mockResolvedValueOnce({ success: true, message: latestMessage } as any);
		const { result, rerender } = renderHook(({ msgId }: { msgId: string }) => useEndpointData(url, { msgId }), {
			initialProps: { msgId: message._id }
		});

		rerender({ msgId: latestMessage._id });
		await waitFor(() => expect(result.current.loading).toEqual(false));
		await act(() => resolveFirst({ success: true, message }));

		expect(result.current.loading).toEqual(false);
		expect(result.current.result).toEqual({ success: true, message: latestMessage });
	});
});
