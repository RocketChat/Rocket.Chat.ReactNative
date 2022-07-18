import React from 'react';
import { render } from '@testing-library/react-native';

import { FormTextInput } from '.';

const FormTextInputID = 'form-text-input-id';

describe('FormTextInput', () => {
	test('should render the component', async () => {
		const { findByTestId } = render(<FormTextInput testID={FormTextInputID} />);
		const component = await findByTestId('form-text-input-id');
		expect(component).toBeTruthy();
	});

	test('should render the component with left icon', async () => {
		const { findByTestId } = render(<FormTextInput testID={FormTextInputID} iconLeft='user' />);
		const component = await findByTestId(`${FormTextInputID}-icon-left`);
		expect(component).toBeTruthy();
	});

	test('should render the component with right icon', async () => {
		const { findByTestId } = render(<FormTextInput testID={FormTextInputID} iconRight='user' />);
		const component = await findByTestId(`${FormTextInputID}-icon-right`);
		expect(component).toBeTruthy();
	});

	test('should render the component with password icon', async () => {
		const { findByTestId } = render(<FormTextInput testID={FormTextInputID} secureTextEntry />);
		const component = await findByTestId(`${FormTextInputID}-icon-password`);
		expect(component).toBeTruthy();
	});

	test('should render the component with loading', async () => {
		const { findByTestId } = render(<FormTextInput testID={FormTextInputID} loading />);
		const component = await findByTestId(`${FormTextInputID}-loading`);
		expect(component).toBeTruthy();
	});

	test('should render the component with label', async () => {
		const { findByText } = render(<FormTextInput testID={FormTextInputID} label='form text input' />);
		const component = await findByText('form text input');
		expect(component).toBeTruthy();
	});

	test('should render the component with error', async () => {
		const error = {
			reason: 'An error occurred'
		};

		const { findByText } = render(<FormTextInput testID={FormTextInputID} error={error} />);
		const component = await findByText(error.reason);
		expect(component).toBeTruthy();
	});
});
