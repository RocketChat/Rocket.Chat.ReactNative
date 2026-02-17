import React from 'react';
import { render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import CallerInfo from './CallerInfo';
import { useCallStore } from '../../../lib/services/voip/useCallStore';
import { mockedStore } from '../../../reducers/mockedStore';
import * as stories from './CallerInfo.stories';
import { generateSnapshots } from '../../../../.rnstorybook/generateSnapshots';

const mockCallStartTime = 1713340800000;

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
		callStartTime: mockCallStartTime
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
});

generateSnapshots(stories);
