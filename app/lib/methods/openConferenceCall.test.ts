import { setUser } from '../../actions/login';
import { selectServerRequest } from '../../actions/server';
import { clearSettings, updateSettings } from '../../actions/settings';
import { mockedStore } from '../../reducers/mockedStore';
import Navigation from '../navigation/appNavigation';
import { closeConferenceCall } from '../services/conference/conferenceCallNavigation';
import { useConferenceCallStore } from '../services/conference/useConferenceCallStore';
import { initStore } from '../store/auxStore';
import { openConferenceCall } from './openConferenceCall';
import { requestVoipCallPermissions } from './voipCallPermissions';

jest.mock('../navigation/appNavigation', () => ({
	navigate: jest.fn(),
	back: jest.fn(),
	getCurrentRoute: jest.fn(() => undefined)
}));
jest.mock('expo-camera', () => ({
	Camera: {
		getCameraPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
		requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true }))
	}
}));
jest.mock('./voipCallPermissions', () => ({ requestVoipCallPermissions: jest.fn(() => Promise.resolve(true)) }));

const state = () => useConferenceCallStore.getState();

/**
 * Parks the next permission request so a test can act while the open is mid-flight. `requested`
 * settles once the request is actually in — openConferenceCall awaits the camera check first, so
 * the request has not been made yet on the line after the call.
 */
const holdPermissions = () => {
	let resolvePermissions!: () => void;
	const requested = new Promise<void>(onRequested => {
		(requestVoipCallPermissions as jest.Mock).mockImplementationOnce(
			() =>
				new Promise<boolean>(resolve => {
					resolvePermissions = () => resolve(true);
					onRequested();
				})
		);
	});
	return { requested, resolvePermissions: () => resolvePermissions() };
};

describe('openConferenceCall', () => {
	beforeAll(() => {
		initStore(mockedStore);
	});

	beforeEach(() => {
		state().close();
		(Navigation.navigate as jest.Mock).mockClear();
		mockedStore.dispatch(clearSettings());
		mockedStore.dispatch(selectServerRequest('https://open.rocket.chat', '8.0.0'));
		mockedStore.dispatch(updateSettings('VideoConf_Conference_Window_Enabled', true));
		mockedStore.dispatch(setUser({ id: 'uid1', token: 'tok1' }));
	});

	test('joining an existing call shows its conference page', async () => {
		await openConferenceCall({ callId: 'call1' });

		expect(state().url).toEqual('https://open.rocket.chat/conference/call1');
		expect(state().expanded).toBe(true);
	});

	test('starting a call shows the preflight for the room', async () => {
		await openConferenceCall({ rid: 'GENERAL' });

		expect(state().url).toEqual('https://open.rocket.chat/conference/new?rid=GENERAL');
	});

	test('navigates to the conference screen', async () => {
		await openConferenceCall({ callId: 'call1' });

		expect(Navigation.navigate).toHaveBeenCalledWith('ConferenceView');
	});

	test('two rooms being started are two different calls', async () => {
		await openConferenceCall({ rid: 'room1' });

		await openConferenceCall({ rid: 'room2' });

		expect(state().url).toEqual('https://open.rocket.chat/conference/new?rid=room2');
	});

	test('re-opening the call already showing does not reload it', async () => {
		await openConferenceCall({ callId: 'call1' });
		state().minimize();

		await openConferenceCall({ callId: 'call1' });

		expect(state().url).toEqual('https://open.rocket.chat/conference/call1');
		expect(state().expanded).toBe(true);
	});

	test('joining the assigned call after starting it keeps the preflight page', async () => {
		await openConferenceCall({ rid: 'GENERAL' });

		await openConferenceCall({ callId: 'call1', rid: 'GENERAL' });

		expect(state().callId).toEqual('call1');
		expect(state().url).toEqual('https://open.rocket.chat/conference/new?rid=GENERAL');
		expect(state().expanded).toBe(true);
	});

	test('joining a call from another room loads that call instead of the preflight', async () => {
		await openConferenceCall({ rid: 'GENERAL' });

		await openConferenceCall({ callId: 'call1', rid: 'other-room' });

		expect(state().url).toEqual('https://open.rocket.chat/conference/call1');
	});

	test('reports rather than silently swallowing a join it cannot serve', async () => {
		mockedStore.dispatch(selectServerRequest('', '8.0.0'));

		await expect(openConferenceCall({ callId: 'call1' })).rejects.toThrow();

		expect(state().callId).toBeUndefined();
		expect(Navigation.navigate).not.toHaveBeenCalled();
	});

	test('reports a join attempted while the conference window is disabled', async () => {
		mockedStore.dispatch(updateSettings('VideoConf_Conference_Window_Enabled', false));

		await expect(openConferenceCall({ callId: 'call1' })).rejects.toThrow();

		expect(state().callId).toBeUndefined();
		expect(Navigation.navigate).not.toHaveBeenCalled();
	});

	test('reports a join on a cleartext server, which cannot be handed the login token', async () => {
		mockedStore.dispatch(selectServerRequest('http://open.rocket.chat', '8.0.0'));

		await expect(openConferenceCall({ callId: 'call1' })).rejects.toThrow();

		expect(state().callId).toBeUndefined();
		expect(Navigation.navigate).not.toHaveBeenCalled();
	});

	test('stays quiet when the user themselves supersedes the call', async () => {
		(requestVoipCallPermissions as jest.Mock).mockImplementationOnce(() => {
			closeConferenceCall();
			return Promise.resolve(true);
		});

		await expect(openConferenceCall({ callId: 'call1' })).resolves.toBeUndefined();
	});

	test('drops a pending open when the call is closed while permissions resolve', async () => {
		const { requested, resolvePermissions } = holdPermissions();

		const openPromise = openConferenceCall({ callId: 'call1' });
		await requested;
		closeConferenceCall();
		resolvePermissions();
		await openPromise;

		expect(state().callId).toBeUndefined();
		expect(Navigation.navigate).not.toHaveBeenCalled();
	});

	test('drops a pending open when the server changes while permissions resolve', async () => {
		const { requested, resolvePermissions } = holdPermissions();

		const openPromise = openConferenceCall({ callId: 'call1' });
		await requested;
		mockedStore.dispatch(selectServerRequest('https://other.rocket.chat', '8.0.0'));
		resolvePermissions();
		await openPromise;

		expect(state().callId).toBeUndefined();
		expect(Navigation.navigate).not.toHaveBeenCalled();
	});
});
