import { act, render, fireEvent } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { type ReactNode } from 'react';

import CallerInfo from './CallerInfo';
import { useCallStore } from '~/lib/services/voip/useCallStore';
import { mockedStore } from '~/reducers/mockedStore';
import * as stories from './CallerInfo.stories';
import { generateSnapshots } from '~/.rnstorybook/generateSnapshots';
import { joinEscalatedConference } from '~/lib/services/voip/conferenceEscalation';

jest.mock('~/lib/services/voip/conferenceEscalation', () => ({ joinEscalatedConference: jest.fn() }));

const mockCallStartTime = 1713340800000;

// Helper to set store state for tests
const setStoreState = (contact: { displayName?: string; username?: string; sipExtension?: string }) => {
	useCallStore.setState({
		contact,
		call: {} as any,
		callId: 'test-id',
		callState: 'active',
		isMuted: false,
		isOnHold: false,
		isSpeakerOn: false,
		callStartTime: mockCallStartTime
	});
};

const Wrapper = ({ children }: { children: ReactNode }) => <Provider store={mockedStore}>{children}</Provider>;

describe('CallerInfo', () => {
	beforeEach(() => {
		useCallStore.getState().reset();
	});

	afterAll(() => {
		useCallStore.getState().reset();
	});

	it('should render with display name', () => {
		setStoreState({ displayName: 'Bob Burnquist', username: 'bob.burnquist', sipExtension: '2244' });
		const { getByTestId, getByText } = render(
			<Wrapper>
				<CallerInfo />
			</Wrapper>
		);

		expect(getByTestId('caller-info-toggle')).toBeTruthy();
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

	it('should toggle controlsVisible when pressing caller-info-toggle', () => {
		setStoreState({ displayName: 'Bob Burnquist', username: 'bob.burnquist' });
		const { getByTestId } = render(
			<Wrapper>
				<CallerInfo />
			</Wrapper>
		);

		expect(useCallStore.getState().controlsVisible).toBe(true);
		fireEvent.press(getByTestId('caller-info-toggle'));
		expect(useCallStore.getState().controlsVisible).toBe(false);
		fireEvent.press(getByTestId('caller-info-toggle'));
		expect(useCallStore.getState().controlsVisible).toBe(true);
	});

	it('offers to join the video call once the peer escalated it', () => {
		setStoreState({ displayName: 'Bob Burnquist' });
		const { queryByTestId, getByTestId } = render(
			<Wrapper>
				<CallerInfo />
			</Wrapper>
		);
		expect(queryByTestId('call-view-escalated')).toBeNull();

		act(() => useCallStore.getState().markEscalated('test-id'));
		fireEvent.press(getByTestId('call-view-join-video'));
		expect(joinEscalatedConference).toHaveBeenCalledTimes(1);
	});
});

generateSnapshots(stories);
