import navigation from '../navigation/appNavigation';
import { videoConferenceJoin } from '../services/restApi';
import { videoConfJoin } from './videoConf';

jest.mock('../navigation/appNavigation', () => ({ __esModule: true, default: { navigate: jest.fn() } }));
jest.mock('../services/restApi', () => ({ videoConferenceJoin: jest.fn() }));
jest.mock('./helpers', () => ({ isAndroid: false, showErrorAlert: jest.fn() }));
jest.mock('./helpers/log', () => ({ __esModule: true, default: jest.fn() }));

const mockedJoin = videoConferenceJoin as jest.Mock;

describe('videoConfJoin', () => {
	beforeEach(() => jest.clearAllMocks());

	it('opens jitsi calls in JitsiMeetView', async () => {
		mockedJoin.mockResolvedValue({ success: true, url: 'https://jitsi.example/call', providerName: 'jitsi' });
		await videoConfJoin('call-1', true, true);
		expect(navigation.navigate).toHaveBeenCalledWith('JitsiMeetView', {
			url: 'https://jitsi.example/call',
			onlyAudio: false,
			videoConf: true
		});
	});

	it('opens other providers in VideoConfWebView', async () => {
		mockedJoin.mockResolvedValue({ success: true, url: 'https://pexip.example/call', providerName: 'pexip' });
		await videoConfJoin('call-2', true, true);
		expect(navigation.navigate).toHaveBeenCalledWith('VideoConfWebView', { url: 'https://pexip.example/call' });
	});
});
