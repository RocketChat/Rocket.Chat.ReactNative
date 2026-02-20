import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import Dialpad from './Dialpad';
import { useCallStore } from '../../../../lib/services/voip/useCallStore';
import { mockedStore } from '../../../../reducers/mockedStore';
import * as stories from './Dialpad.stories';
import { generateSnapshots } from '../../../../../.rnstorybook/generateSnapshots';

jest.mock('react-native-incall-manager', () => ({
	start: jest.fn(),
	stop: jest.fn(),
	setForceSpeakerphoneOn: jest.fn(() => Promise.resolve())
}));

const sendDTMFMock = jest.fn();

// Helper to set store state for tests
const setStoreState = (overrides: Partial<ReturnType<typeof useCallStore.getState>> = {}) => {
	const mockCall = {
		state: 'active',
		muted: false,
		held: false,
		contact: {},
		sendDTMF: sendDTMFMock,
		emitter: { on: jest.fn(), off: jest.fn() }
	} as any;

	useCallStore.setState({
		call: mockCall,
		callUUID: 'test-uuid',
		callState: 'active',
		dialpadValue: '',
		...overrides
	});
};

const Wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={mockedStore}>{children}</Provider>;

describe('Dialpad', () => {
	beforeEach(() => {
		useCallStore.getState().reset();
		sendDTMFMock.mockClear();
	});

	it('should render correctly', () => {
		setStoreState();
		const { getByTestId } = render(
			<Wrapper>
				<Dialpad testID='dialpad' />
			</Wrapper>
		);
		expect(getByTestId('dialpad-input')).toBeTruthy();
	});

	it('should display the input field', () => {
		setStoreState();
		const { getByTestId } = render(
			<Wrapper>
				<Dialpad testID='dialpad' />
			</Wrapper>
		);
		expect(getByTestId('dialpad-input')).toBeTruthy();
	});

	it('should display dialpad buttons', () => {
		setStoreState();
		const { getByText } = render(
			<Wrapper>
				<Dialpad testID='dialpad' />
			</Wrapper>
		);
		expect(getByText('1')).toBeTruthy();
		expect(getByText('2')).toBeTruthy();
		expect(getByText('0')).toBeTruthy();
		expect(getByText('*')).toBeTruthy();
		expect(getByText('#')).toBeTruthy();
	});

	it('should call sendDTMF and update value when digit is pressed', () => {
		setStoreState();
		const { getByText } = render(
			<Wrapper>
				<Dialpad testID='dialpad' />
			</Wrapper>
		);

		fireEvent.press(getByText('5'));
		expect(sendDTMFMock).toHaveBeenCalledWith('5');
		expect(sendDTMFMock).toHaveBeenCalledTimes(1);

		fireEvent.press(getByText('2'));
		expect(sendDTMFMock).toHaveBeenCalledWith('2');
		expect(sendDTMFMock).toHaveBeenCalledTimes(2);
	});

	it('should display letters on keys that have them', () => {
		setStoreState();
		const { getByText } = render(
			<Wrapper>
				<Dialpad testID='dialpad' />
			</Wrapper>
		);
		expect(getByText('ABC')).toBeTruthy();
		expect(getByText('DEF')).toBeTruthy();
		expect(getByText('WXYZ')).toBeTruthy();
	});

	it('should render with custom testID', () => {
		setStoreState();
		const { getByTestId } = render(
			<Wrapper>
				<Dialpad testID='custom-dialpad' />
			</Wrapper>
		);
		expect(getByTestId('custom-dialpad-input')).toBeTruthy();
	});
});

generateSnapshots(stories);
