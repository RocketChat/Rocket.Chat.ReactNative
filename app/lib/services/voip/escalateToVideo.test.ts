import { Alert } from 'react-native';

import openLink from '~/lib/methods/helpers/openLink';
import Navigation from '~/lib/navigation/appNavigation';
import { mediaCallsEscalate } from '~/lib/services/restApi';
import { escalateToVideo } from './escalateToVideo';
import { useCallStore } from './useCallStore';

jest.mock('~/lib/services/restApi', () => ({
	mediaCallsEscalate: jest.fn()
}));
jest.mock('~/lib/methods/helpers/openLink', () => jest.fn());
jest.mock('~/lib/methods/helpers/log', () => jest.fn());
jest.mock('~/lib/navigation/appNavigation', () => ({ back: jest.fn(), navigate: jest.fn() }));

const mockEscalate = jest.mocked(mediaCallsEscalate);
const mockOpenLink = jest.mocked(openLink);
const mockEndCall = jest.fn();

const pressAlertButton = (index: number) => {
	const buttons = jest.mocked(Alert.alert).mock.calls[0][2]!;
	return buttons[index].onPress!();
};

describe('escalateToVideo', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
		useCallStore.setState({ callId: 'call-1', focused: true, endCall: mockEndCall });
	});

	it('does nothing without an active call', () => {
		useCallStore.setState({ callId: null });
		escalateToVideo();
		expect(Alert.alert).not.toHaveBeenCalled();
	});

	it('keeps the call when the user cancels', () => {
		escalateToVideo();
		const buttons = jest.mocked(Alert.alert).mock.calls[0][2]!;
		expect(buttons[0].style).toBe('cancel');
		expect(mockEscalate).not.toHaveBeenCalled();
	});

	it('ends the voice call, leaves CallView and opens the conference url on confirm', async () => {
		mockEscalate.mockResolvedValue({ success: true, url: 'https://pexip.example/conf', providerName: 'core.pexip' } as any);
		escalateToVideo();
		await pressAlertButton(1);
		expect(mockEscalate).toHaveBeenCalledWith('call-1');
		expect(mockEndCall).toHaveBeenCalledTimes(1);
		expect(Navigation.back).toHaveBeenCalledTimes(1);
		expect(mockOpenLink).toHaveBeenCalledWith('https://pexip.example/conf');
		expect(mockEndCall.mock.invocationCallOrder[0]).toBeLessThan(mockOpenLink.mock.invocationCallOrder[0]);
	});

	it('joins jitsi conferences in-app', async () => {
		mockEscalate.mockResolvedValue({ success: true, url: 'https://jitsi.example/conf', providerName: 'jitsi' } as any);
		escalateToVideo();
		await pressAlertButton(1);
		expect(Navigation.navigate).toHaveBeenCalledWith('JitsiMeetView', {
			url: 'https://jitsi.example/conf',
			onlyAudio: false,
			videoConf: true
		});
		expect(mockOpenLink).not.toHaveBeenCalled();
	});

	it('does not end or leave again when the server already ended the voice call', async () => {
		mockEscalate.mockImplementation(async () => {
			useCallStore.setState({ callId: null });
			return { success: true, url: 'https://pexip.example/conf', providerName: 'core.pexip' } as any;
		});
		escalateToVideo();
		await pressAlertButton(1);
		expect(mockEndCall).not.toHaveBeenCalled();
		expect(Navigation.back).not.toHaveBeenCalled();
		expect(mockOpenLink).toHaveBeenCalledWith('https://pexip.example/conf');
	});

	it('shows an error when escalation fails', async () => {
		mockEscalate.mockRejectedValue(new Error('boom'));
		escalateToVideo();
		await pressAlertButton(1);
		expect(mockEndCall).not.toHaveBeenCalled();
		expect(mockOpenLink).not.toHaveBeenCalled();
		expect(Alert.alert).toHaveBeenLastCalledWith('', 'Unable to start video call', expect.anything(), expect.anything());
	});
});
