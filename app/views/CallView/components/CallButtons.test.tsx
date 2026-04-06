import React from 'react';
import { render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import { CallButtons } from './CallButtons';
import { useCallStore } from '../../../lib/services/voip/useCallStore';
import { mockedStore } from '../../../reducers/mockedStore';

const mockShowActionSheetRef = jest.fn();
jest.mock('../../../containers/ActionSheet', () => ({
	showActionSheetRef: (options: any) => mockShowActionSheetRef(options),
	hideActionSheetRef: jest.fn()
}));

const setStoreState = (overrides: Partial<ReturnType<typeof useCallStore.getState>> = {}) => {
	useCallStore.setState({
		call: {} as any,
		callId: 'test-id',
		callState: 'active',
		isMuted: false,
		isOnHold: false,
		isSpeakerOn: false,
		callStartTime: Date.now(),
		contact: {
			displayName: 'Bob Burnquist',
			username: 'bob.burnquist',
			sipExtension: '2244'
		},
		...overrides
	});
};

const Wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={mockedStore}>{children}</Provider>;

describe('CallButtons', () => {
	beforeEach(() => {
		useCallStore.getState().reset();
		jest.clearAllMocks();
	});

	it('should set pointerEvents to none when controlsVisible is false', () => {
		setStoreState({ controlsVisible: false });
		const { getByTestId } = render(
			<Wrapper>
				<CallButtons />
			</Wrapper>
		);

		const container = getByTestId('call-buttons');
		expect(container.props.pointerEvents).toBe('none');
	});

	it('should set pointerEvents to auto when controlsVisible is true', () => {
		setStoreState({ controlsVisible: true });
		const { getByTestId } = render(
			<Wrapper>
				<CallButtons />
			</Wrapper>
		);

		const container = getByTestId('call-buttons');
		expect(container.props.pointerEvents).toBe('auto');
	});
});
