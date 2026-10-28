import { act, renderHook, waitFor } from '@testing-library/react-native';

import { SubscriptionType } from '~/definitions';
import { getPinnedMessages } from '~/lib/services/restApi';
import useMessages from '../useMessages';

jest.mock('~/lib/services/restApi', () => ({
	getPinnedMessages: jest.fn()
}));

jest.mock('~/lib/methods/helpers/log', () => jest.fn());

const mockedGetPinnedMessages = jest.mocked(getPinnedMessages);

const createMessages = (from: number, count: number) =>
	Array.from({ length: count }, (_, index) => ({ _id: `message-${from + index}`, msg: 'pinned' }));

const respondWithPage = (from: number, count: number, total: number) =>
	mockedGetPinnedMessages.mockResolvedValueOnce({ success: true, messages: createMessages(from, count), total } as never);

const renderPinnedMessages = () =>
	renderHook(() => useMessages({ rid: 'room-id', t: SubscriptionType.CHANNEL, userId: 'user-id', screenName: 'Pinned' }));

const requestedOffsets = () => mockedGetPinnedMessages.mock.calls.map(([params]) => params.offset);

describe('useMessages', () => {
	beforeEach(() => {
		mockedGetPinnedMessages.mockReset();
	});

	it('loads the next page from the current message count', async () => {
		respondWithPage(0, 2, 3);
		respondWithPage(2, 1, 3);
		const { result } = renderPinnedMessages();
		await waitFor(() => expect(result.current.loading).toBe(false));

		act(() => result.current.loadMore());
		await waitFor(() => expect(result.current.messages).toHaveLength(3));

		expect(requestedOffsets()).toEqual([0, 2]);
	});

	it('stops requesting once every message is loaded', async () => {
		respondWithPage(0, 2, 2);
		const { result } = renderPinnedMessages();
		await waitFor(() => expect(result.current.loading).toBe(false));

		act(() => result.current.loadMore());

		expect(requestedOffsets()).toEqual([0]);
	});

	it('retries the same page after a failed request', async () => {
		respondWithPage(0, 2, 3);
		mockedGetPinnedMessages.mockRejectedValueOnce(new Error('network'));
		respondWithPage(2, 1, 3);
		const { result } = renderPinnedMessages();
		await waitFor(() => expect(result.current.loading).toBe(false));

		act(() => result.current.loadMore());
		await waitFor(() => expect(result.current.loading).toBe(false));
		act(() => result.current.loadMore());
		await waitFor(() => expect(result.current.messages).toHaveLength(3));

		expect(requestedOffsets()).toEqual([0, 2, 2]);
	});

	it('removes a message and keeps paginating from the remaining count', async () => {
		respondWithPage(0, 2, 3);
		respondWithPage(1, 1, 2);
		const { result } = renderPinnedMessages();
		await waitFor(() => expect(result.current.loading).toBe(false));

		act(() => result.current.removeMessage('message-0'));
		act(() => result.current.loadMore());
		await waitFor(() => expect(result.current.messages).toHaveLength(2));

		expect(requestedOffsets()).toEqual([0, 1]);
	});
});
