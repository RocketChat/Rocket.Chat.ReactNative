import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import { PeerItem } from './PeerItem';
import { mockedStore } from '../../reducers/mockedStore';
import type { TPeerItem } from '../../lib/services/voip/getPeerAutocompleteOptions';
import * as stories from './PeerItem.stories';
import { generateSnapshots } from '../../../.rnstorybook/generateSnapshots';

const onSelectOptionMock = jest.fn();

const Wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={mockedStore}>{children}</Provider>;

const userItem: TPeerItem = {
	type: 'user',
	value: 'user-1',
	label: 'Alice Johnson',
	username: 'alice.johnson'
};

const sipItem: TPeerItem = {
	type: 'sip',
	value: '+5511999999999',
	label: '+55 11 99999-9999'
};

describe('PeerItem', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should render user option with correct testID', () => {
		const { getByTestId, getByText } = render(
			<Wrapper>
				<PeerItem item={userItem} onSelectOption={onSelectOptionMock} />
			</Wrapper>
		);

		expect(getByTestId('new-media-call-option-user-1')).toBeTruthy();
		expect(getByText('Alice Johnson')).toBeTruthy();
	});

	it('should render SIP option with correct testID', () => {
		const { getByTestId, getByText } = render(
			<Wrapper>
				<PeerItem item={sipItem} onSelectOption={onSelectOptionMock} />
			</Wrapper>
		);

		expect(getByTestId('new-media-call-option-+5511999999999')).toBeTruthy();
		expect(getByText('+55 11 99999-9999')).toBeTruthy();
	});

	it('should call onSelectOption with item when pressed', () => {
		const { getByTestId } = render(
			<Wrapper>
				<PeerItem item={userItem} onSelectOption={onSelectOptionMock} />
			</Wrapper>
		);

		fireEvent.press(getByTestId('new-media-call-option-user-1'));
		expect(onSelectOptionMock).toHaveBeenCalledTimes(1);
		expect(onSelectOptionMock).toHaveBeenCalledWith(userItem);
	});

	it('should call onSelectOption with SIP item when pressed', () => {
		const { getByTestId } = render(
			<Wrapper>
				<PeerItem item={sipItem} onSelectOption={onSelectOptionMock} />
			</Wrapper>
		);

		fireEvent.press(getByTestId('new-media-call-option-+5511999999999'));
		expect(onSelectOptionMock).toHaveBeenCalledTimes(1);
		expect(onSelectOptionMock).toHaveBeenCalledWith(sipItem);
	});
});

generateSnapshots(stories);
