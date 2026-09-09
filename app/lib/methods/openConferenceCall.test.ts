import { setUser } from '../../actions/login';
import { selectServerRequest } from '../../actions/server';
import { mockedStore } from '../../reducers/mockedStore';
import Navigation from '../navigation/appNavigation';
import { useConferenceCallStore } from '../services/conference/useConferenceCallStore';
import { initStore } from '../store/auxStore';
import { openConferenceCall } from './openConferenceCall';

jest.mock('../navigation/appNavigation', () => ({ navigate: jest.fn() }));
jest.mock('./handleAndroidBltPermission', () => ({ handleAndroidBltPermission: jest.fn(() => Promise.resolve()) }));
jest.mock('expo-camera', () => ({
	Camera: {
		getCameraPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
		requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true }))
	}
}));
jest.mock('./voipCallPermissions', () => ({ requestVoipCallPermissions: jest.fn(() => Promise.resolve(true)) }));

const state = () => useConferenceCallStore.getState();

describe('openConferenceCall', () => {
	beforeAll(() => {
		initStore(mockedStore);
	});

	beforeEach(() => {
		state().close();
		(Navigation.navigate as jest.Mock).mockClear();
		mockedStore.dispatch(selectServerRequest('https://open.rocket.chat', '8.0.0'));
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

		await openConferenceCall({ callId: 'call1' });

		expect(state().callId).toEqual('call1');
		expect(state().url).toEqual('https://open.rocket.chat/conference/new?rid=GENERAL');
		expect(state().expanded).toBe(true);
	});

	test('does nothing when there is no server to build a url from', async () => {
		mockedStore.dispatch(selectServerRequest('', '8.0.0'));

		await openConferenceCall({ callId: 'call1' });

		expect(state().callId).toBeUndefined();
		expect(Navigation.navigate).not.toHaveBeenCalled();
	});
});
