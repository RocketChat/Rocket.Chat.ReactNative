import { act, fireEvent, render } from '@testing-library/react-native';
import { AccessibilityInfo, Text } from 'react-native';

import { hideNotification } from '~/lib/methods/helpers/notifications';
import IncomingCallShell from '../IncomingCallShell';

jest.mock('~/lib/methods/helpers/notifications', () => ({ hideNotification: jest.fn() }));
jest.mock('~/lib/hooks/useMasterDetail', () => ({ useMasterDetail: () => false }));
jest.mock('react-native/Libraries/ReactNative/RendererProxy', () => ({
	...jest.requireActual('react-native/Libraries/ReactNative/RendererProxy'),
	findNodeHandle: () => 42
}));
jest.mock('~/containers/Ringer', () => {
	const { Text: MockText } = jest.requireActual('react-native');
	const { createElement } = jest.requireActual('react');
	return {
		__esModule: true,
		default: () => createElement(MockText, { testID: 'ringer' }, 'ringing'),
		ERingerSounds: { RINGTONE: 'ringtone' }
	};
});

const setup = () => {
	const onDecline = jest.fn();
	const onAccept = jest.fn();
	const utils = render(
		<IncomingCallShell
			accessibilityLabel='Incoming call from Ada'
			header={<Text>Ada is calling</Text>}
			onDecline={onDecline}
			onAccept={onAccept}
			testIDPrefix='call'
		/>
	);
	return { ...utils, onDecline, onAccept };
};

describe('IncomingCallShell', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('shows who is calling, with the three things the user can do, and rings', () => {
		const { getByText, getByTestId } = setup();

		expect(getByText('Ada is calling')).toBeTruthy();
		expect(getByTestId('call-dismiss')).toBeTruthy();
		expect(getByTestId('call-decline')).toBeTruthy();
		expect(getByTestId('call-accept')).toBeTruthy();
		expect(getByTestId('ringer')).toBeTruthy();
	});

	it('is read out as one incoming call', () => {
		const { getByLabelText } = setup();

		expect(getByLabelText('Incoming call from Ada')).toBeTruthy();
	});

	it('accepts, stops ringing and puts the popup away', () => {
		const { getByTestId, queryByTestId, onAccept, onDecline } = setup();

		fireEvent.press(getByTestId('call-accept'));

		expect(onAccept).toHaveBeenCalledTimes(1);
		expect(onDecline).not.toHaveBeenCalled();
		expect(hideNotification).toHaveBeenCalledTimes(1);
		expect(queryByTestId('ringer')).toBeNull();
	});

	it('declines, stops ringing and puts the popup away', () => {
		const { getByTestId, queryByTestId, onAccept, onDecline } = setup();

		fireEvent.press(getByTestId('call-decline'));

		expect(onDecline).toHaveBeenCalledTimes(1);
		expect(onAccept).not.toHaveBeenCalled();
		expect(hideNotification).toHaveBeenCalledTimes(1);
		expect(queryByTestId('ringer')).toBeNull();
	});

	it('can be dismissed without answering either way', () => {
		const { getByTestId, queryByTestId, onAccept, onDecline } = setup();

		fireEvent.press(getByTestId('call-dismiss'));

		expect(onAccept).not.toHaveBeenCalled();
		expect(onDecline).not.toHaveBeenCalled();
		expect(hideNotification).toHaveBeenCalledTimes(1);
		expect(queryByTestId('ringer')).toBeNull();
	});

	it('moves a screen reader to the popup shortly after it shows up', () => {
		const setAccessibilityFocus = jest.spyOn(AccessibilityInfo, 'setAccessibilityFocus').mockImplementation(() => {});
		setup();
		expect(setAccessibilityFocus).not.toHaveBeenCalled();

		act(() => {
			jest.advanceTimersByTime(300);
		});

		expect(setAccessibilityFocus).toHaveBeenCalledWith(42);
	});
});
