import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { HeaderCallButton } from '../HeaderCallButton';

const mockVideoConf = {
	showInitCallActionSheet: jest.fn(),
	callEnabled: false,
	disabledTooltip: false
};
jest.mock('../../../../../lib/hooks/useVideoConf', () => ({
	useVideoConf: () => mockVideoConf
}));

const mockMediaCall = {
	openNewMediaCall: jest.fn(),
	startCallImmediate: jest.fn(),
	hasMediaCallPermission: false,
	isInActiveCall: false
};
jest.mock('../../../../../lib/hooks/useNewMediaCall', () => ({
	useNewMediaCall: () => mockMediaCall
}));

jest.mock('../../../../../containers/Header/components/HeaderButton', () => {
	const ReactActual = jest.requireActual('react');
	return {
		Item: ({
			accessibilityLabel,
			disabled,
			iconName,
			onPress,
			testID
		}: {
			accessibilityLabel: string;
			disabled: boolean;
			iconName: string;
			onPress: () => void;
			testID: string;
		}) => ReactActual.createElement('Item', { accessibilityLabel, disabled, iconName, onPress, testID })
	};
});

const renderCallButton = (disabled = false) =>
	render(<HeaderCallButton rid='rid-1' disabled={disabled} accessibilityLabel='Call Room Title' />);

describe('HeaderCallButton', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.useFakeTimers();
		mockVideoConf.callEnabled = false;
		mockVideoConf.disabledTooltip = false;
		mockMediaCall.hasMediaCallPermission = false;
		mockMediaCall.isInActiveCall = false;
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('renders nothing without media call permission and with calls disabled', () => {
		renderCallButton();

		expect(screen.queryByTestId('room-view-header-call')).not.toBeOnTheScreen();
	});

	it('renders the media call button with media call permission', () => {
		mockMediaCall.hasMediaCallPermission = true;

		renderCallButton();

		const callButton = screen.getByTestId('room-view-header-call');
		expect(callButton).toHaveProp('iconName', 'phone');
		expect(callButton).toHaveProp('accessibilityLabel', 'Call Room Title');
		expect(callButton).toHaveProp('disabled', false);
	});

	it('disables the media call button during an active call', () => {
		mockMediaCall.hasMediaCallPermission = true;
		mockMediaCall.isInActiveCall = true;

		renderCallButton();

		expect(screen.getByTestId('room-view-header-call')).toHaveProp('disabled', true);
	});

	it('opens the media call sheet after the double tap window on a single tap', () => {
		mockMediaCall.hasMediaCallPermission = true;

		renderCallButton();
		fireEvent.press(screen.getByTestId('room-view-header-call'));

		expect(mockMediaCall.openNewMediaCall).not.toHaveBeenCalled();
		act(() => jest.advanceTimersByTime(300));
		expect(mockMediaCall.openNewMediaCall).toHaveBeenCalled();
		expect(mockMediaCall.startCallImmediate).not.toHaveBeenCalled();
	});

	it('starts the call immediately on a double tap', () => {
		mockMediaCall.hasMediaCallPermission = true;

		renderCallButton();
		fireEvent.press(screen.getByTestId('room-view-header-call'));
		fireEvent.press(screen.getByTestId('room-view-header-call'));

		expect(mockMediaCall.startCallImmediate).toHaveBeenCalled();
		act(() => jest.advanceTimersByTime(300));
		expect(mockMediaCall.openNewMediaCall).not.toHaveBeenCalled();
	});

	it('shows the video conference sheet when calls are enabled without media call permission', () => {
		mockVideoConf.callEnabled = true;

		renderCallButton();
		fireEvent.press(screen.getByTestId('room-view-header-call'));

		expect(mockVideoConf.showInitCallActionSheet).toHaveBeenCalled();
	});

	it('disables the video conference button when the tooltip is disabled', () => {
		mockVideoConf.callEnabled = true;
		mockVideoConf.disabledTooltip = true;

		renderCallButton();

		expect(screen.getByTestId('room-view-header-call')).toHaveProp('disabled', true);
	});

	it('disables the video conference button when the header disables it', () => {
		mockVideoConf.callEnabled = true;

		renderCallButton(true);

		expect(screen.getByTestId('room-view-header-call')).toHaveProp('disabled', true);
	});
});
