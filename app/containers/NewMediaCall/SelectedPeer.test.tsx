import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import { SelectedPeer } from './SelectedPeer';
import { usePeerAutocompleteStore } from '../../lib/services/voip/usePeerAutocompleteStore';
import { mockedStore } from '../../reducers/mockedStore';
import type { TPeerItem } from '../../lib/services/voip/getPeerAutocompleteOptions';
import * as stories from './SelectedPeer.stories';
import { generateSnapshots } from '../../../.rnstorybook/generateSnapshots';

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

describe('SelectedPeer', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		usePeerAutocompleteStore.setState({ selectedPeer: null });
	});

	it('should return null when no peer is selected', () => {
		setStoreState(null);
		const { queryByTestId } = render(
			<Wrapper>
				<SelectedPeer />
			</Wrapper>
		);

		expect(queryByTestId('new-media-call-clear-selected-peer')).toBeNull();
	});

	it('should render selected user peer with label', () => {
		setStoreState(userPeer);
		const { getByTestId, getByText } = render(
			<Wrapper>
				<SelectedPeer />
			</Wrapper>
		);

		expect(getByTestId('new-media-call-clear-selected-peer')).toBeTruthy();
		expect(getByText('Alice Johnson')).toBeTruthy();
	});

	it('should render selected SIP peer with label', () => {
		setStoreState(sipPeer);
		const { getByTestId, getByText } = render(
			<Wrapper>
				<SelectedPeer />
			</Wrapper>
		);

		expect(getByTestId('new-media-call-clear-selected-peer')).toBeTruthy();
		expect(getByText('+55 11 99999-9999')).toBeTruthy();
	});

	it('should clear selected peer when clear button is pressed', () => {
		usePeerAutocompleteStore.setState({ selectedPeer: userPeer });

		const { getByTestId } = render(
			<Wrapper>
				<SelectedPeer />
			</Wrapper>
		);

		fireEvent.press(getByTestId('new-media-call-clear-selected-peer'));
		expect(usePeerAutocompleteStore.getState().selectedPeer).toBeNull();
	});
});

generateSnapshots(stories);
