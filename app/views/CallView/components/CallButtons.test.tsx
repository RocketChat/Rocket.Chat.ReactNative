import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import { mockedStore } from '../../../reducers/mockedStore';
import { useCallStore } from '../../../lib/services/voip/useCallStore';
import { navigateToCallRoom } from '../../../lib/services/voip/navigateToCallRoom';
import { CallButtons } from './CallButtons';

jest.mock('../../../lib/services/voip/navigateToCallRoom', () => ({
	navigateToCallRoom: jest.fn().mockResolvedValue(undefined)
}));

const mockShowActionSheetRef = jest.fn();
jest.mock('../../../containers/ActionSheet', () => ({
	showActionSheetRef: (options: any) => mockShowActionSheetRef(options),
	hideActionSheetRef: jest.fn()
}));

const mockNavigateToCallRoom = jest.mocked(navigateToCallRoom);

const Wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={mockedStore}>{children}</Provider>;

describe('CallButtons', () => {
	beforeEach(() => {
		useCallStore.getState().reset();
		jest.clearAllMocks();
		useCallStore.setState({
			call: { state: 'active', contact: {} } as any,
			callState: 'active',
			callId: 'id',
			isMuted: false,
			isOnHold: false,
			isSpeakerOn: false,
			roomId: 'rid-1',
			contact: { username: 'u', sipExtension: '', displayName: 'U' },
			toggleMute: jest.fn(),
			toggleHold: jest.fn(),
			toggleSpeaker: jest.fn(),
			endCall: jest.fn()
		});
	});

	it('should set pointerEvents to none when controlsVisible is false', () => {
		useCallStore.setState({ controlsVisible: false });
		const { getByTestId } = render(
			<Wrapper>
				<CallButtons />
			</Wrapper>
		);

		const container = getByTestId('call-buttons');
		expect(container.props.pointerEvents).toBe('none');
	});

	it('should set pointerEvents to auto when controlsVisible is true', () => {
		useCallStore.setState({ controlsVisible: true });
		const { getByTestId } = render(
			<Wrapper>
				<CallButtons />
			</Wrapper>
		);

		const container = getByTestId('call-buttons');
		expect(container.props.pointerEvents).toBe('auto');
	});

	it('message button calls navigateToCallRoom when enabled', () => {
		const { getByTestId } = render(
			<Wrapper>
				<CallButtons />
			</Wrapper>
		);
		fireEvent.press(getByTestId('call-view-message'));
		expect(mockNavigateToCallRoom).toHaveBeenCalledTimes(1);
	});

	it('message button is disabled for SIP calls', () => {
		useCallStore.setState({
			contact: { username: 'u', sipExtension: '100', displayName: 'U' }
		});
		const { getByTestId } = render(
			<Wrapper>
				<CallButtons />
			</Wrapper>
		);
		fireEvent.press(getByTestId('call-view-message'));
		expect(mockNavigateToCallRoom).not.toHaveBeenCalled();
	});

	it('message button is disabled when roomId is null', () => {
		useCallStore.setState({ roomId: null });
		const { getByTestId } = render(
			<Wrapper>
				<CallButtons />
			</Wrapper>
		);
		fireEvent.press(getByTestId('call-view-message'));
		expect(mockNavigateToCallRoom).not.toHaveBeenCalled();
	});
});
