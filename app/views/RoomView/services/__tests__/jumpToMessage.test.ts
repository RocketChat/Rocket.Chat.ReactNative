import { sendLoadingEvent } from '../../../../containers/Loading';
import log from '../../../../lib/methods/helpers/log';
import { showErrorAlert } from '../../../../lib/methods/helpers/info';
import { type IJumpToMessageArgs, type TGetMessageInfoResult } from '../../definitions';
import { jumpToMessage, type IJumpToMessageDeps } from '../jumpToMessage';

jest.mock('../../../../containers/Loading', () => ({
	sendLoadingEvent: jest.fn()
}));
jest.mock('../../../../lib/methods/helpers/log', () => jest.fn());
jest.mock('../../../../lib/methods/helpers/info', () => ({
	showErrorAlert: jest.fn()
}));
jest.mock('../../../../i18n', () => ({ t: (key: string) => key }));

const mockSendLoadingEvent = sendLoadingEvent as jest.Mock;
const mockLog = log as jest.Mock;
const mockShowErrorAlert = showErrorAlert as jest.Mock;

const message = (overrides: Partial<TGetMessageInfoResult> = {}): TGetMessageInfoResult => ({
	id: 'message-1',
	rid: 'room-1',
	tmid: undefined,
	msg: 'hello',
	ts: new Date(),
	...overrides
});

const createArgs = (overrides: Partial<IJumpToMessageArgs> = {}): IJumpToMessageArgs => ({
	messageId: 'message-1',
	rid: 'room-1',
	listContainerRef: {
		current: {
			isMessageInWindow: jest.fn(() => true),
			jumpToMessage: jest.fn()
		}
	} as unknown as IJumpToMessageArgs['listContainerRef'],
	navToRoom: jest.fn(),
	navToThread: jest.fn(),
	cancel: jest.fn(),
	...overrides
});

const createDeps = (overrides: Partial<IJumpToMessageDeps> = {}): IJumpToMessageDeps => ({
	getMessageInfo: jest.fn().mockResolvedValue(message()),
	resolveJumpAnchor: jest.fn().mockResolvedValue(null),
	...overrides
});

describe('jumpToMessage', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('cancels without navigating when the message cannot be found', async () => {
		const args = createArgs();
		const deps = createDeps({ getMessageInfo: jest.fn().mockResolvedValue(null) });

		await jumpToMessage(args, deps);

		expect(args.cancel).toHaveBeenCalledTimes(1);
		expect(args.navToRoom).not.toHaveBeenCalled();
		expect(args.navToThread).not.toHaveBeenCalled();
	});

	it('navigates to the room when the message belongs to a different room', async () => {
		const args = createArgs({ rid: 'room-1', tmid: undefined });
		const targetMessage = message({ rid: 'room-2' });
		const deps = createDeps({ getMessageInfo: jest.fn().mockResolvedValue(targetMessage) });

		await jumpToMessage(args, deps);

		expect(args.navToRoom).toHaveBeenCalledWith(targetMessage);
		expect(args.navToThread).not.toHaveBeenCalled();
	});

	it('navigates to the thread when the message is in the current room but a different thread', async () => {
		const args = createArgs({ rid: 'room-1', tmid: 'thread-1' });
		const targetMessage = message({ rid: 'room-1', tmid: 'thread-2' });
		const deps = createDeps({ getMessageInfo: jest.fn().mockResolvedValue(targetMessage) });

		await jumpToMessage(args, deps);

		expect(args.navToThread).toHaveBeenCalledWith(targetMessage);
		expect(args.navToRoom).not.toHaveBeenCalled();
	});

	it('navigates to the room when currently in a thread and the target has no replies', async () => {
		const args = createArgs({ rid: 'room-1', tmid: 'thread-1', t: 'thread' });
		const targetMessage = message({ rid: 'room-1', tmid: undefined, replies: undefined });
		const deps = createDeps({ getMessageInfo: jest.fn().mockResolvedValue(targetMessage) });

		await jumpToMessage(args, deps);

		expect(args.navToRoom).toHaveBeenCalledWith(targetMessage);
		expect(args.navToThread).not.toHaveBeenCalled();
	});

	it('resolves the jump anchor and scrolls the list when the message is in the current room', async () => {
		const listContainerRef = {
			current: {
				isMessageInWindow: jest.fn(() => false),
				jumpToMessage: jest.fn()
			}
		} as unknown as IJumpToMessageArgs['listContainerRef'];
		const args = createArgs({ rid: 'room-1', tmid: undefined, listContainerRef });
		const targetMessage = message({ rid: 'room-1', tmid: undefined });
		const deps = createDeps({
			getMessageInfo: jest.fn().mockResolvedValue(targetMessage),
			resolveJumpAnchor: jest.fn().mockResolvedValue(1234)
		});

		await jumpToMessage(args, deps);

		expect(mockSendLoadingEvent).toHaveBeenCalledWith(expect.objectContaining({ visible: true }));
		expect(deps.resolveJumpAnchor).toHaveBeenCalledWith(
			'room-1',
			expect.objectContaining({ id: targetMessage.id }),
			false,
			expect.anything()
		);
		expect(listContainerRef.current?.jumpToMessage).toHaveBeenCalledWith(targetMessage.id, 1234);
		expect(mockSendLoadingEvent).toHaveBeenCalledWith({ visible: false });
	});

	it('shows a room-not-found alert on a reply jump that hits error-not-allowed', async () => {
		const args = createArgs({ isFromReply: true });
		const deps = createDeps({
			getMessageInfo: jest.fn().mockRejectedValue({ data: { errorType: 'error-not-allowed' } })
		});

		await jumpToMessage(args, deps);

		expect(mockShowErrorAlert).toHaveBeenCalledWith('The_room_does_not_exist', 'Room_not_found');
		expect(mockLog).not.toHaveBeenCalled();
		expect(args.cancel).toHaveBeenCalledTimes(1);
	});

	it('logs and cancels on any other error', async () => {
		const args = createArgs();
		const error = new Error('boom');
		const deps = createDeps({ getMessageInfo: jest.fn().mockRejectedValue(error) });

		await jumpToMessage(args, deps);

		expect(mockLog).toHaveBeenCalledWith(error);
		expect(mockShowErrorAlert).not.toHaveBeenCalled();
		expect(args.cancel).toHaveBeenCalledTimes(1);
	});
});
