import React from 'react';
import { fireEvent, render, within } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import { mockedStore } from '../../../reducers/mockedStore';
import { useCallStore } from '../../../lib/services/voip/useCallStore';
import { navigateToCallRoom } from '../../../lib/services/voip/navigateToCallRoom';
import { CallButtons } from './CallButtons';
import { useCallLayoutMode } from '../useCallLayoutMode';

jest.mock('../../../lib/services/voip/navigateToCallRoom', () => ({
	navigateToCallRoom: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../useCallLayoutMode', () => ({
	useCallLayoutMode: jest.fn(() => ({ layoutMode: 'narrow' }))
}));

const mockUseCallLayoutMode = jest.mocked(useCallLayoutMode);

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
		mockUseCallLayoutMode.mockReturnValue({ layoutMode: 'narrow' });
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

		const container = getByTestId('call-buttons', { includeHiddenElements: true });
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

	describe('layoutMode prop', () => {
		it('renders two button rows on narrow layout', () => {
			const { getByTestId } = render(
				<Wrapper>
					<CallButtons />
				</Wrapper>
			);
			expect(getByTestId('call-buttons-row-0')).toBeTruthy();
			expect(getByTestId('call-buttons-row-1')).toBeTruthy();
		});

		it('renders a single button row on wide layout', () => {
			mockUseCallLayoutMode.mockReturnValue({ layoutMode: 'wide' });
			const { getByTestId, queryByTestId } = render(
				<Wrapper>
					<CallButtons />
				</Wrapper>
			);
			expect(getByTestId('call-buttons-row-0')).toBeTruthy();
			expect(queryByTestId('call-buttons-row-1')).toBeNull();
		});

		it('renders all six action buttons regardless of layoutMode', () => {
			const ids = [
				'call-view-speaker',
				'call-view-hold',
				'call-view-mute',
				'call-view-message',
				'call-view-end',
				'call-view-dialpad'
			];
			(['narrow', 'wide'] as const).forEach(layoutMode => {
				mockUseCallLayoutMode.mockReturnValue({ layoutMode });
				const { getByTestId, unmount } = render(
					<Wrapper>
						<CallButtons />
					</Wrapper>
				);
				ids.forEach(id => expect(getByTestId(id)).toBeTruthy());
				unmount();
			});
		});

		it('places every action button inside row 0 on wide layout', () => {
			mockUseCallLayoutMode.mockReturnValue({ layoutMode: 'wide' });
			const { getByTestId } = render(
				<Wrapper>
					<CallButtons />
				</Wrapper>
			);
			const row0 = getByTestId('call-buttons-row-0');
			const ids = [
				'call-view-speaker',
				'call-view-hold',
				'call-view-mute',
				'call-view-message',
				'call-view-end',
				'call-view-dialpad'
			];
			ids.forEach(id => {
				expect(within(row0).getByTestId(id)).toBeTruthy();
			});
		});

		it('splits buttons across row 0 and row 1 on narrow layout', () => {
			const { getByTestId } = render(
				<Wrapper>
					<CallButtons />
				</Wrapper>
			);
			const row0 = getByTestId('call-buttons-row-0');
			const row1 = getByTestId('call-buttons-row-1');

			expect(within(row0).getByTestId('call-view-speaker')).toBeTruthy();
			expect(within(row0).getByTestId('call-view-hold')).toBeTruthy();
			expect(within(row0).getByTestId('call-view-mute')).toBeTruthy();
			expect(within(row1).getByTestId('call-view-message')).toBeTruthy();
			expect(within(row1).getByTestId('call-view-end')).toBeTruthy();
			expect(within(row1).getByTestId('call-view-dialpad')).toBeTruthy();
		});
	});
});
