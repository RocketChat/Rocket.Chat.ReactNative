import { fireEvent, render } from '@testing-library/react-native';

import { Checkbox } from '../Checkbox';
import { type IElement } from '../interfaces';

const element = {
	type: 'checkbox',
	actionId: 'check',
	options: [
		{ text: { type: 'plain_text', text: 'First' }, value: 'one' },
		{
			text: { type: 'plain_text', text: 'Second' },
			value: 'two',
			description: { type: 'plain_text', text: 'Why pick this' }
		}
	]
} as unknown as IElement;

describe('Checkbox', () => {
	it('renders every option with its description', () => {
		const { getByText } = render(<Checkbox element={element} value={[]} action={jest.fn()} loading={false} />);
		expect(getByText('First')).toBeTruthy();
		expect(getByText('Second')).toBeTruthy();
		expect(getByText('Why pick this')).toBeTruthy();
	});

	it('adds the option value on press', () => {
		const action = jest.fn();
		const { getByTestId } = render(<Checkbox element={element} value={[]} action={action} loading={false} />);
		fireEvent.press(getByTestId('checkbox-one'));
		expect(action).toHaveBeenCalledWith({ value: ['one'] });
	});

	it('keeps the option checked without a server echo', () => {
		const { getByTestId } = render(<Checkbox element={element} value={[]} action={jest.fn()} loading={false} />);
		fireEvent.press(getByTestId('checkbox-one'));
		expect(getByTestId('checkbox-one').props.accessibilityLabel).toContain('. checked');
	});

	it('removes an already selected value on press', () => {
		const action = jest.fn();
		const { getByTestId } = render(<Checkbox element={element} value={['one']} action={action} loading={false} />);
		fireEvent.press(getByTestId('checkbox-one'));
		expect(action).toHaveBeenCalledWith({ value: [] });
	});

	it('does nothing while loading', () => {
		const action = jest.fn();
		const { getByTestId } = render(<Checkbox element={element} value={[]} action={action} loading />);
		fireEvent.press(getByTestId('checkbox-one'));
		expect(action).not.toHaveBeenCalled();
	});
});
