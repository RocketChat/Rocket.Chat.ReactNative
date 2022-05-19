import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import SearchBox, { ISearchBox } from '.';

const onCancelSearchMock = jest.fn();
const onChangeTextMock = jest.fn();

const testSearchInputs = {
	input: '',
	onCancelSearch: onCancelSearchMock,
	onChangeText: onChangeTextMock,
	testID: 'search-box-text-input'
};

const Render = ({ onCancelSearch, onChangeText, value, testID }: ISearchBox) => (
	<SearchBox onCancelSearch={onCancelSearch} value={value} testID={testID} onChangeText={onChangeText} />
);

describe('SearchBox', () => {
	it('should render the searchbox component', () => {
		const { findByTestId } = render(
			<Render
				onCancelSearch={testSearchInputs.onCancelSearch}
				onChangeText={testSearchInputs.onChangeText}
				value={testSearchInputs.input}
				testID={testSearchInputs.testID}
			/>
		);

		expect(findByTestId('searchbox')).toBeTruthy();
	});
	it('should not render clear-input icon', async () => {
		const { queryByTestId } = render(
			<Render
				onCancelSearch={testSearchInputs.onCancelSearch}
				onChangeText={testSearchInputs.onChangeText}
				value={testSearchInputs.input}
				testID={testSearchInputs.testID}
			/>
		);
		const clearInput = await queryByTestId('searchbox-clear');
		expect(clearInput).toBeNull();
	});

	it('should input new value with onChangeText function', async () => {
		const { findByTestId } = render(
			<Render
				onCancelSearch={testSearchInputs.onCancelSearch}
				value={testSearchInputs.input}
				testID={testSearchInputs.testID}
				onChangeText={onChangeTextMock}
			/>
		);

		const component = await findByTestId(testSearchInputs.testID);
		fireEvent.changeText(component, 'new-input-value');
		expect(onChangeTextMock).toHaveBeenCalledWith('new-input-value');
	});

	it('should clear input when call onCancelSearch function', async () => {
		const inputValue = 'input-with-value';
		const { findByTestId } = render(
			<Render
				onCancelSearch={testSearchInputs.onCancelSearch}
				value={inputValue}
				testID={'input-with-value'}
				onChangeText={onCancelSearchMock}
			/>
		);

		const component = await findByTestId('searchbox-clear');
		fireEvent.press(component, '');
		expect(onCancelSearchMock).toHaveBeenCalledWith('');
	});
});
