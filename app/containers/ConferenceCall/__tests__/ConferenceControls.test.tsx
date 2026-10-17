import { fireEvent, render } from '@testing-library/react-native';

import ConferenceControls from '../ConferenceControls';

interface IControlsState {
	micEnabled?: boolean;
	cameraEnabled?: boolean;
	screenSharing?: boolean;
	handRaised?: boolean;
}

const makeHandlers = () => ({
	onToggleMic: jest.fn(),
	onToggleCamera: jest.fn(),
	onToggleScreenShare: jest.fn(),
	onMicOptions: jest.fn(),
	onCameraOptions: jest.fn(),
	onToggleHand: jest.fn(),
	onReaction: jest.fn(),
	onMore: jest.fn(),
	onLeave: jest.fn()
});

const controls = (
	handlers: ReturnType<typeof makeHandlers>,
	{ micEnabled = true, cameraEnabled = true, screenSharing = false, handRaised = false }: IControlsState = {}
) => (
	<ConferenceControls
		micEnabled={micEnabled}
		cameraEnabled={cameraEnabled}
		screenSharing={screenSharing}
		handRaised={handRaised}
		onToggleMic={handlers.onToggleMic}
		onToggleCamera={handlers.onToggleCamera}
		onToggleScreenShare={handlers.onToggleScreenShare}
		onMicOptions={handlers.onMicOptions}
		onCameraOptions={handlers.onCameraOptions}
		onToggleHand={handlers.onToggleHand}
		onReaction={handlers.onReaction}
		onMore={handlers.onMore}
		onLeave={handlers.onLeave}
	/>
);

const setup = (state: IControlsState = {}) => {
	const handlers = makeHandlers();
	const utils = render(controls(handlers, state));
	return { ...utils, handlers };
};

describe('ConferenceControls', () => {
	it('offers to mute while the microphone is on, and to unmute once it is off', () => {
		const { getByLabelText, rerender, handlers } = setup();
		expect(getByLabelText('Mute')).toBeTruthy();

		rerender(controls(handlers, { micEnabled: false }));

		expect(getByLabelText('Unmute')).toBeTruthy();
	});

	it('offers to stop the camera while it is on, and to start it once it is off', () => {
		const { getByLabelText, rerender, handlers } = setup();
		expect(getByLabelText('Stop camera')).toBeTruthy();

		rerender(controls(handlers, { cameraEnabled: false }));

		expect(getByLabelText('Start camera')).toBeTruthy();
	});

	it('offers to share the screen, and to stop once it is shared', () => {
		const { getByLabelText, queryByLabelText, rerender, handlers } = setup();
		expect(getByLabelText('Share screen')).toBeTruthy();

		rerender(controls(handlers, { screenSharing: true }));

		expect(getByLabelText('Stop sharing screen')).toBeTruthy();
		expect(queryByLabelText('Share screen')).toBeNull();
	});

	it('offers to lower the hand once it is raised', () => {
		const { getByLabelText, queryByLabelText } = setup({ handRaised: true });

		expect(getByLabelText('Lower hand')).toBeTruthy();
		expect(queryByLabelText('Raise hand')).toBeNull();
	});

	it.each([
		['conference-mic-button', 'onToggleMic'],
		['conference-camera-button', 'onToggleCamera'],
		['conference-screen-share-button', 'onToggleScreenShare'],
		['conference-hand-button', 'onToggleHand'],
		['conference-reaction-button', 'onReaction'],
		['conference-more-button', 'onMore'],
		['conference-leave-button', 'onLeave']
	] as const)('%s calls %s', (testID, handler) => {
		const { getByTestId, handlers } = setup();

		fireEvent.press(getByTestId(testID));

		expect(handlers[handler]).toHaveBeenCalledTimes(1);
	});

	it('opens the audio options from the microphone and the camera options from the camera on a long press', () => {
		const { getByTestId, handlers } = setup();

		fireEvent(getByTestId('conference-mic-button'), 'longPress');
		fireEvent(getByTestId('conference-camera-button'), 'longPress');

		expect(handlers.onMicOptions).toHaveBeenCalledTimes(1);
		expect(handlers.onCameraOptions).toHaveBeenCalledTimes(1);
	});
});
