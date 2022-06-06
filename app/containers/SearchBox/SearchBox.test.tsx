import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { TextInputProps } from 'react-native';

import SearchBox from '.';

const onChangeTextMock = jest.fn();

const testSearchInputs = {
	onChangeText: onChangeTextMock,
	testID: 'search-box-text-input'
};

const Render = ({ onChangeText, testID }: TextInputProps) => <SearchBox testID={testID} onChangeText={onChangeText} />;

describe('SearchBox', () => {
	it('should render the searchbox component', () => {
		const { findByTestId } = render(<Render onChangeText={testSearchInputs.onChangeText} testID={testSearchInputs.testID} />);

		expect(findByTestId('searchbox')).toBeTruthy();
	});
	it('should not render clear-input icon', async () => {
		const { queryByTestId } = render(<Render onChangeText={testSearchInputs.onChangeText} testID={testSearchInputs.testID} />);
		const clearInput = await queryByTestId('clear-text-input');
		expect(clearInput).toBeNull();
	});

	it('should input new value with onChangeText function', async () => {
		const { findByTestId } = render(<Render onChangeText={onChangeTextMock} testID={testSearchInputs.testID} />);

		const component = await findByTestId(testSearchInputs.testID);
		fireEvent.changeText(component, 'new-input-value');
		expect(onChangeTextMock).toHaveBeenCalledWith('new-input-value');
	});

	// we need skip this test for now, until discovery how handle with functions effect
	//  https://github.com/callstack/react-native-testing-library/issues/978
	it.skip('should clear input when call onCancelSearch function', async () => {
		const { findByTestId } = render(<Render testID={'input-with-value'} onChangeText={onChangeTextMock} />);

		const component = await findByTestId('clear-text-input');
		fireEvent.press(component, 'input-with-value');
		expect(onChangeTextMock).toHaveBeenCalledWith('input-with-value');
	});
});
