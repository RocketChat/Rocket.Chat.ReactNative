import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import { CreateCall } from './CreateCall';
import { usePeerAutocompleteStore } from '../../lib/services/voip/usePeerAutocompleteStore';
import { mockedStore } from '../../reducers/mockedStore';
import type { TPeerItem } from '../../lib/services/voip/getPeerAutocompleteOptions';
import * as stories from './CreateCall.stories';
import { generateSnapshots } from '../../../.rnstorybook/generateSnapshots';

const mockStartCall = jest.fn();
const mockHideActionSheet = jest.fn();

jest.mock('../../lib/services/voip/MediaSessionInstance', () => {
	const instance = {};
	Object.defineProperty(instance, 'startCall', {
		value: (...args: unknown[]) => mockStartCall(...args),
		writable: false,
		configurable: false
	});
	return { mediaSessionInstance: instance };
});

jest.mock('../ActionSheet', () => ({
	...jest.requireActual('../ActionSheet'),
	hideActionSheetRef: () => mockHideActionSheet()
}));

const setStoreState = (selectedPeer: TPeerItem | null) => {
	usePeerAutocompleteStore.setState({ selectedPeer });
};

const Wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={mockedStore}>{children}</Provider>;

const userPeer: TPeerItem = {
	type: 'user',
	value: 'user-1',
	label: 'Alice Johnson',
	username: 'alice.johnson'
};

const sipPeer: TPeerItem = {
	type: 'sip',
	value: '+5511999999999',
	label: '+55 11 99999-9999'
};

describe('CreateCall', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		usePeerAutocompleteStore.setState({ selectedPeer: null });
	});

	it('should render the call button', () => {
		const { getByTestId } = render(
			<Wrapper>
				<CreateCall />
			</Wrapper>
		);

		expect(getByTestId('new-media-call-button')).toBeTruthy();
	});

	it('should be disabled when no peer is selected', () => {
		setStoreState(null);
		const { getByTestId } = render(
			<Wrapper>
				<CreateCall />
			</Wrapper>
		);

		const button = getByTestId('new-media-call-button');
		expect(button.props.accessibilityState?.disabled).toBe(true);
	});

	it('should not call startCall or hideActionSheet when disabled and pressed', () => {
		setStoreState(null);
		const { getByTestId } = render(
			<Wrapper>
				<CreateCall />
			</Wrapper>
		);

		fireEvent.press(getByTestId('new-media-call-button'));
		expect(mockStartCall).not.toHaveBeenCalled();
		expect(mockHideActionSheet).not.toHaveBeenCalled();
	});

	it('should be enabled when user peer is selected', () => {
		setStoreState(userPeer);
		const { getByTestId } = render(
			<Wrapper>
				<CreateCall />
			</Wrapper>
		);

		const button = getByTestId('new-media-call-button');
		expect(button.props.accessibilityState?.disabled).toBe(false);
	});

	it('should call startCall with user type when user peer is selected and pressed', async () => {
		setStoreState(userPeer);
		const { getByTestId } = render(
			<Wrapper>
				<CreateCall />
			</Wrapper>
		);

		fireEvent.press(getByTestId('new-media-call-button'));
		await act(() => Promise.resolve());
		expect(mockStartCall).toHaveBeenCalledTimes(1);
		expect(mockStartCall).toHaveBeenCalledWith('user-1', 'user');
		expect(mockHideActionSheet).toHaveBeenCalledTimes(1);
	});

	it('should call startCall when SIP peer is selected and pressed', async () => {
		setStoreState(sipPeer);
		const { getByTestId } = render(
			<Wrapper>
				<CreateCall />
			</Wrapper>
		);

		fireEvent.press(getByTestId('new-media-call-button'));
		await act(() => Promise.resolve());
		expect(mockStartCall).toHaveBeenCalledTimes(1);
		expect(mockStartCall).toHaveBeenCalledWith('+5511999999999', 'sip');
		expect(mockHideActionSheet).toHaveBeenCalledTimes(1);
	});
});

generateSnapshots(stories);
