import { fireEvent, render } from '@testing-library/react-native';

import { hideActionSheetRef } from '~/containers/ActionSheet';
import { closeConferenceCall } from '~/lib/services/conference/conferenceCallNavigation';
import { type TConferenceError, useConferenceCallStore } from '~/lib/services/conference/useConferenceCallStore';
import Navigation from '~/lib/navigation/appNavigation';
import ConferenceView from '../ConferenceView';

jest.mock('@react-navigation/native', () => {
	const { useEffect: mockUseEffect } = jest.requireActual('react');
	return {
		useFocusEffect: (effect: () => void | (() => void)) => mockUseEffect(effect, [effect])
	};
});
jest.mock('~/lib/navigation/appNavigation', () => ({
	back: jest.fn(),
	getCurrentRoute: jest.fn(() => ({ name: 'ConferenceView' }))
}));
jest.mock('~/lib/services/conference/conferenceCallNavigation', () => ({
	closeConferenceCall: jest.fn(),
	CONFERENCE_ROUTE: 'ConferenceView'
}));
jest.mock('~/containers/ActionSheet', () => ({
	...jest.requireActual('~/containers/ActionSheet'),
	hideActionSheetRef: jest.fn()
}));
jest.mock('~/containers/StatusBar', () => () => null);
jest.mock('~/containers/ConferenceCall/ConferencePreflight', () => {
	const { createElement } = jest.requireActual('react');
	const { Text: MockText } = jest.requireActual('react-native');
	return { __esModule: true, default: () => createElement(MockText, null, 'preflight') };
});
jest.mock('~/containers/ConferenceCall/LazyConferenceInCall', () => {
	const { createElement } = jest.requireActual('react');
	const { Text: MockText } = jest.requireActual('react-native');
	return { __esModule: true, default: () => createElement(MockText, null, 'in call') };
});

const state = () => useConferenceCallStore.getState();

describe('ConferenceView', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		state().close();
		state().open({ callId: 'call1' });
		state().minimize();
	});

	it('shows the preflight before the user joins', () => {
		const { getByText } = render(<ConferenceView />);

		expect(getByText('preflight')).toBeTruthy();
	});

	it.each(['joining', 'connecting'] as const)('keeps the preflight on screen while %s', phase => {
		state().setPhase(phase);
		const { getByText, queryByText } = render(<ConferenceView />);

		expect(getByText('preflight')).toBeTruthy();
		expect(queryByText('Connecting...')).toBeNull();
	});

	it.each(['connected', 'reconnecting'] as const)('shows the call while %s', phase => {
		state().setPhase(phase);
		const { getByText } = render(<ConferenceView />);

		expect(getByText('in call')).toBeTruthy();
	});

	it('says the call ended, and lets the user close it', () => {
		state().setPhase('ended');
		const { getByText, getByTestId } = render(<ConferenceView />);

		expect(getByText('Call ended')).toBeTruthy();
		fireEvent.press(getByTestId('conference-ended-close'));
		expect(closeConferenceCall).toHaveBeenCalledTimes(1);
	});

	it('lets the user rejoin a call they were dropped from', () => {
		state().setPhase('ended');
		const { getByTestId, getByText } = render(<ConferenceView />);

		fireEvent.press(getByTestId('conference-ended-rejoin'));

		expect(state().phase).toBe('preflight');
		expect(getByText('preflight')).toBeTruthy();
	});

	it.each([
		['not-licensed', "This Workspace's license doesn't include LiveKit calls."],
		['not-configured', "Video conferencing isn't set up on this Workspace."],
		['token-failed', "Couldn't get access to this call. Try again."],
		['unsupported', "This call can't be opened in this version of the app."],
		['join-failed', 'Error starting video call']
	] as [TConferenceError, string][])('explains a %s failure in plain words', (error, text) => {
		state().setPhase('error', error);
		const { getByText } = render(<ConferenceView />);

		expect(getByText(text)).toBeTruthy();
	});

	it('lets the user try again from a failure, back at the preflight', () => {
		state().setPhase('error', 'token-failed');
		const { getByTestId, getByText } = render(<ConferenceView />);

		fireEvent.press(getByTestId('conference-error-retry'));

		expect(state().phase).toBe('preflight');
		expect(getByText('preflight')).toBeTruthy();
	});

	it('lets the user close a failed call', () => {
		state().setPhase('error', 'token-failed');
		const { getByTestId } = render(<ConferenceView />);

		fireEvent.press(getByTestId('conference-error-close'));

		expect(closeConferenceCall).toHaveBeenCalledTimes(1);
	});

	it('shows the call while on screen and minimizes it when the user leaves the screen', () => {
		state().setPhase('connected');
		const { unmount } = render(<ConferenceView />);
		expect(state().expanded).toBe(true);

		unmount();

		expect(state().expanded).toBe(false);
		expect(state().callId).toBe('call1');
	});

	it.each(['joining', 'connecting', 'reconnecting'] as const)(
		'keeps the call to return to when the user leaves while %s',
		phase => {
			state().setPhase(phase);
			const { unmount } = render(<ConferenceView />);

			unmount();

			expect(state().callId).toBe('call1');
			expect(closeConferenceCall).not.toHaveBeenCalled();
		}
	);

	it('puts away any sheet that is open, such as the chat, when the user leaves the screen', () => {
		state().setPhase('connected');
		const { unmount } = render(<ConferenceView />);

		unmount();

		expect(hideActionSheetRef).toHaveBeenCalledTimes(1);
	});

	it.each([
		['preflight', undefined],
		['ended', undefined],
		['error', 'join-failed']
	] as const)('closes a call that is not running when the user leaves the screen from %s', (phase, error) => {
		state().setPhase(phase, error);
		const { unmount } = render(<ConferenceView />);

		unmount();

		expect(closeConferenceCall).toHaveBeenCalledTimes(1);
	});

	it('does not close a call that was already closed when the screen goes away', () => {
		state().setPhase('error', 'join-failed');
		const { unmount } = render(<ConferenceView />);
		state().close();

		unmount();

		expect(closeConferenceCall).not.toHaveBeenCalled();
	});

	it('goes back by itself when there is no call to show', () => {
		state().close();

		render(<ConferenceView />);

		expect(Navigation.back).toHaveBeenCalledTimes(1);
	});
});
