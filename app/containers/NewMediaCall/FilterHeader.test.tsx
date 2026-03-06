import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import I18n from '../../i18n';
import { usePeerAutocompleteStore } from '../../lib/services/voip/usePeerAutocompleteStore';
import { mockedStore } from '../../reducers/mockedStore';
import { textInputDebounceTime } from '../../lib/constants/debounceConfig';
import { FilterHeader } from './FilterHeader';
import * as stories from './FilterHeader.stories';
import { generateSnapshots } from '../../../.rnstorybook/generateSnapshots';

const Wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={mockedStore}>{children}</Provider>;

describe('FilterHeader', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.useFakeTimers();
		usePeerAutocompleteStore.getState().reset();
	});

	afterEach(() => {
		jest.runOnlyPendingTimers();
		jest.useRealTimers();
	});

	it('should render title, label and search input', () => {
		const { getByText, getByTestId } = render(
			<Wrapper>
				<FilterHeader />
			</Wrapper>
		);

		expect(getByText(I18n.t('New_call'))).toBeTruthy();
		expect(getByText(I18n.t('Enter_username_or_number'))).toBeTruthy();
		expect(getByTestId('new-media-call-search-input')).toBeTruthy();
	});

	it('should update filter, clear selection and fetch options after debounce', () => {
		const setFilter = jest.fn();
		const clearSelection = jest.fn();
		const fetchOptions = jest.fn();
		usePeerAutocompleteStore.setState({
			filter: '',
			selectedPeer: null,
			options: [],
			setFilter,
			clearSelection,
			fetchOptions
		});

		const { getByTestId } = render(
			<Wrapper>
				<FilterHeader />
			</Wrapper>
		);

		fireEvent.changeText(getByTestId('new-media-call-search-input'), 'alice');

		expect(setFilter).toHaveBeenCalledWith('alice');
		expect(clearSelection).toHaveBeenCalledTimes(1);
		expect(fetchOptions).not.toHaveBeenCalled();

		act(() => {
			jest.advanceTimersByTime(textInputDebounceTime);
		});

		expect(fetchOptions).toHaveBeenCalledWith('alice');
	});
});

generateSnapshots(stories);
