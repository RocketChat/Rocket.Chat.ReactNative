import React from 'react';
import { View } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import Button from '.';

const onPressMock = jest.fn();

const testProps = {
	title: 'Press me!',
	type: 'primary' as const,
	onPress: onPressMock,
	testID: 'testButton',
	initialText: 'Initial text',
	textAfterPress: 'Button pressed!'
};

const TestButton = ({ loading = false, disabled = false }) => (
	<View>
		<Button
			title={testProps.title}
			type={testProps.type}
			onPress={testProps.onPress}
			testID={testProps.testID}
			accessibilityLabel={testProps.title}
			disabled={disabled}
			loading={loading}
		/>
	</View>
);

describe('ButtonTests', () => {
	test('rendered', async () => {
		const { findByTestId } = render(<TestButton />);
		const Button = await findByTestId(testProps.testID);
		expect(Button).toBeTruthy();
	});

	test('rendered with correct title', async () => {
		const { findByText } = render(<TestButton />);
		const ButtonTitle = await findByText(testProps.title);
		expect(ButtonTitle).toBeTruthy();
		expect(ButtonTitle.props.children).toEqual(testProps.title);
	});

	test('find button using accessibilityLabel', async () => {
		const { getByLabelText } = render(<TestButton />);
		const Button = await getByLabelText(testProps.title);
		expect(Button).toBeTruthy();
	});

	test('title not visible while loading', async () => {
		const { queryByText } = render(<TestButton loading={true} />);
		const ButtonTitle = await queryByText(testProps.title);
		expect(ButtonTitle).toBeNull();
	});

	test('should not trigger onPress on disabled button', async () => {
		const { findByTestId } = render(<TestButton disabled={true} />);
		const Button = await findByTestId(testProps.testID);
		fireEvent.press(Button);
		expect(onPressMock).not.toHaveBeenCalled();
	});

	test('should trigger onPress function on button press', async () => {
		const { findByTestId } = render(<TestButton />);
		const Button = await findByTestId(testProps.testID);
		fireEvent.press(Button);
		expect(onPressMock).toHaveBeenCalled();
	});
});
