import { renderHook, waitFor } from '@testing-library/react-native';

import { useQuotedMessageChannels } from '../useQuotedMessageChannels';
import { getMessageById } from '../../../../lib/database/services/Message';

jest.mock('../../../../lib/database/services/Message', () => ({
	getMessageById: jest.fn()
}));

const mockGetMessageById = getMessageById as jest.Mock;

const permalink = (messageId: string) => `https://open.rocket.chat/channel/general?msg=${messageId}`;
const discussion = [{ _id: 'c1', name: 'aBcD123xyz', fname: 'My Discussion' }];

describe('useQuotedMessageChannels', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockGetMessageById.mockResolvedValue(null);
	});

	it('returns the channels of the message the permalink points at', async () => {
		mockGetMessageById.mockResolvedValue({ channels: discussion });

		const { result } = renderHook(() => useQuotedMessageChannels(permalink('quoted-1')));

		await waitFor(() => expect(result.current).toEqual(discussion));
		expect(mockGetMessageById).toHaveBeenCalledWith('quoted-1');
	});

	it('returns undefined when there is no permalink', async () => {
		const { result } = renderHook(() => useQuotedMessageChannels(undefined));

		await waitFor(() => expect(mockGetMessageById).not.toHaveBeenCalled());
		expect(result.current).toBeUndefined();
	});

	// Otherwise the previous quote's names would label this one's mentions
	it('drops the previous channels when the permalink changes to a message without any', async () => {
		mockGetMessageById.mockResolvedValue({ channels: discussion });
		const { result, rerender } = renderHook(({ link }: { link: string }) => useQuotedMessageChannels(link), {
			initialProps: { link: permalink('quoted-1') }
		});
		await waitFor(() => expect(result.current).toEqual(discussion));

		mockGetMessageById.mockResolvedValue({ channels: [] });
		rerender({ link: permalink('quoted-2') });

		await waitFor(() => expect(result.current).toBeUndefined());
	});
});
