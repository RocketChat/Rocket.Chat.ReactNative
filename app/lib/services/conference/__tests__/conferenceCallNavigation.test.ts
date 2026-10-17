import Navigation from '~/lib/navigation/appNavigation';
import { videoConferenceCancel } from '../../restApi';
import { conferenceSession } from '../ConferenceSession';
import { CONFERENCE_ROUTE, closeConferenceCall, expandConferenceCall } from '../conferenceCallNavigation';
import { preflightCallId, useConferenceCallStore } from '../useConferenceCallStore';

jest.mock('~/lib/navigation/appNavigation', () => ({
	navigate: jest.fn(),
	back: jest.fn(),
	getCurrentRoute: jest.fn(() => undefined)
}));
jest.mock('../../restApi', () => ({ videoConferenceCancel: jest.fn(() => Promise.resolve({ success: true })) }));
jest.mock('../ConferenceSession', () => ({
	conferenceSession: { end: jest.fn(() => Promise.resolve()), join: jest.fn() }
}));

const state = () => useConferenceCallStore.getState();
const mockedCurrentRoute = Navigation.getCurrentRoute as jest.Mock;

const showingConference = () => mockedCurrentRoute.mockReturnValue({ name: CONFERENCE_ROUTE });
const showingAnotherScreen = () => mockedCurrentRoute.mockReturnValue({ name: 'RoomView' });

const openCall = () => state().open({ callId: 'call1' });

describe('expandConferenceCall', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		state().close();
	});

	test('shows the conference route', () => {
		showingAnotherScreen();
		openCall();

		expandConferenceCall();

		expect(state().expanded).toBe(true);
		expect(Navigation.navigate).toHaveBeenCalledWith(CONFERENCE_ROUTE);
	});

	test('does not stack a second conference route when already showing one', () => {
		showingConference();
		openCall();

		expandConferenceCall();

		expect(Navigation.navigate).not.toHaveBeenCalled();
	});

	test('does nothing when there is no call to show', () => {
		showingAnotherScreen();

		expandConferenceCall();

		expect(Navigation.navigate).not.toHaveBeenCalled();
	});
});

describe('closeConferenceCall', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		state().close();
	});

	test('ends the call and leaves the conference route', () => {
		showingConference();
		openCall();

		closeConferenceCall();

		expect(state().callId).toBeUndefined();
		expect(Navigation.back).toHaveBeenCalled();
	});

	test('ends a minimized call without navigating away from the current screen', () => {
		showingAnotherScreen();
		openCall();
		state().minimize();

		closeConferenceCall();

		expect(state().callId).toBeUndefined();
		expect(Navigation.back).not.toHaveBeenCalled();
	});

	test('leaves the call on the Workspace, not just on screen', () => {
		showingAnotherScreen();
		openCall();

		closeConferenceCall();

		expect(conferenceSession.end).toHaveBeenCalledTimes(1);
	});

	describe('a call that could not be joined', () => {
		test('is cancelled when the user gives up on it, so nobody keeps ringing', () => {
			showingConference();
			openCall();
			state().setPhase('error', 'not-licensed');

			closeConferenceCall();

			expect(videoConferenceCancel).toHaveBeenCalledWith('call1');
		});

		test('is closed all the same when the server refuses to cancel it', async () => {
			(videoConferenceCancel as jest.Mock).mockRejectedValueOnce(new Error('error-invalid-call'));
			showingConference();
			openCall();
			state().setPhase('error', 'join-failed');

			closeConferenceCall();
			await Promise.resolve();

			expect(state().callId).toBeUndefined();
		});

		test('is not cancelled while it is only a preflight for a call nobody started', () => {
			showingConference();
			state().open({ callId: preflightCallId('GENERAL'), rid: 'GENERAL' });
			state().setPhase('error', 'join-failed');

			closeConferenceCall();

			expect(videoConferenceCancel).not.toHaveBeenCalled();
		});
	});

	test.each(['preflight', 'joining', 'connecting', 'connected', 'reconnecting', 'ended'] as const)(
		'does not cancel a call that did not fail (%s)',
		phase => {
			showingConference();
			openCall();
			state().setPhase(phase);

			closeConferenceCall();

			expect(videoConferenceCancel).not.toHaveBeenCalled();
		}
	);
});
