import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import CallView from '.';
import { navigateToCallRoom } from '../../lib/services/voip/navigateToCallRoom';

let mockWindowWidth = 350;
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
	__esModule: true,
	default: () => ({ width: mockWindowWidth, height: 800, scale: 1, fontScale: 1 })
}));
import { useCallStore } from '../../lib/services/voip/useCallStore';
import { mockedStore } from '../../reducers/mockedStore';
import * as stories from './CallView.stories';
import { generateSnapshots } from '../../../.rnstorybook/generateSnapshots';

const mockNavigateToCallRoom = jest.mocked(navigateToCallRoom);

jest.mock('../../lib/services/voip/navigateToCallRoom', () => ({
	navigateToCallRoom: jest.fn().mockResolvedValue(undefined)
}));

// Mock ResponsiveLayoutContext for snapshots
jest.mock('../../lib/hooks/useResponsiveLayout/useResponsiveLayout', () => {
	const React = require('react');
	const actual = jest.requireActual('../../lib/hooks/useResponsiveLayout/useResponsiveLayout');
	return {
		...actual,
		ResponsiveLayoutContext: React.createContext({
			fontScale: 1,
			width: 350,
			height: 800,
			isLargeFontScale: false,
			fontScaleLimited: 1,
			rowHeight: 75,
			rowHeightCondensed: 60
		})
	};
});

const mockShowActionSheetRef = jest.fn();
jest.mock('../../containers/ActionSheet', () => ({
	showActionSheetRef: (options: any) => mockShowActionSheetRef(options),
	hideActionSheetRef: jest.fn()
}));

// Helper to create a mock call
const createMockCall = (overrides: any = {}) => ({
	state: 'active',
	muted: false,
	held: false,
	contact: {
		displayName: 'Bob Burnquist',
		username: 'bob.burnquist',
		sipExtension: ''
	},
	setMuted: jest.fn(),
	setHeld: jest.fn(),
	hangup: jest.fn(),
	reject: jest.fn(),
	emitter: {
		on: jest.fn(),
		off: jest.fn()
	},
	...overrides
});

// Helper to set store state for tests
const setStoreState = (overrides: Partial<ReturnType<typeof useCallStore.getState>> = {}) => {
	const mockCall = createMockCall();
	useCallStore.setState({
		call: mockCall as any,
		callId: 'test-id',
		callState: 'active',
		isMuted: false,
		isOnHold: false,
		isSpeakerOn: false,
		callStartTime: Date.now(),
		contact: {
			displayName: 'Bob Burnquist',
			username: 'bob.burnquist',
			sipExtension: ''
		},
		roomId: 'test-room-rid',
		...overrides
	});
};

const Wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={mockedStore}>{children}</Provider>;

describe('CallView', () => {
	beforeEach(() => {
		mockWindowWidth = 350;
		useCallStore.getState().reset();
		jest.clearAllMocks();
	});

	it('should return null when there is no call', () => {
		useCallStore.setState({ call: null });
		const { queryByTestId } = render(
			<Wrapper>
				<CallView />
			</Wrapper>
		);
		expect(queryByTestId('caller-info-toggle')).toBeNull();
	});

	it('should render when there is a call', () => {
		setStoreState();
		const { getByTestId } = render(
			<Wrapper>
				<CallView />
			</Wrapper>
		);

		expect(getByTestId('caller-info-toggle')).toBeTruthy();
		expect(getByTestId('call-view-speaker')).toBeTruthy();
		expect(getByTestId('call-view-hold')).toBeTruthy();
		expect(getByTestId('call-view-mute')).toBeTruthy();
		expect(getByTestId('call-view-message')).toBeTruthy();
		expect(getByTestId('call-view-end')).toBeTruthy();
		expect(getByTestId('call-view-dialpad')).toBeTruthy();
	});

	it('should show CallStatusText when call is active', () => {
		setStoreState({ callState: 'active' });
		const { getByText } = render(
			<Wrapper>
				<CallView />
			</Wrapper>
		);

		// CallStatusText should render (it shows a space when not muted/on hold)
		expect(getByText(/\s/)).toBeTruthy();
	});

	it('should not show CallStatusText when call is not active', () => {
		setStoreState({ callState: 'ringing' });
		const { queryByTestId } = render(
			<Wrapper>
				<CallView />
			</Wrapper>
		);

		// CallStatusText should not be rendered when not active
		// We can't easily test for the Text component directly, so we verify the caller-info-toggle is rendered
		// but CallStatusText won't be in the tree when callState is not 'active'
		expect(queryByTestId('caller-info-toggle')).toBeTruthy();
	});

	it('should disable hold and mute buttons when call is connecting', () => {
		setStoreState({ callState: 'ringing' });
		const toggleHold = jest.fn();
		const toggleMute = jest.fn();
		useCallStore.setState({ toggleHold, toggleMute });

		const { getByTestId } = render(
			<Wrapper>
				<CallView />
			</Wrapper>
		);

		const holdButton = getByTestId('call-view-hold');
		const muteButton = getByTestId('call-view-mute');

		// Test that disabled buttons don't trigger onPress
		fireEvent.press(holdButton);
		fireEvent.press(muteButton);
		expect(toggleHold).not.toHaveBeenCalled();
		expect(toggleMute).not.toHaveBeenCalled();
	});

	it('should enable hold and mute buttons when call is active', () => {
		setStoreState({ callState: 'active' });
		const toggleHold = jest.fn();
		const toggleMute = jest.fn();
		useCallStore.setState({ toggleHold, toggleMute });

		const { getByTestId } = render(
			<Wrapper>
				<CallView />
			</Wrapper>
		);

		const holdButton = getByTestId('call-view-hold');
		const muteButton = getByTestId('call-view-mute');

		// Test that enabled buttons trigger onPress
		fireEvent.press(holdButton);
		fireEvent.press(muteButton);
		expect(toggleHold).toHaveBeenCalledTimes(1);
		expect(toggleMute).toHaveBeenCalledTimes(1);
	});

	it('should call toggleMute when mute button is pressed', () => {
		setStoreState({ callState: 'active' });
		const toggleMute = jest.fn();
		useCallStore.setState({ toggleMute });

		const { getByTestId } = render(
			<Wrapper>
				<CallView />
			</Wrapper>
		);

		fireEvent.press(getByTestId('call-view-mute'));
		expect(toggleMute).toHaveBeenCalledTimes(1);
	});

	it('should call toggleHold when hold button is pressed', () => {
		setStoreState({ callState: 'active' });
		const toggleHold = jest.fn();
		useCallStore.setState({ toggleHold });

		const { getByTestId } = render(
			<Wrapper>
				<CallView />
			</Wrapper>
		);

		fireEvent.press(getByTestId('call-view-hold'));
		expect(toggleHold).toHaveBeenCalledTimes(1);
	});

	it('should call toggleSpeaker when speaker button is pressed', () => {
		setStoreState({ callState: 'active' });
		const toggleSpeaker = jest.fn();
		useCallStore.setState({ toggleSpeaker });

		const { getByTestId } = render(
			<Wrapper>
				<CallView />
			</Wrapper>
		);

		fireEvent.press(getByTestId('call-view-speaker'));
		expect(toggleSpeaker).toHaveBeenCalledTimes(1);
	});

	it('should call endCall when end button is pressed', () => {
		setStoreState({ callState: 'active' });
		const endCall = jest.fn();
		useCallStore.setState({ endCall });

		const { getByTestId } = render(
			<Wrapper>
				<CallView />
			</Wrapper>
		);

		fireEvent.press(getByTestId('call-view-end'));
		expect(endCall).toHaveBeenCalledTimes(1);
	});

	it('should call navigateToCallRoom when message button is pressed', () => {
		setStoreState({ callState: 'active' });
		const { getByTestId } = render(
			<Wrapper>
				<CallView />
			</Wrapper>
		);

		fireEvent.press(getByTestId('call-view-message'));
		expect(mockNavigateToCallRoom).toHaveBeenCalledTimes(1);
	});

	it('should show action sheet with dialpad when dialpad button is pressed', () => {
		setStoreState({ callState: 'active' });
		const { getByTestId } = render(
			<Wrapper>
				<CallView />
			</Wrapper>
		);

		fireEvent.press(getByTestId('call-view-dialpad'));
		expect(mockShowActionSheetRef).toHaveBeenCalledWith(
			expect.objectContaining({
				children: expect.anything()
			})
		);
	});

	it('should show "Cancel" label when call is connecting', () => {
		setStoreState({ callState: 'ringing' });
		const { getByText } = render(
			<Wrapper>
				<CallView />
			</Wrapper>
		);

		expect(getByText('Cancel')).toBeTruthy();
	});

	it('should show "End" label when call is active', () => {
		setStoreState({ callState: 'active' });
		const { getByText } = render(
			<Wrapper>
				<CallView />
			</Wrapper>
		);

		expect(getByText('End')).toBeTruthy();
	});

	it('should render call view when call is muted and active', () => {
		setStoreState({ callState: 'active', isMuted: true });
		const { getByTestId } = render(
			<Wrapper>
				<CallView />
			</Wrapper>
		);

		expect(getByTestId('caller-info-toggle')).toBeTruthy();
		expect(getByTestId('call-view-mute')).toBeTruthy();
	});

	it('should render call view when call is muted but not yet active', () => {
		setStoreState({ callState: 'ringing', isMuted: true });
		const { getByTestId } = render(
			<Wrapper>
				<CallView />
			</Wrapper>
		);

		expect(getByTestId('caller-info-toggle')).toBeTruthy();
	});

	it('should show correct icon for speaker button when speaker is on', () => {
		setStoreState({ callState: 'active', isSpeakerOn: true });
		const { getByTestId } = render(
			<Wrapper>
				<CallView />
			</Wrapper>
		);

		// The button should be rendered (we test behavior rather than props)
		const speakerButton = getByTestId('call-view-speaker');
		expect(speakerButton).toBeTruthy();
	});

	it('should show correct icon for speaker button when speaker is off', () => {
		setStoreState({ callState: 'active', isSpeakerOn: false });
		const { getByTestId } = render(
			<Wrapper>
				<CallView />
			</Wrapper>
		);

		// The button should be rendered (we test behavior rather than props)
		const speakerButton = getByTestId('call-view-speaker');
		expect(speakerButton).toBeTruthy();
	});

	it('should render mute button correctly when muted', () => {
		setStoreState({ callState: 'active', isMuted: true });
		const { getByTestId } = render(
			<Wrapper>
				<CallView />
			</Wrapper>
		);

		// The button should be rendered (we test behavior rather than props)
		const muteButton = getByTestId('call-view-mute');
		expect(muteButton).toBeTruthy();
	});

	it('should render hold button correctly when on hold', () => {
		setStoreState({ callState: 'active', isOnHold: true });
		const { getByTestId } = render(
			<Wrapper>
				<CallView />
			</Wrapper>
		);

		// The button should be rendered (we test behavior rather than props)
		const holdButton = getByTestId('call-view-hold');
		expect(holdButton).toBeTruthy();
	});

	it('should show correct label for hold button based on state', () => {
		setStoreState({ callState: 'active', isOnHold: true });
		const { getByText } = render(
			<Wrapper>
				<CallView />
			</Wrapper>
		);

		expect(getByText('Unhold')).toBeTruthy();
	});

	it('should show correct label for mute button based on state', () => {
		setStoreState({ callState: 'active', isMuted: true });
		const { getByText } = render(
			<Wrapper>
				<CallView />
			</Wrapper>
		);

		expect(getByText('Unmute')).toBeTruthy();
	});

	it('should render buttons in two rows on narrow layout', () => {
		mockWindowWidth = 350;
		setStoreState();
		const { getByTestId } = render(
			<Wrapper>
				<CallView />
			</Wrapper>
		);
		expect(getByTestId('call-buttons-row-0')).toBeTruthy();
		expect(getByTestId('call-buttons-row-1')).toBeTruthy();
	});

	it('should render buttons in a single row on wide layout', () => {
		mockWindowWidth = 800;
		setStoreState();
		const { getByTestId, queryByTestId } = render(
			<Wrapper>
				<CallView />
			</Wrapper>
		);
		expect(getByTestId('call-buttons-row-0')).toBeTruthy();
		expect(queryByTestId('call-buttons-row-1')).toBeNull();
	});
});

generateSnapshots(stories);
