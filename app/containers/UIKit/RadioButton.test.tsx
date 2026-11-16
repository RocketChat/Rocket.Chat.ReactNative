import { fireEvent, render, screen } from '@testing-library/react-native';

import { RadioButton } from './RadioButton';
import { type IElement } from './interfaces';

const element: IElement = {
	type: 'radio_button',
	actionId: 'forwarding',
	options: [
		{ text: { type: 'plain_text', text: 'Active' }, value: 'active' },
		{ text: { type: 'plain_text', text: 'Inactive' }, value: 'inactive' }
	]
};

describe('UIKit RadioButton', () => {
	test('moves the selection to the pressed option', () => {
		const onChange = jest.fn();
		render(<RadioButton element={element} value='inactive' loading={false} onChange={onChange} />);

		fireEvent.press(screen.getByTestId('uikit-radio-forwarding-active'));

		expect(onChange).toHaveBeenCalledWith({ value: 'active' });
		expect(screen.getByLabelText('Active, Selected')).toBeTruthy();
		expect(screen.getByLabelText('Inactive, Unselected')).toBeTruthy();
	});

	test('does not change the selection while loading', () => {
		const onChange = jest.fn();
		render(<RadioButton element={element} value='inactive' loading onChange={onChange} />);

		fireEvent.press(screen.getByTestId('uikit-radio-forwarding-active'));

		expect(onChange).not.toHaveBeenCalled();
		expect(screen.getByLabelText('Inactive, Selected')).toBeTruthy();
	});
});
