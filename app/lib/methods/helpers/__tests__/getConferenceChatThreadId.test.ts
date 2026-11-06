import { getConferenceChatThreadId } from '../getConferenceChatThreadId';

const threadChat = {
	startedMessageId: 'started-message',
	persistentChatEnabled: true,
	windowEnabled: true,
	chatMode: 'thread'
};

describe('getConferenceChatThreadId', () => {
	it('is the message that started the call when its chat lives in a thread', () => {
		expect(getConferenceChatThreadId(threadChat)).toBe('started-message');
	});

	it.each([
		['persistent chat is off', { persistentChatEnabled: false }],
		['the call window is off', { windowEnabled: false }],
		['the chat lives in the room', { chatMode: 'main_room' }],
		['the Workspace does not say where the chat lives', { chatMode: undefined }],
		['the call already has a discussion', { discussionRid: 'discussion' }],
		['the call has no message yet', { startedMessageId: undefined }]
	])('is nothing when %s', (_, change) => {
		expect(getConferenceChatThreadId({ ...threadChat, ...change })).toBeUndefined();
	});
});
