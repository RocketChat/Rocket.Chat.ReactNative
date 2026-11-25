import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { RadioButton } from '../RadioButton';
import { type IElement } from '../interfaces';

const element: IElement = {
	type: 'radio_button',
	actionId: 'forwarding',
	options: [
		{ text: { type: 'plain_text', text: 'Active' }, value: 'active' },
		{ text: { type: 'plain_text', text: 'Inactive' }, value: 'inactive' }
	]
};

describe('UIKit RadioButton', () => {
	test('moves the selection to the pressed option', async () => {
		const onChange = jest.fn().mockResolvedValue(true);
		render(<RadioButton element={element} value='inactive' loading={false} onChange={onChange} />);

		await act(() => fireEvent.press(screen.getByTestId('uikit-radio-forwarding-active')));

		expect(onChange).toHaveBeenCalledWith({ value: 'active' });
		expect(screen.getByTestId('uikit-radio-forwarding-active')).toBeChecked();
		expect(screen.getByTestId('uikit-radio-forwarding-inactive')).not.toBeChecked();
	});

	test('sends the action again when the selected option is pressed, so a failed action can be retried', async () => {
		const onChange = jest.fn().mockResolvedValue(true);
		render(<RadioButton element={element} value='inactive' loading={false} onChange={onChange} />);

		await act(() => fireEvent.press(screen.getByTestId('uikit-radio-forwarding-inactive')));

		expect(onChange).toHaveBeenCalledWith({ value: 'inactive' });
	});

	test('restores the previous selection when the action fails', async () => {
		const onChange = jest.fn().mockResolvedValue(false);
		render(<RadioButton element={element} value='inactive' loading={false} onChange={onChange} />);

		await act(() => fireEvent.press(screen.getByTestId('uikit-radio-forwarding-active')));

		expect(onChange).toHaveBeenCalledWith({ value: 'active' });
		expect(screen.getByTestId('uikit-radio-forwarding-inactive')).toBeChecked();
		expect(screen.getByTestId('uikit-radio-forwarding-active')).not.toBeChecked();
	});

	test('shows a new value from props over the local selection', async () => {
		const threeOptions: IElement = {
			...element,
			options: [...(element.options ?? []), { text: { type: 'plain_text', text: 'Busy' }, value: 'busy' }]
		};
		const onChange = jest.fn().mockResolvedValue(true);
		const { rerender } = render(<RadioButton element={threeOptions} value='inactive' loading={false} onChange={onChange} />);

		await act(() => fireEvent.press(screen.getByTestId('uikit-radio-forwarding-active')));
		rerender(<RadioButton element={threeOptions} value='busy' loading={false} onChange={onChange} />);

		expect(screen.getByTestId('uikit-radio-forwarding-busy')).toBeChecked();
		expect(screen.getByTestId('uikit-radio-forwarding-active')).not.toBeChecked();
	});

	test('keeps a value from props that arrives while a failing action is pending', async () => {
		const threeOptions: IElement = {
			...element,
			options: [...(element.options ?? []), { text: { type: 'plain_text', text: 'Busy' }, value: 'busy' }]
		};
		let resolveAction: (succeeded: boolean) => void = () => {};
		const onChange = jest.fn(() => new Promise<boolean>(resolve => (resolveAction = resolve)));
		const { rerender } = render(<RadioButton element={threeOptions} value='inactive' loading={false} onChange={onChange} />);

		fireEvent.press(screen.getByTestId('uikit-radio-forwarding-active'));
		rerender(<RadioButton element={threeOptions} value='busy' loading={false} onChange={onChange} />);
		await act(() => resolveAction(false));

		expect(screen.getByTestId('uikit-radio-forwarding-busy')).toBeChecked();
		expect(screen.getByTestId('uikit-radio-forwarding-inactive')).not.toBeChecked();
	});

	test('does not change the selection while loading', () => {
		const onChange = jest.fn().mockResolvedValue(true);
		render(<RadioButton element={element} value='inactive' loading onChange={onChange} />);

		fireEvent.press(screen.getByTestId('uikit-radio-forwarding-active'));

		expect(onChange).not.toHaveBeenCalled();
		const selected = screen.getByTestId('uikit-radio-forwarding-inactive');
		expect(selected).toBeChecked();
		expect(selected).toBeDisabled();
	});
});
