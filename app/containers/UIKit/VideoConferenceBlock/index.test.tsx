import { act, render, screen, waitFor } from '@testing-library/react-native';

import { emitter } from '~/lib/methods/helpers/emitter';
import sdk from '~/lib/services/sdk';
import VideoConferenceBlock from '.';

jest.mock('~/lib/services/sdk', () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock('~/lib/hooks/useMasterDetail', () => ({ useMasterDetail: () => false }));
jest.mock('~/lib/hooks/useVideoConf', () => ({ useVideoConf: () => ({ showInitCallActionSheet: jest.fn() }) }));
jest.mock('~/lib/services/voip/isInActiveVoipCall', () => ({ useIsInActiveVoipCall: () => false }));
jest.mock('~/lib/hooks/useAppSelector', () => ({ useAppSelector: (fn: any) => fn({ login: { user: { username: 'me' } } }) }));
jest.mock('~/containers/Avatar', () => () => null);

const mockedGet = sdk.get as jest.Mock;

const calling = { success: true, type: 'direct', status: 0, users: [], createdBy: { _id: 'u1', username: 'me' }, rid: 'rid1' };
const started = { ...calling, status: 1, users: [{ _id: 'u1', username: 'me', name: 'Me' }] };

describe('VideoConferenceBlock', () => {
	beforeEach(() => jest.clearAllMocks());

	it('reloads the call info when the room videoconf stream reports this call', async () => {
		mockedGet.mockResolvedValueOnce(calling).mockResolvedValueOnce(started);
		render(<VideoConferenceBlock callId='call1' blockId='call1' />);
		await screen.findByText('Waiting for answer');

		act(() => emitter.emit('videoConfUpdated', { rid: 'rid1', callId: 'call1' }));

		await waitFor(() => expect(screen.getByText('Join')).toBeTruthy());
		expect(mockedGet).toHaveBeenCalledTimes(2);
	});

	it('ignores stream updates for other calls', async () => {
		mockedGet.mockResolvedValue(calling);
		render(<VideoConferenceBlock callId='call1' blockId='call1' />);
		await screen.findByText('Waiting for answer');

		act(() => emitter.emit('videoConfUpdated', { rid: 'rid1', callId: 'other' }));

		expect(mockedGet).toHaveBeenCalledTimes(1);
	});
});
