import React from 'react';
import { render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import { mockedStore } from '../../../reducers/mockedStore';
import { useCallStore } from '../../../lib/services/voip/useCallStore';
import { CallButtons } from './CallButtons';
import { useCallLayoutMode } from '../useCallLayoutMode';
import { useResponsiveLayout } from '../../../lib/hooks/useResponsiveLayout/useResponsiveLayout';

jest.mock('../useCallLayoutMode', () => ({
	useCallLayoutMode: jest.fn(() => ({ layoutMode: 'narrow' }))
}));

jest.mock('../../../containers/ActionSheet', () => ({
	showActionSheetRef: jest.fn(),
	hideActionSheetRef: jest.fn()
}));

jest.mock('react-native-incall-manager', () => ({
	start: jest.fn(),
	stop: jest.fn(),
	setForceSpeakerphoneOn: jest.fn(() => Promise.resolve())
}));

jest.mock('../../../lib/hooks/useResponsiveLayout/useResponsiveLayout', () => ({
	useResponsiveLayout: jest.fn(() => ({ width: 375, height: 812 }))
}));

const setStoreState = (overrides: Partial<ReturnType<typeof useCallStore.getState>> = {}) => {
	const mockCall = {
		state: 'active',
		muted: false,
		held: false,
		contact: {},
		sendDTMF: jest.fn(),
		emitter: { on: jest.fn(), off: jest.fn() }
	} as any;

	useCallStore.setState({
		call: mockCall,
		callId: 'test-id',
		callState: 'active',
		isMuted: false,
		isOnHold: false,
		isSpeakerOn: false,
		roomId: 'room-1',
		contact: { name: 'Test User' } as any,
		toggleMute: jest.fn(),
		toggleHold: jest.fn(),
		toggleSpeaker: jest.fn(),
		endCall: jest.fn(),
		dialpadValue: '',
		...overrides
	});
};

const Wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={mockedStore}>{children}</Provider>;

describe('CallButtons', () => {
	beforeEach(() => {
		(useCallLayoutMode as jest.Mock).mockReturnValue({ layoutMode: 'narrow' });
		(useResponsiveLayout as jest.Mock).mockReturnValue({ width: 375, height: 812 });
		useCallStore.getState().reset();
	});

	it('renders all 6 buttons', () => {
		setStoreState();
		const { getByTestId } = render(
			<Wrapper>
				<CallButtons />
			</Wrapper>
		);
		expect(getByTestId('call-view-speaker')).toBeTruthy();
		expect(getByTestId('call-view-hold')).toBeTruthy();
		expect(getByTestId('call-view-mute')).toBeTruthy();
		expect(getByTestId('call-view-message')).toBeTruthy();
		expect(getByTestId('call-view-end')).toBeTruthy();
		expect(getByTestId('call-view-dialpad')).toBeTruthy();
	});

	it('narrow layout renders 2 rows', () => {
		(useCallLayoutMode as jest.Mock).mockReturnValue({ layoutMode: 'narrow' });
		setStoreState();
		const { getByTestId } = render(
			<Wrapper>
				<CallButtons />
			</Wrapper>
		);
		expect(getByTestId('call-buttons-row-0')).toBeTruthy();
		expect(getByTestId('call-buttons-row-1')).toBeTruthy();
	});

	it('wide layout renders 1 row', () => {
		(useCallLayoutMode as jest.Mock).mockReturnValue({ layoutMode: 'wide' });
		setStoreState();
		const { getByTestId, queryByTestId } = render(
			<Wrapper>
				<CallButtons />
			</Wrapper>
		);
		expect(getByTestId('call-buttons-row-0')).toBeTruthy();
		expect(queryByTestId('call-buttons-row-1')).toBeNull();
	});

	it('narrow phone landscape renders 1 row', () => {
		(useCallLayoutMode as jest.Mock).mockReturnValue({ layoutMode: 'narrow' });
		(useResponsiveLayout as jest.Mock).mockReturnValue({ width: 600, height: 400 });
		setStoreState();
		const { getByTestId, queryByTestId } = render(
			<Wrapper>
				<CallButtons />
			</Wrapper>
		);
		expect(getByTestId('call-buttons-row-0')).toBeTruthy();
		expect(queryByTestId('call-buttons-row-1')).toBeNull();
	});

	it('button labels render', () => {
		setStoreState();
		const { getByText } = render(
			<Wrapper>
				<CallButtons />
			</Wrapper>
		);
		expect(getByText('Speaker')).toBeTruthy();
		expect(getByText('Hold')).toBeTruthy();
		expect(getByText('Mute')).toBeTruthy();
		expect(getByText('Message')).toBeTruthy();
		expect(getByText('End')).toBeTruthy();
		expect(getByText('Dialpad')).toBeTruthy();
	});

	it('speaker enabled but hold/mute/dialpad disabled when ringing', () => {
		setStoreState({ callState: 'ringing' });
		const { getByTestId } = render(
			<Wrapper>
				<CallButtons />
			</Wrapper>
		);
		expect(getByTestId('call-view-speaker').props.accessibilityState?.disabled).toBeFalsy();
		expect(getByTestId('call-view-hold').props.accessibilityState?.disabled).toBe(true);
		expect(getByTestId('call-view-mute').props.accessibilityState?.disabled).toBe(true);
		expect(getByTestId('call-view-dialpad').props.accessibilityState?.disabled).toBe(true);
	});

	it('mute toggle label shows Unmute when isMuted is true, Mute when false', () => {
		setStoreState({ isMuted: true });
		const { getByText, rerender } = render(
			<Wrapper>
				<CallButtons />
			</Wrapper>
		);
		expect(getByText('Unmute')).toBeTruthy();

		setStoreState({ isMuted: false });
		rerender(
			<Wrapper>
				<CallButtons />
			</Wrapper>
		);
		expect(getByText('Mute')).toBeTruthy();
	});

	it('end/cancel label shows Cancel when ringing, End when active', () => {
		setStoreState({ callState: 'ringing' });
		const { getByText, rerender } = render(
			<Wrapper>
				<CallButtons />
			</Wrapper>
		);
		expect(getByText('Cancel')).toBeTruthy();

		setStoreState({ callState: 'active' });
		rerender(
			<Wrapper>
				<CallButtons />
			</Wrapper>
		);
		expect(getByText('End')).toBeTruthy();
	});
});
