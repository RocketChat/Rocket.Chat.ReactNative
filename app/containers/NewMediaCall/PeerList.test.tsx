import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import { PeerList } from './PeerList';
import { usePeerAutocompleteStore } from '../../lib/services/voip/usePeerAutocompleteStore';
import { mockedStore } from '../../reducers/mockedStore';
import type { TPeerItem } from '../../lib/services/voip/getPeerAutocompleteOptions';
import * as stories from './PeerList.stories';
import { generateSnapshots } from '../../../.rnstorybook/generateSnapshots';

const setStoreState = (options: TPeerItem[], selectedPeer: TPeerItem | null = null) => {
	usePeerAutocompleteStore.setState({ options, selectedPeer });
};

const Wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={mockedStore}>{children}</Provider>;

const mockOptions: TPeerItem[] = [
	{
		type: 'sip',
		value: '+5511988887777',
		label: '+55 11 98888-7777'
	},
	{
		type: 'user',
		value: 'user-1',
		label: 'Alice Johnson',
		username: 'alice.johnson'
	},
	{
		type: 'user',
		value: 'user-2',
		label: 'Bob Smith',
		username: 'bob.smith'
	}
];

describe('PeerList', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		usePeerAutocompleteStore.setState({ options: [], selectedPeer: null });
	});

	it('should render options when no peer selected', () => {
		setStoreState(mockOptions);
		const { getByTestId, getByText } = render(
			<Wrapper>
				<PeerList />
			</Wrapper>
		);

		expect(getByTestId('new-media-call-option-+5511988887777')).toBeTruthy();
		expect(getByTestId('new-media-call-option-user-1')).toBeTruthy();
		expect(getByTestId('new-media-call-option-user-2')).toBeTruthy();
		expect(getByText('Alice Johnson')).toBeTruthy();
		expect(getByText('Bob Smith')).toBeTruthy();
	});

	it('should return null when peer is selected', () => {
		setStoreState(mockOptions, mockOptions[1]);
		const { queryByTestId } = render(
			<Wrapper>
				<PeerList />
			</Wrapper>
		);

		expect(queryByTestId('new-media-call-option-user-1')).toBeNull();
	});

	it('should set selected peer, clear filter and fetch options when option is pressed', () => {
		const setSelectedPeer = jest.fn();
		const setFilter = jest.fn();
		const fetchOptions = jest.fn();
		usePeerAutocompleteStore.setState({
			options: mockOptions,
			selectedPeer: null,
			setSelectedPeer,
			setFilter,
			fetchOptions
		});

		const { getByTestId } = render(
			<Wrapper>
				<PeerList />
			</Wrapper>
		);

		fireEvent.press(getByTestId('new-media-call-option-user-1'));

		expect(setSelectedPeer).toHaveBeenCalledWith(
			expect.objectContaining({
				type: 'user',
				value: 'user-1',
				label: 'Alice Johnson',
				username: 'alice.johnson'
			})
		);
		expect(setFilter).toHaveBeenCalledWith('');
		expect(fetchOptions).toHaveBeenCalledWith('');
	});

	it('should pass sip item correctly when SIP option is pressed', () => {
		const setSelectedPeer = jest.fn();
		usePeerAutocompleteStore.setState({
			options: mockOptions,
			selectedPeer: null,
			setSelectedPeer,
			setFilter: jest.fn(),
			fetchOptions: jest.fn()
		});

		const { getByTestId } = render(
			<Wrapper>
				<PeerList />
			</Wrapper>
		);

		fireEvent.press(getByTestId('new-media-call-option-+5511988887777'));

		expect(setSelectedPeer).toHaveBeenCalledWith(
			expect.objectContaining({
				type: 'sip',
				value: '+5511988887777',
				label: '+55 11 98888-7777'
			})
		);
	});
});

generateSnapshots(stories);
