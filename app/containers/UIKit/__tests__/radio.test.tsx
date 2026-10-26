import { fireEvent, render } from '@testing-library/react-native';

import { RadioButton } from '../RadioButton';
import { type IElement } from '../interfaces';

const element = {
	type: 'radio_button',
	actionId: 'radio',
	options: [
		{ text: { type: 'plain_text', text: 'First' }, value: 'one' },
		{ text: { type: 'plain_text', text: 'Second' }, value: 'two' }
	]
} as unknown as IElement;

describe('RadioButton', () => {
	it('sends the single selected value on press', () => {
		const action = jest.fn();
		const { getByTestId } = render(<RadioButton element={element} value={undefined} action={action} loading={false} />);
		fireEvent.press(getByTestId('radio-two'));
		expect(action).toHaveBeenCalledWith({ value: 'two' });
	});

	it('does not resend the already selected value', () => {
		const action = jest.fn();
		const { getByTestId } = render(<RadioButton element={element} value='one' action={action} loading={false} />);
		fireEvent.press(getByTestId('radio-one'));
		expect(action).not.toHaveBeenCalled();
	});
});
