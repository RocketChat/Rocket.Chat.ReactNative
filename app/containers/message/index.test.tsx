import Message from './index';
import { messagesStatus } from '../../lib/constants/messagesStatus';

const MessageClass = Message as any;

const makeMessage = (status: number) =>
	({
		_id: 'msg1',
		id: 'msg1',
		rid: 'rid1',
		msg: 'hello',
		u: { _id: 'u1', username: 'user', name: 'User' },
		ts: 0,
		status
	} as any);

describe('Message.hasError', () => {
	it('is true for ERROR status messages (retry/delete available)', () => {
		const wrapper = new MessageClass({ item: makeMessage(messagesStatus.ERROR) });
		expect(wrapper.hasError).toBe(true);
	});

	it('is true for TEMP (stuck sending) status messages so they can be retried/deleted', () => {
		const wrapper = new MessageClass({ item: makeMessage(messagesStatus.TEMP) });
		expect(wrapper.hasError).toBe(true);
	});

	it('is false for a successfully SENT message', () => {
		const wrapper = new MessageClass({ item: makeMessage(messagesStatus.SENT) });
		expect(wrapper.hasError).toBe(false);
	});
});
