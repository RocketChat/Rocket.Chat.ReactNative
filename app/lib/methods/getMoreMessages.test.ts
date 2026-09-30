import getMoreMessages from './getMoreMessages';
import { loadMessagesForRoom } from './loadMessagesForRoom';
import { loadNextMessages } from './loadNextMessages';
import { MessageTypeLoad } from '../constants/messageTypeLoad';

jest.mock('./loadMessagesForRoom', () => ({
	loadMessagesForRoom: jest.fn()
}));

jest.mock('./loadNextMessages', () => ({
	loadNextMessages: jest.fn()
}));

const mockedLoadMessagesForRoom = loadMessagesForRoom as jest.MockedFunction<typeof loadMessagesForRoom>;
const mockedLoadNextMessages = loadNextMessages as jest.MockedFunction<typeof loadNextMessages>;

const RID = 'ROOM_ID';
const TS = new Date(Date.UTC(2024, 0, 1, 12, 0, 0));

const buildLoaderItem = (t: string) => ({ _id: 'loader-1', rid: RID, ts: TS, t }) as any;

describe('getMoreMessages', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockedLoadMessagesForRoom.mockResolvedValue(undefined as never);
		mockedLoadNextMessages.mockResolvedValue(undefined as never);
	});

	it('delegates to loadMessagesForRoom when loaderItem.t is load_more', async () => {
		const loaderItem = buildLoaderItem(MessageTypeLoad.MORE);

		await getMoreMessages({ rid: RID, t: 'c' as any, loaderItem });

		expect(mockedLoadMessagesForRoom).toHaveBeenCalledTimes(1);
		expect(mockedLoadMessagesForRoom).toHaveBeenCalledWith({ rid: RID, t: 'c', latest: TS, loaderItem });
		expect(mockedLoadNextMessages).not.toHaveBeenCalled();
	});

	it('delegates to loadMessagesForRoom when loaderItem.t is load_previous_chunk', async () => {
		const loaderItem = buildLoaderItem(MessageTypeLoad.PREVIOUS_CHUNK);

		await getMoreMessages({ rid: RID, t: 'c' as any, loaderItem });

		expect(mockedLoadMessagesForRoom).toHaveBeenCalledTimes(1);
		expect(mockedLoadMessagesForRoom).toHaveBeenCalledWith({ rid: RID, t: 'c', latest: TS, loaderItem });
		expect(mockedLoadNextMessages).not.toHaveBeenCalled();
	});

	it('delegates to loadNextMessages when loaderItem.t is load_next_chunk', async () => {
		const loaderItem = buildLoaderItem(MessageTypeLoad.NEXT_CHUNK);

		await getMoreMessages({ rid: RID, t: 'c' as any, loaderItem });

		expect(mockedLoadNextMessages).toHaveBeenCalledTimes(1);
		expect(mockedLoadNextMessages).toHaveBeenCalledWith({ rid: RID, ts: TS, loaderItem });
		expect(mockedLoadMessagesForRoom).not.toHaveBeenCalled();
	});

	it('resolves without delegating for an unrecognized loaderItem.t', async () => {
		const loaderItem = buildLoaderItem('unknown-loader');

		await expect(getMoreMessages({ rid: RID, t: 'c' as any, loaderItem })).resolves.toBeUndefined();

		expect(mockedLoadMessagesForRoom).not.toHaveBeenCalled();
		expect(mockedLoadNextMessages).not.toHaveBeenCalled();
	});
});
