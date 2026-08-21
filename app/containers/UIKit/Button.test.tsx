import { fireEvent, render } from '@testing-library/react-native';

import UIKitButton from './Button';
import * as stories from './Button.stories';
import { generateSnapshots } from '../../../.rnstorybook/generateSnapshots';

const onPressMock = jest.fn();

const testProps = {
	title: 'Press me!',
	onPress: onPressMock
};

describe('UIKitButtonTests', () => {
	beforeEach(() => {
		onPressMock.mockClear();
	});

	test('rendered with correct title', async () => {
		const { findByText } = render(<UIKitButton {...testProps} />);
		const buttonTitle = await findByText(testProps.title);
		expect(buttonTitle).toBeTruthy();
		expect(buttonTitle.props.children).toEqual(testProps.title);
	});

	test('find button using accessibilityLabel', () => {
		const { getByLabelText } = render(<UIKitButton {...testProps} />);
		const button = getByLabelText(testProps.title);
		expect(button).toBeTruthy();
	});

	test('renders secondary variant with the same title', async () => {
		const { findByText } = render(<UIKitButton {...testProps} type='secondary' />);
		const buttonTitle = await findByText(testProps.title);
		expect(buttonTitle).toBeTruthy();
	});

	test('title not visible while loading', () => {
		const { queryByText } = render(<UIKitButton {...testProps} loading />);
		const buttonTitle = queryByText(testProps.title);
		expect(buttonTitle).toBeNull();
	});

	test('onPress is not triggered while loading', () => {
		const { getByLabelText } = render(<UIKitButton {...testProps} loading />);
		const button = getByLabelText(testProps.title);
		fireEvent.press(button);
		expect(onPressMock).not.toHaveBeenCalled();
	});

	test('should trigger onPress function on button press', () => {
		const { getByLabelText } = render(<UIKitButton {...testProps} />);
		const button = getByLabelText(testProps.title);
		fireEvent.press(button);
		expect(onPressMock).toHaveBeenCalled();
	});
});

generateSnapshots(stories);
