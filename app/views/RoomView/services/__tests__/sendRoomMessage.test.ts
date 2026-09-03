import { Review } from '../../../../lib/methods/helpers/review';
import { sendMessage } from '../../../../lib/methods/sendMessage';
import { sendRoomMessage } from '../sendRoomMessage';

jest.mock('../../../../lib/methods/sendMessage', () => ({
	sendMessage: jest.fn(() => Promise.resolve())
}));
jest.mock('../../../../lib/methods/helpers/review', () => ({
	Review: { pushPositiveEvent: jest.fn() }
}));
jest.mock('../../../../lib/methods/helpers/log', () => ({
	__esModule: true,
	default: jest.fn(),
	logEvent: jest.fn(),
	events: { ROOM_SEND_MESSAGE: 'ROOM_SEND_MESSAGE' }
}));

const mockSendMessage = sendMessage as jest.Mock;

const user = { id: 'u1', username: 'user', token: 'tok' };

const send = (message?: string) => {
	const onMessageSent = jest.fn();
	const resetAction = jest.fn();
	sendRoomMessage({ rid: 'rid-1', message, tmid: 'thread-1', user, tshow: true, onMessageSent, resetAction });
	return { onMessageSent, resetAction };
};

describe('sendRoomMessage', () => {
	beforeEach(() => jest.clearAllMocks());

	it('sends the message, clears the unread divider and reports a positive review event', async () => {
		const { onMessageSent, resetAction } = send('hello');

		await Promise.resolve();

		expect(mockSendMessage).toHaveBeenCalledWith('rid-1', 'hello', 'thread-1', user, true);
		expect(onMessageSent).toHaveBeenCalledTimes(1);
		expect(Review.pushPositiveEvent).toHaveBeenCalledTimes(1);
		expect(resetAction).toHaveBeenCalledTimes(1);
	});

	it('no-ops when the message is undefined', () => {
		const { onMessageSent, resetAction } = send(undefined);

		expect(mockSendMessage).not.toHaveBeenCalled();
		expect(onMessageSent).not.toHaveBeenCalled();
		expect(resetAction).not.toHaveBeenCalled();
	});
});
