import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { emitter } from '~/lib/methods/helpers/emitter';
import getRoomInfo from '~/lib/methods/getRoomInfo';
import { goRoom } from '~/lib/methods/helpers/goRoom';
import { showToast } from '~/lib/methods/helpers/showToast';
import sdk from '~/lib/services/sdk';
import VideoConferenceBlock from '.';

jest.mock('~/lib/services/sdk', () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock('~/lib/hooks/useMasterDetail', () => ({ useMasterDetail: () => false }));
jest.mock('~/lib/hooks/useVideoConf', () => ({ useVideoConf: () => ({ showInitCallActionSheet: jest.fn() }) }));
jest.mock('~/lib/services/voip/isInActiveVoipCall', () => ({ useIsInActiveVoipCall: () => false }));
jest.mock('~/lib/hooks/useAppSelector', () => ({ useAppSelector: (fn: any) => fn({ login: { user: { username: 'me' } } }) }));
jest.mock('~/containers/Avatar', () => () => null);
jest.mock('~/containers/Touch', () => {
	const { Pressable } = jest.requireActual('react-native');
	return { __esModule: true, default: Pressable };
});
jest.mock('~/lib/methods/getRoomInfo', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('~/lib/methods/helpers/goRoom', () => ({ goRoom: jest.fn() }));
jest.mock('~/lib/methods/helpers/showToast', () => ({ showToast: jest.fn() }));

const mockedGet = sdk.get as jest.Mock;

const calling = { success: true, type: 'direct', status: 0, users: [], createdBy: { _id: 'u1', username: 'me' }, rid: 'rid1' };
const started = { ...calling, status: 1, users: [{ _id: 'u1', username: 'me', name: 'Me' }] };
const ended = (status: number) => ({ ...calling, status, endedAt: '2026-01-01' });

describe('VideoConferenceBlock', () => {
	beforeEach(() => jest.clearAllMocks());

	it('reloads the call info when the room videoconf stream reports this call', async () => {
		mockedGet.mockResolvedValueOnce(calling).mockResolvedValueOnce(started);
		render(<VideoConferenceBlock callId='call1' blockId='call1' />);
		await screen.findByText('Waiting for answer');

		act(() => emitter.emit('videoConfUpdated', 'call1'));

		await waitFor(() => expect(screen.getByText('Join')).toBeTruthy());
		expect(mockedGet).toHaveBeenCalledTimes(2);
	});

	it('ignores stream updates for other calls', async () => {
		mockedGet.mockResolvedValue(calling);
		render(<VideoConferenceBlock callId='call1' blockId='call1' />);
		await screen.findByText('Waiting for answer');

		act(() => emitter.emit('videoConfUpdated', 'other'));

		expect(mockedGet).toHaveBeenCalledTimes(1);
	});

	it('shows the join discussion button only when the call has a discussion', async () => {
		mockedGet.mockResolvedValue(calling);
		render(<VideoConferenceBlock callId='call1' blockId='call1' />);
		await screen.findByText('Waiting for answer');
		expect(screen.queryByTestId('video-conf-join-discussion')).toBeNull();
	});

	it('opens the discussion room on press', async () => {
		const discussion = { rid: 'disc1', name: 'disc', t: 'p' };
		mockedGet.mockResolvedValue({ ...calling, discussionRid: 'disc1' });
		(getRoomInfo as jest.Mock).mockResolvedValue(discussion);
		render(<VideoConferenceBlock callId='call1' blockId='call1' />);

		fireEvent.press(await screen.findByTestId('video-conf-join-discussion'));

		await waitFor(() => expect(goRoom).toHaveBeenCalledWith({ item: discussion, isMasterDetail: false }));
		expect(getRoomInfo).toHaveBeenCalledWith('disc1');
	});

	it.each([2, 4])('shows "not answered" for an ended call with status %i', async status => {
		mockedGet.mockResolvedValue(ended(status));
		render(<VideoConferenceBlock callId='call1' blockId='call1' />);
		expect(await screen.findByText('Call was not answered')).toBeTruthy();
	});

	it('hides "not answered" for a call that ended normally', async () => {
		mockedGet.mockResolvedValue(ended(3));
		render(<VideoConferenceBlock callId='call1' blockId='call1' />);
		await screen.findByText('Call again');
		expect(screen.queryByText('Call was not answered')).toBeNull();
	});

	it('opens the discussion only once on a double tap', async () => {
		mockedGet.mockResolvedValue({ ...calling, discussionRid: 'disc1' });
		(getRoomInfo as jest.Mock).mockResolvedValue({ rid: 'disc1', name: 'disc', t: 'p' });
		render(<VideoConferenceBlock callId='call1' blockId='call1' />);

		const button = await screen.findByTestId('video-conf-join-discussion');
		fireEvent.press(button);
		fireEvent.press(button);

		await waitFor(() => expect(goRoom).toHaveBeenCalledTimes(1));
		expect(getRoomInfo).toHaveBeenCalledTimes(1);
	});

	it('shows a toast when the discussion cannot be resolved', async () => {
		mockedGet.mockResolvedValue({ ...calling, discussionRid: 'disc1' });
		(getRoomInfo as jest.Mock).mockResolvedValue(null);
		render(<VideoConferenceBlock callId='call1' blockId='call1' />);

		fireEvent.press(await screen.findByTestId('video-conf-join-discussion'));

		await waitFor(() => expect(showToast).toHaveBeenCalledWith('Room not found'));
		expect(goRoom).not.toHaveBeenCalled();
	});

	it('shows "not answered" for a group call that ended with only the creator', async () => {
		mockedGet.mockResolvedValue({ ...ended(3), type: 'videoconference', users: [{ _id: 'u1', username: 'me', name: 'Me' }] });
		render(<VideoConferenceBlock callId='call1' blockId='call1' />);
		expect(await screen.findByText('Call was not answered')).toBeTruthy();
	});
});
