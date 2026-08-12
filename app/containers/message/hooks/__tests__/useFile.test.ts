import { act, renderHook } from '@testing-library/react-native';

import { useFile } from '../useFile';
import { type IAttachment } from '../../../../definitions';
import { getMessageById } from '../../../../lib/database/services/Message';
import { getThreadMessageById } from '../../../../lib/database/services/ThreadMessage';

jest.mock('../../../../lib/database/services/Message', () => ({
	getMessageById: jest.fn()
}));

jest.mock('../../../../lib/database/services/ThreadMessage', () => ({
	getThreadMessageById: jest.fn()
}));

const mockGetMessageById = getMessageById as jest.Mock;
const mockGetThreadMessageById = getThreadMessageById as jest.Mock;

const file = { title: 'original.png', title_link: '/original' } as IAttachment;

// Flushes the async checkMessage effect (two awaited DB reads) inside act so any
// setIsMessagePersisted update settles before assertions run.
const flushEffect = () =>
	act(async () => {
		await Promise.resolve();
		await Promise.resolve();
	});

describe('useFile', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockGetThreadMessageById.mockResolvedValue(undefined);
		mockGetMessageById.mockResolvedValue(undefined);
	});

	it('returns the file prop and treats forwarded merges as a no-op while the thread message persists', async () => {
		mockGetThreadMessageById.mockResolvedValue({ id: 'thread-message' });
		const { result } = renderHook(() => useFile(file, 'msg-id'));

		await flushEffect();
		expect(mockGetThreadMessageById).toHaveBeenCalledWith('msg-id');
		expect(mockGetMessageById).not.toHaveBeenCalled();
		expect(result.current[0]).toBe(file);

		act(() => result.current[1]({ title_link: '/forwarded' }));
		expect(result.current[0]).toBe(file);
	});

	it('stays persisted when no thread message exists but the message is found', async () => {
		mockGetThreadMessageById.mockResolvedValue(undefined);
		mockGetMessageById.mockResolvedValue({ id: 'message' });
		const { result } = renderHook(() => useFile(file, 'msg-id'));

		await flushEffect();
		expect(mockGetMessageById).toHaveBeenCalledWith('msg-id');
		expect(result.current[0]).toBe(file);

		act(() => result.current[1]({ title_link: '/forwarded' }));
		expect(result.current[0]).toBe(file);
	});

	it('becomes not-persisted and returns the merged localFile when neither message is found', async () => {
		const { result } = renderHook(() => useFile(file, 'msg-id'));

		await flushEffect();
		expect(mockGetMessageById).toHaveBeenCalledWith('msg-id');

		act(() => result.current[1]({ title_link: '/forwarded' }));
		expect(result.current[0].title_link).toBe('/forwarded');
		expect(result.current[0]).not.toBe(file);
		expect(result.current[0].title).toBe('original.png');
	});

	it('starts not-persisted when messageId is empty and merges forwarded files into localFile', async () => {
		const { result } = renderHook(() => useFile(file, ''));

		await flushEffect();
		expect(result.current[0]).toBe(file);

		act(() => result.current[1]({ title_link: '/forwarded' }));
		expect(result.current[0]).not.toBe(file);
		expect(result.current[0].title_link).toBe('/forwarded');
	});

	// Documents the current contract: isMessagePersisted is seeded once and the effect only ever
	// flips it to false, so it can't recover to true on a later messageId change. Not fixed: the
	// only caller keys its list by that same id, so a real id change always remounts the hook fresh.
	it('stays stuck not-persisted after rerendering with a real persisted messageId (documents current contract)', async () => {
		mockGetThreadMessageById.mockResolvedValue(undefined);
		mockGetMessageById.mockResolvedValue(undefined);
		const { result, rerender } = renderHook(({ messageId }: { messageId: string }) => useFile(file, messageId), {
			initialProps: { messageId: '' }
		});

		await flushEffect();
		expect(result.current[0]).toBe(file);

		mockGetMessageById.mockResolvedValue({ id: 'msg-id' });
		rerender({ messageId: 'msg-id' });
		await flushEffect();

		expect(mockGetMessageById).toHaveBeenCalledWith('msg-id');
		act(() => result.current[1]({ title_link: '/forwarded' }));
		expect(result.current[0]).not.toBe(file);
		expect(result.current[0].title_link).toBe('/forwarded');
	});
});
