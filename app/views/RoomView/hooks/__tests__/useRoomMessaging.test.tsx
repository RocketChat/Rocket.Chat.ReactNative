import { act, render, renderHook } from '@testing-library/react-native';
import { Text } from 'react-native';

import { sendMessage as sendMessageRequest } from '../../../../lib/methods/sendMessage';
import { Review } from '../../../../lib/methods/helpers/review';
import { events, logEvent } from '../../../../lib/methods/helpers/log';
import { MessageActionProvider, useMessageAction } from '../../../../containers/message/stores/MessageActionStore';
import { useRoomMessaging } from '../useRoomMessaging';

jest.mock('../../../../lib/methods/sendMessage', () => ({
	sendMessage: jest.fn()
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
jest.mock('../../../../lib/hooks/useAppSelector', () => ({
	useAppSelector: jest.fn((selector: (state: unknown) => unknown) =>
		selector({ login: { isAuthenticated: true, user: { id: 'user-1', username: 'alice', token: 'token-1' } } })
	)
}));
jest.mock('../../../../lib/hooks/useMasterDetail', () => ({ useMasterDetail: jest.fn(() => false) }));
jest.mock('../../../../containers/ActionSheet', () => ({
	useActionSheet: jest.fn(() => ({ showActionSheet: jest.fn(), hideActionSheet: jest.fn() }))
}));
jest.mock('../useRoomNavigation', () => ({
	useRoomNavigation: jest.fn(() => ({
		onThreadMessagesLoaded: jest.fn(),
		onThreadPress: jest.fn(),
		jumpToMessageByUrl: jest.fn()
	}))
}));
jest.mock('../useRoomInit', () => ({
	useRoomInit: jest.fn(() => ({
		loading: false,
		failed: false,
		retry: jest.fn(),
		lastSeen: 'last-seen-message',
		clearLastSeen: jest.fn()
	}))
}));

const mockSendMessageRequest = sendMessageRequest as jest.Mock;
const mockReview = Review.pushPositiveEvent as jest.Mock;
const mockLogEvent = logEvent as jest.Mock;

const createDeferred = () => {
	let resolve!: () => void;
	let reject!: (error: Error) => void;
	const promise = new Promise<void>((promiseResolve, promiseReject) => {
		resolve = promiseResolve;
		reject = promiseReject;
	});
	return { promise, resolve, reject };
};

const renderRoomMessaging = () => {
	const roomStore = {} as any;
	return renderHook(() =>
		useRoomMessaging({
			rid: 'room-1',
			t: 'c',
			tmid: 'thread-1',
			ready: true,
			roomStore,
			roomUserId: 'user-1'
		})
	);
};

const ActionProbe = () => <Text testID='action'>{useMessageAction()?.kind ?? 'none'}</Text>;

describe('useRoomMessaging', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('shares its action store with message rows and resets the action while sending is pending', async () => {
		const deferred = createDeferred();
		mockSendMessageRequest.mockReturnValue(deferred.promise);
		const { result } = renderRoomMessaging();
		const actionProbe = render(
			<MessageActionProvider store={result.current.messageActionStore}>
				<ActionProbe />
			</MessageActionProvider>
		);

		act(() => result.current.messageActionStore.getState().actions.setQuoteMessageIds(['quoted-message']));
		expect(actionProbe.getByTestId('action').props.children).toBe('quote');

		let sendPromise: void;
		act(() => {
			sendPromise = result.current.sendMessage('hello', true);
		});

		expect(mockSendMessageRequest).toHaveBeenCalledWith(
			'room-1',
			'hello',
			'thread-1',
			expect.objectContaining({ id: 'user-1', username: 'alice', token: 'token-1' }),
			true
		);
		expect(mockLogEvent).toHaveBeenCalledWith(events.ROOM_SEND_MESSAGE);
		expect(result.current.messageActionStore.getState().action).toBeNull();
		expect(actionProbe.getByTestId('action').props.children).toBe('none');
		expect(mockReview).not.toHaveBeenCalled();

		await act(async () => {
			deferred.resolve();
			await sendPromise;
		});

		expect(mockReview).toHaveBeenCalledTimes(1);
	});

	it('clears Last Seen and reports success only after the request resolves', async () => {
		const deferred = createDeferred();
		mockSendMessageRequest.mockReturnValue(deferred.promise);
		const { result } = renderRoomMessaging();
		const clearLastSeen = require('../useRoomInit').useRoomInit.mock.results[0].value.clearLastSeen as jest.Mock;

		act(() => result.current.sendMessage('hello'));
		expect(clearLastSeen).not.toHaveBeenCalled();
		expect(mockReview).not.toHaveBeenCalled();

		await act(async () => {
			deferred.resolve();
			await Promise.resolve();
		});

		expect(clearLastSeen).toHaveBeenCalledTimes(1);
		expect(mockReview).toHaveBeenCalledTimes(1);
	});

	it('does not perform success side effects when the request fails', async () => {
		const deferred = createDeferred();
		mockSendMessageRequest.mockReturnValue(deferred.promise);
		const { result } = renderRoomMessaging();
		const clearLastSeen = require('../useRoomInit').useRoomInit.mock.results[0].value.clearLastSeen as jest.Mock;

		act(() => result.current.sendMessage('hello'));
		await act(async () => {
			deferred.reject(new Error('offline'));
			await Promise.resolve();
		});

		expect(clearLastSeen).not.toHaveBeenCalled();
		expect(mockReview).not.toHaveBeenCalled();
	});
});
