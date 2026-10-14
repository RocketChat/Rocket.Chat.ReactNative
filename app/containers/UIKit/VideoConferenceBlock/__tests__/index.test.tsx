import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { VideoConferenceStatus } from '~/definitions/IVideoConference';
import { emitter } from '~/lib/methods/helpers/emitter';
import { MessageRoomProvider } from '~/containers/message/stores/MessageRoomStore';
import sdk from '~/lib/services/sdk';
import VideoConferenceBlock from '..';

jest.mock('~/lib/services/sdk', () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock('~/lib/hooks/useVideoConf', () => ({ useVideoConf: () => ({ showInitCallActionSheet: jest.fn() }) }));
jest.mock('~/lib/services/voip/isInActiveVoipCall', () => ({ useIsInActiveVoipCall: () => false }));
jest.mock('~/lib/hooks/useAppSelector', () => ({ useAppSelector: (fn: any) => fn({ login: { user: { username: 'me' } } }) }));
jest.mock('~/containers/Avatar', () => () => null);
jest.mock('~/containers/Touch', () => {
	const { Pressable } = jest.requireActual('react-native');
	return { __esModule: true, default: Pressable };
});
jest.mock('~/lib/hooks/useSetting', () => ({ useSetting: () => undefined }));

const mockedGet = sdk.get as jest.Mock;
const mockOnDiscussionPress = jest.fn();

const renderBlock = () =>
	render(
		<MessageRoomProvider handlers={{ onDiscussionPress: mockOnDiscussionPress }}>
			<VideoConferenceBlock callId='call1' blockId='call1' />
		</MessageRoomProvider>
	);

const calling = {
	success: true,
	type: 'direct',
	status: VideoConferenceStatus.CALLING,
	users: [],
	createdBy: { _id: 'u1', username: 'me' },
	rid: 'rid1'
};
const started = { ...calling, status: VideoConferenceStatus.STARTED, users: [{ _id: 'u1', username: 'me', name: 'Me' }] };
const ended = (status: VideoConferenceStatus) => ({ ...calling, status, endedAt: '2026-01-01' });

describe('VideoConferenceBlock', () => {
	beforeEach(() => jest.clearAllMocks());

	it('reloads the call info when the room videoconf stream reports this call', async () => {
		mockedGet.mockResolvedValueOnce(calling).mockResolvedValueOnce(started);
		renderBlock();
		await screen.findByText('Waiting for answer');

		act(() => emitter.emit('videoConfUpdated', 'call1'));

		await waitFor(() => expect(screen.getByText('Join')).toBeTruthy());
		expect(mockedGet).toHaveBeenCalledTimes(2);
	});

	it('ignores stream updates for other calls', async () => {
		mockedGet.mockResolvedValue(calling);
		renderBlock();
		await screen.findByText('Waiting for answer');

		act(() => emitter.emit('videoConfUpdated', 'other'));

		expect(mockedGet).toHaveBeenCalledTimes(1);
	});

	it('shows the join discussion button only when the call has a discussion', async () => {
		mockedGet.mockResolvedValue(calling);
		renderBlock();
		await screen.findByText('Waiting for answer');
		expect(screen.queryByTestId('video-conf-join-discussion')).toBeNull();
	});

	it('opens the discussion through the room handler on press', async () => {
		mockedGet.mockResolvedValue({ ...calling, discussionRid: 'disc1' });
		renderBlock();

		fireEvent.press(await screen.findByTestId('video-conf-join-discussion'));

		expect(mockOnDiscussionPress).toHaveBeenCalledWith('disc1');
	});

	it('hides the join discussion button when no discussion handler is provided', async () => {
		mockedGet.mockResolvedValue({ ...calling, discussionRid: 'disc1' });
		render(
			<MessageRoomProvider>
				<VideoConferenceBlock callId='call1' blockId='call1' />
			</MessageRoomProvider>
		);
		await screen.findByText('Waiting for answer');
		expect(screen.queryByTestId('video-conf-join-discussion')).toBeNull();
	});

	it.each([VideoConferenceStatus.EXPIRED, VideoConferenceStatus.DECLINED])(
		'shows "not answered" for an ended call with status %i',
		async status => {
			mockedGet.mockResolvedValue(ended(status));
			renderBlock();
			expect(await screen.findByText('Call was not answered')).toBeTruthy();
		}
	);

	it('hides "not answered" for a call that ended normally', async () => {
		mockedGet.mockResolvedValue(ended(VideoConferenceStatus.ENDED));
		renderBlock();
		await screen.findByText('Call again');
		expect(screen.queryByText('Call was not answered')).toBeNull();
	});

	it.each([[[]], [[{ _id: 'u1', username: 'me', name: 'Me' }]]])(
		'shows "not answered" for a group call that ended with users %j',
		async users => {
			mockedGet.mockResolvedValue({ ...ended(VideoConferenceStatus.ENDED), type: 'videoconference', users });
			renderBlock();
			expect(await screen.findByText('Call was not answered')).toBeTruthy();
		}
	);

	it('shows "not answered" for a group call whose members never joined', async () => {
		mockedGet.mockResolvedValue({
			...ended(VideoConferenceStatus.EXPIRED),
			type: 'videoconference',
			users: [
				{ _id: 'u2', username: 'bob', name: 'Bob', joined: false },
				{ _id: 'u3', username: 'eve', name: 'Eve', joined: false }
			]
		});
		renderBlock();
		expect(await screen.findByText('Call was not answered')).toBeTruthy();
	});

	it('shows participants for a group call when someone other than the author joined', async () => {
		mockedGet.mockResolvedValue({
			...ended(VideoConferenceStatus.ENDED),
			type: 'videoconference',
			users: [
				{ _id: 'u1', username: 'me', name: 'Me' },
				{ _id: 'u2', username: 'bob', name: 'Bob', joined: false },
				{ _id: 'u3', username: 'eve', name: 'Eve', joined: true }
			]
		});
		renderBlock();
		expect(await screen.findByText('Joined')).toBeTruthy();
		expect(screen.queryByText('Call was not answered')).toBeNull();
	});
});
