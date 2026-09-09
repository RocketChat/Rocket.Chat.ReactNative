import Navigation from '../../navigation/appNavigation';
import { CONFERENCE_ROUTE, closeConferenceCall, expandConferenceCall, minimizeConferenceCall } from './conferenceCallNavigation';
import { useConferenceCallStore } from './useConferenceCallStore';

jest.mock('../../navigation/appNavigation', () => ({
	navigate: jest.fn(),
	back: jest.fn(),
	getCurrentRoute: jest.fn(() => undefined)
}));

const state = () => useConferenceCallStore.getState();
const mockedCurrentRoute = Navigation.getCurrentRoute as jest.Mock;

const showingConference = () => mockedCurrentRoute.mockReturnValue({ name: CONFERENCE_ROUTE });
const showingAnotherScreen = () => mockedCurrentRoute.mockReturnValue({ name: 'RoomView' });

const openCall = () => state().open({ callId: 'call1', url: 'https://open.rocket.chat/conference/call1' });

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
});

describe('minimizeConferenceCall', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		state().close();
	});

	test('pops the conference route, which is what reports the minimize', () => {
		showingConference();
		openCall();

		minimizeConferenceCall();

		expect(Navigation.back).toHaveBeenCalled();
	});

	test('minimizes directly when the conference route is not showing', () => {
		showingAnotherScreen();
		openCall();

		minimizeConferenceCall();

		expect(Navigation.back).not.toHaveBeenCalled();
		expect(state().expanded).toBe(false);
		expect(state().callId).toEqual('call1');
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
});
