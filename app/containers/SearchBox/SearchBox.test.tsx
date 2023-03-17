import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import SearchBox from '.';

const onChangeTextMock = jest.fn();

const testSearchInputs = {
	onChangeText: onChangeTextMock,
	testID: 'search-box-text-input'
};

describe('SearchBox', () => {
	it('should render the searchbox component', () => {
		const { findByTestId } = render(<SearchBox onChangeText={testSearchInputs.onChangeText} testID={testSearchInputs.testID} />);

		expect(findByTestId('searchbox')).toBeTruthy();
	});

	it('should not render clear-input icon', async () => {
		const { queryByTestId } = render(<SearchBox onChangeText={testSearchInputs.onChangeText} testID={testSearchInputs.testID} />);
		const clearInput = await queryByTestId('clear-text-input');
		expect(clearInput).toBeNull();
	});

	it('should input new value with onChangeText function', async () => {
		const { findByTestId } = render(<SearchBox onChangeText={onChangeTextMock} testID={testSearchInputs.testID} />);

		const component = await findByTestId(testSearchInputs.testID);
		fireEvent.changeText(component, 'new-input-value');
		expect(onChangeTextMock).toHaveBeenCalledWith('new-input-value');
	});

	it('should clear input when clear icon is pressed', async () => {
		const { findByTestId } = render(<SearchBox onChangeText={onChangeTextMock} testID={testSearchInputs.testID} />);

		const component = await findByTestId(testSearchInputs.testID);
		fireEvent.changeText(component, 'new-input-value');

		const clearTextInput = await findByTestId('clear-text-input');
		fireEvent.press(clearTextInput);
		expect(onChangeTextMock).toHaveBeenCalledWith('');
	});
});
