import { fireEvent, render } from '@testing-library/react-native';

import { ToggleSwitch } from '../ToggleSwitch';
import { type IElement } from '../interfaces';

const element = {
	type: 'toggle_switch',
	actionId: 'toggle',
	options: [{ text: { type: 'plain_text', text: 'Notify me' }, value: 'notify' }]
} as unknown as IElement;

describe('ToggleSwitch', () => {
	it('adds the value when switched on', () => {
		const action = jest.fn();
		const { getByTestId } = render(<ToggleSwitch element={element} value={[]} action={action} loading={false} />);
		fireEvent(getByTestId('toggle-notify'), 'onValueChange', true);
		expect(action).toHaveBeenCalledWith({ value: ['notify'] });
	});

	it('removes the value when switched off', () => {
		const action = jest.fn();
		const { getByTestId } = render(<ToggleSwitch element={element} value={['notify']} action={action} loading={false} />);
		fireEvent(getByTestId('toggle-notify'), 'onValueChange', false);
		expect(action).toHaveBeenCalledWith({ value: [] });
	});
});
