import { clearSettings, updateSettings } from '../../actions/settings';
import { mockedStore } from '../../reducers/mockedStore';
import navigation from '../navigation/appNavigation';
import { videoConferenceJoin } from '../services/restApi';
import { initStore } from '../store/auxStore';
import { showErrorAlert } from './helpers/info';
import openLink from './helpers/openLink';
import { openConferenceCall } from './openConferenceCall';
import { videoConfJoin } from './videoConf';

jest.mock('../navigation/appNavigation', () => ({ navigate: jest.fn() }));
jest.mock('./helpers/openLink', () => jest.fn());
jest.mock('./openConferenceCall', () => ({ openConferenceCall: jest.fn(() => Promise.resolve()) }));
jest.mock('../services/restApi', () => ({ videoConferenceJoin: jest.fn() }));
jest.mock('./helpers/info', () => ({ showErrorAlert: jest.fn() }));

const mockedJoin = videoConferenceJoin as jest.Mock;

describe('videoConfJoin', () => {
	beforeAll(() => {
		initStore(mockedStore);
	});

	beforeEach(() => {
		jest.clearAllMocks();
		mockedStore.dispatch(clearSettings());
		mockedJoin.mockResolvedValue({ success: true, url: 'https://meet.jit.si/room1', providerName: 'jitsi' });
	});

	describe('without the conference window', () => {
		test('opens a jitsi call in the jitsi screen', async () => {
			await videoConfJoin('call1', true, true);

			expect(navigation.navigate).toHaveBeenCalledWith('JitsiMeetView', {
				url: 'https://meet.jit.si/room1',
				onlyAudio: false,
				videoConf: true
			});
		});

		test('opens any other provider as a link', async () => {
			mockedJoin.mockResolvedValue({ success: true, url: 'https://bbb.example.com/x', providerName: 'bbb' });

			await videoConfJoin('call1', true, true);

			expect(openLink).toHaveBeenCalledWith('https://bbb.example.com/x');
		});

		test('asks the server where to go', async () => {
			await videoConfJoin('call1', true, true);

			expect(mockedJoin).toHaveBeenCalledWith('call1', true, true);
		});

		test('does not open the conference window', async () => {
			await videoConfJoin('call1', true, true);

			expect(openConferenceCall).not.toHaveBeenCalled();
		});

		test('does not open a blank browser tab when a URL-less provider answers', async () => {
			mockedJoin.mockResolvedValue({ success: true, url: '', providerName: 'livekit' });

			await videoConfJoin('call1', true, true);

			expect(openLink).not.toHaveBeenCalled();
			expect(showErrorAlert).toHaveBeenCalled();
		});

		test('does not open a blank jitsi screen when its url is missing', async () => {
			mockedJoin.mockResolvedValue({ success: true, url: '', providerName: 'jitsi' });

			await videoConfJoin('call1', true, true);

			expect(navigation.navigate).not.toHaveBeenCalled();
			expect(showErrorAlert).toHaveBeenCalled();
		});
	});

	describe('with the conference window', () => {
		beforeEach(() => {
			mockedStore.dispatch(updateSettings('VideoConf_Conference_Window_Enabled', true));
		});

		test('opens the conference page for the call', async () => {
			await videoConfJoin('call1', true, true);

			expect(openConferenceCall).toHaveBeenCalledWith({ callId: 'call1' });
		});

		test('does not post the join — the page does that after its preflight', async () => {
			await videoConfJoin('call1', true, true);

			expect(mockedJoin).not.toHaveBeenCalled();
		});

		test('does not use the jitsi screen even for jitsi', async () => {
			await videoConfJoin('call1', true, true);

			expect(navigation.navigate).not.toHaveBeenCalledWith('JitsiMeetView', expect.anything());
			expect(openLink).not.toHaveBeenCalled();
		});
	});
});
