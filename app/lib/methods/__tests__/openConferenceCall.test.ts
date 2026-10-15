import { setUser } from '~/actions/login';
import { selectServerRequest } from '~/actions/server';
import { clearSettings } from '~/actions/settings';
import { mockedStore } from '~/reducers/mockedStore';
import Navigation from '../../navigation/appNavigation';
import { closeConferenceCall } from '../../services/conference/conferenceCallNavigation';
import { conferenceSession } from '../../services/conference/ConferenceSession';
import { preflightCallId, useConferenceCallStore } from '../../services/conference/useConferenceCallStore';
import { initStore } from '../../store/auxStore';
import { openConferenceCall } from '../openConferenceCall';
import { requestVoipCallPermissions } from '../voipCallPermissions';

jest.mock('../../navigation/appNavigation', () => ({
	navigate: jest.fn(),
	back: jest.fn(),
	getCurrentRoute: jest.fn(() => undefined)
}));
jest.mock('../../services/conference/ConferenceSession', () => ({
	conferenceSession: { end: jest.fn(() => Promise.resolve()), join: jest.fn() }
}));
jest.mock('../voipCallPermissions', () => ({ requestVoipCallPermissions: jest.fn(() => Promise.resolve(true)) }));

const state = () => useConferenceCallStore.getState();

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
		jest.clearAllMocks();
		state().close();
		mockedStore.dispatch(clearSettings());
		mockedStore.dispatch(selectServerRequest('https://open.rocket.chat', '8.0.0'));
		mockedStore.dispatch(setUser({ id: 'uid1', token: 'tok1' }));
	});

	test('joining an existing call opens its preflight', async () => {
		await openConferenceCall({ callId: 'call1' });

		expect(state().callId).toEqual('call1');
		expect(state().server).toEqual('https://open.rocket.chat');
		expect(state().expanded).toBe(true);
		expect(state().phase).toBe('preflight');
	});

	test('starting a call opens the preflight for the room', async () => {
		await openConferenceCall({ rid: 'GENERAL' });

		expect(state().callId).toEqual(preflightCallId('GENERAL'));
		expect(state().rid).toEqual('GENERAL');
	});

	test('navigates to the conference screen', async () => {
		await openConferenceCall({ callId: 'call1' });

		expect(Navigation.navigate).toHaveBeenCalledWith('ConferenceView');
	});

	test('two rooms being started are two different calls', async () => {
		await openConferenceCall({ rid: 'room1' });

		await openConferenceCall({ rid: 'room2' });

		expect(state().callId).toEqual(preflightCallId('room2'));
	});

	test('re-opening the call already showing brings it back without restarting it', async () => {
		await openConferenceCall({ callId: 'call1' });
		state().setPhase('connected');
		state().minimize();

		await openConferenceCall({ callId: 'call1' });

		expect(state().phase).toBe('connected');
		expect(state().expanded).toBe(true);
	});

	test('joining the call a started preflight was assigned brings it back instead of starting over', async () => {
		await openConferenceCall({ rid: 'GENERAL' });
		state().assignCall('call1', 'GENERAL');
		state().setPhase('connected');

		await openConferenceCall({ callId: 'call1', rid: 'GENERAL' });

		expect(state().callId).toEqual('call1');
		expect(state().phase).toBe('connected');
		expect(state().expanded).toBe(true);
	});

	test('opening a different call leaves the one in progress first', async () => {
		await openConferenceCall({ callId: 'call1' });
		state().setPhase('connected');

		await openConferenceCall({ callId: 'call2' });

		expect(conferenceSession.end).toHaveBeenCalledTimes(1);
		expect(state().callId).toEqual('call2');
		expect(state().phase).toBe('preflight');
	});

	test('opening another call from a preflight has no call to leave', async () => {
		await openConferenceCall({ callId: 'call1' });

		await openConferenceCall({ callId: 'call2' });

		expect(conferenceSession.end).not.toHaveBeenCalled();
		expect(state().callId).toEqual('call2');
	});

	test('re-opening the call in progress does not leave it', async () => {
		await openConferenceCall({ callId: 'call1' });
		state().setPhase('connected');

		await openConferenceCall({ callId: 'call1' });

		expect(conferenceSession.end).not.toHaveBeenCalled();
	});

	test('reports rather than silently swallowing a join it cannot serve', async () => {
		mockedStore.dispatch(selectServerRequest('', '8.0.0'));

		await expect(openConferenceCall({ callId: 'call1' })).rejects.toThrow();

		expect(state().callId).toBeUndefined();
		expect(Navigation.navigate).not.toHaveBeenCalled();
	});

	test('opens on a cleartext Workspace, since no login token is handed to a page any more', async () => {
		mockedStore.dispatch(selectServerRequest('http://open.rocket.chat', '8.0.0'));

		await openConferenceCall({ callId: 'call1' });

		expect(state().callId).toEqual('call1');
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

	test('drops a pending open when the Workspace changes while permissions resolve', async () => {
		const { requested, resolvePermissions } = holdPermissions();

		const openPromise = openConferenceCall({ callId: 'call1' });
		await requested;
		mockedStore.dispatch(selectServerRequest('https://other.rocket.chat', '8.0.0'));
		resolvePermissions();
		await openPromise;

		expect(state().callId).toBeUndefined();
		expect(Navigation.navigate).not.toHaveBeenCalled();
	});

	test('a newer open wins when two pending opens resolve in reverse order', async () => {
		const first = holdPermissions();
		const openFirst = openConferenceCall({ callId: 'call1' });
		await first.requested;

		const second = holdPermissions();
		const openSecond = openConferenceCall({ callId: 'call2' });
		await second.requested;

		second.resolvePermissions();
		await openSecond;
		first.resolvePermissions();
		await openFirst;

		expect(state().callId).toBe('call2');
	});
});
