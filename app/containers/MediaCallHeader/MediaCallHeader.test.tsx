import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import MediaCallHeader from './MediaCallHeader';
import { navigateToCallRoom } from '../../lib/services/voip/navigateToCallRoom';
import { useCallStore } from '../../lib/services/voip/useCallStore';
import { mockedStore } from '../../reducers/mockedStore';
import * as stories from './MediaCallHeader.stories';
import { generateSnapshots } from '../../../.rnstorybook/generateSnapshots';

const mockNavigateToCallRoom = jest.mocked(navigateToCallRoom);

jest.mock('../../lib/services/voip/navigateToCallRoom', () => ({
	navigateToCallRoom: jest.fn().mockResolvedValue(undefined)
}));

const mockCallStartTime = 1713340800000;

// Helper to create a mock call
const createMockCall = (overrides: Record<string, unknown> = {}) => ({
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
		callState: 'active',
		isMuted: false,
		isOnHold: false,
		isSpeakerOn: false,
		callStartTime: mockCallStartTime,
		contact: {
			id: 'user-1',
			displayName: 'Bob Burnquist',
			username: 'bob.burnquist',
			sipExtension: ''
		},
		roomId: 'test-room-rid',
		focused: true,
		remoteMute: false,
		remoteHeld: false,
		...overrides
	});
};

const Wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={mockedStore}>{children}</Provider>;

beforeAll(() => {
	jest.useFakeTimers();
	jest.setSystemTime(mockCallStartTime);
});

afterAll(() => {
	jest.useRealTimers();
});

describe('MediaCallHeader', () => {
	beforeEach(() => {
		useCallStore.getState().reset();
		jest.clearAllMocks();
	});

	it('should render empty placeholder when there is no call', () => {
		useCallStore.setState({ call: null });
		const { getByTestId, queryByTestId } = render(
			<Wrapper>
				<MediaCallHeader />
			</Wrapper>
		);

		expect(getByTestId('media-call-header-empty')).toBeTruthy();
		expect(queryByTestId('media-call-header')).toBeNull();
		expect(queryByTestId('media-call-header-collapse')).toBeNull();
		expect(queryByTestId('media-call-header-content')).toBeNull();
		expect(queryByTestId('media-call-header-end')).toBeNull();
	});

	it('should render empty placeholder when native accepted but call not bound yet (before answerCall completes)', () => {
		useCallStore.getState().setNativeAcceptedCallId('e3246c4d-d23a-412f-8a8b-37ec9f29ef1a');
		const { getByTestId, queryByTestId } = render(
			<Wrapper>
				<MediaCallHeader />
			</Wrapper>
		);

		expect(getByTestId('media-call-header-empty')).toBeTruthy();
		expect(queryByTestId('media-call-header')).toBeNull();
	});

	it('should render full header when call exists', () => {
		setStoreState();
		const { getByTestId } = render(
			<Wrapper>
				<MediaCallHeader />
			</Wrapper>
		);

		expect(getByTestId('media-call-header')).toBeTruthy();
		expect(getByTestId('media-call-header-collapse')).toBeTruthy();
		expect(getByTestId('media-call-header-content')).toBeTruthy();
		expect(getByTestId('media-call-header-end')).toBeTruthy();
	});

	it('should show caller name in Title', () => {
		setStoreState({
			contact: {
				id: 'user-1',
				displayName: 'Alice Smith',
				username: 'alice.smith',
				sipExtension: '1234'
			}
		});
		const { getByTestId, getByText } = render(
			<Wrapper>
				<MediaCallHeader />
			</Wrapper>
		);

		expect(getByTestId('call-view-header-title')).toBeTruthy();
		// Title renders name plus optional Timer in nested Text; match by regex
		expect(getByText(/Alice Smith/)).toBeTruthy();
	});

	it('should show subtitle when connecting', () => {
		setStoreState({ callState: 'ringing' });
		const { getByTestId } = render(
			<Wrapper>
				<MediaCallHeader />
			</Wrapper>
		);

		expect(getByTestId('call-view-header-subtitle')).toBeTruthy();
	});

	it('should call toggleFocus when collapse button is pressed', () => {
		setStoreState();
		const toggleFocus = jest.fn();
		useCallStore.setState({ toggleFocus });

		const { getByTestId } = render(
			<Wrapper>
				<MediaCallHeader />
			</Wrapper>
		);

		fireEvent.press(getByTestId('media-call-header-collapse'));
		expect(toggleFocus).toHaveBeenCalledTimes(1);
	});

	it('should call endCall when end button is pressed', () => {
		setStoreState();
		const endCall = jest.fn();
		useCallStore.setState({ endCall });

		const { getByTestId } = render(
			<Wrapper>
				<MediaCallHeader />
			</Wrapper>
		);

		fireEvent.press(getByTestId('media-call-header-end'));
		expect(endCall).toHaveBeenCalledTimes(1);
	});

	it('should have pointerEvents none when focused and controls hidden', () => {
		setStoreState({ focused: true, controlsVisible: false });
		const { getByTestId } = render(
			<Wrapper>
				<MediaCallHeader />
			</Wrapper>
		);

		expect(getByTestId('media-call-header')).toHaveProp('pointerEvents', 'none');
	});

	it('should have pointerEvents auto when focused and controls visible', () => {
		setStoreState({ focused: true, controlsVisible: true });
		const { getByTestId } = render(
			<Wrapper>
				<MediaCallHeader />
			</Wrapper>
		);

		expect(getByTestId('media-call-header')).toHaveProp('pointerEvents', 'auto');
	});

	it('should have pointerEvents auto when not focused even if controls hidden', () => {
		setStoreState({ focused: false, controlsVisible: false });
		const { getByTestId } = render(
			<Wrapper>
				<MediaCallHeader />
			</Wrapper>
		);

		expect(getByTestId('media-call-header')).toHaveProp('pointerEvents', 'auto');
	});

	it('should call navigateToCallRoom when content is pressed and navigation is enabled', () => {
		setStoreState();
		const { getByTestId } = render(
			<Wrapper>
				<MediaCallHeader />
			</Wrapper>
		);

		fireEvent.press(getByTestId('media-call-header-content'));
		expect(mockNavigateToCallRoom).toHaveBeenCalledTimes(1);
	});

	it('calls navigateToCallRoom when contact has both username and sipExtension (RC user with extension)', () => {
		setStoreState({
			contact: {
				id: 'user-1',
				displayName: 'Bob Burnquist',
				username: 'bob.burnquist',
				sipExtension: '2244'
			},
			roomId: 'test-room-rid'
		});
		const { getByTestId } = render(
			<Wrapper>
				<MediaCallHeader />
			</Wrapper>
		);

		fireEvent.press(getByTestId('media-call-header-content'));
		expect(mockNavigateToCallRoom).toHaveBeenCalledTimes(1);
	});

	it('does not call navigateToCallRoom when roomId is null', () => {
		setStoreState({ roomId: null });
		const { getByTestId } = render(
			<Wrapper>
				<MediaCallHeader />
			</Wrapper>
		);

		fireEvent.press(getByTestId('media-call-header-content'));
		expect(mockNavigateToCallRoom).not.toHaveBeenCalled();
	});
});

generateSnapshots(stories);
