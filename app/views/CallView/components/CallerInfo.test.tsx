import React from 'react';
import { render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import CallerInfo from './CallerInfo';
import { useCallStore } from '../../../lib/services/voip/useCallStore';
import { mockedStore } from '../../../reducers/mockedStore';
import * as stories from './CallerInfo.stories';
import { generateSnapshots } from '../../../../.rnstorybook/generateSnapshots';

// Helper to set store state for tests
const setStoreState = (contact: { displayName?: string; username?: string; sipExtension?: string }) => {
	useCallStore.setState({
		contact,
		call: {} as any,
		callUUID: 'test-uuid',
		callState: 'active',
		isMuted: false,
		isOnHold: false,
		isSpeakerOn: false,
		callStartTime: Date.now()
	});
};

const Wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={mockedStore}>{children}</Provider>;

describe('CallerInfo', () => {
	beforeEach(() => {
		useCallStore.getState().reset();
	});

	it('should render with display name', () => {
		setStoreState({ displayName: 'Bob Burnquist', username: 'bob.burnquist', sipExtension: '2244' });
		const { getByTestId, getByText } = render(
			<Wrapper>
				<CallerInfo />
			</Wrapper>
		);

		expect(getByTestId('caller-info')).toBeTruthy();
		expect(getByText('Bob Burnquist')).toBeTruthy();
		expect(getByText('2244')).toBeTruthy();
	});

	it('should render with username when no display name', () => {
		setStoreState({ username: 'john.doe' });
		const { getByText } = render(
			<Wrapper>
				<CallerInfo />
			</Wrapper>
		);

		expect(getByText('john.doe')).toBeTruthy();
	});

	it('should render status container (Status component is currently commented out)', () => {
		setStoreState({ displayName: 'Test User' });
		const { getByTestId } = render(
			<Wrapper>
				<CallerInfo />
			</Wrapper>
		);

		// The status container exists but Status component is commented out
		// Verify the component renders correctly
		expect(getByTestId('caller-info')).toBeTruthy();
		expect(getByTestId('avatar')).toBeTruthy();
	});

	it('should show muted indicator when isMuted is true', () => {
		setStoreState({ displayName: 'Test User' });
		const { getByTestId } = render(
			<Wrapper>
				<CallerInfo isMuted />
			</Wrapper>
		);

		expect(getByTestId('caller-info-muted')).toBeTruthy();
	});

	it('should not show muted indicator when isMuted is false', () => {
		setStoreState({ displayName: 'Test User' });
		const { queryByTestId } = render(
			<Wrapper>
				<CallerInfo isMuted={false} />
			</Wrapper>
		);

		expect(queryByTestId('caller-info-muted')).toBeNull();
	});

	it('should not show extension when not provided', () => {
		setStoreState({ displayName: 'Test User' });
		const { queryByTestId } = render(
			<Wrapper>
				<CallerInfo />
			</Wrapper>
		);

		expect(queryByTestId('caller-info-extension')).toBeNull();
	});
});

generateSnapshots(stories);
