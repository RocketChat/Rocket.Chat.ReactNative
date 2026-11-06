import { render } from '@testing-library/react-native';
import { BlockContext } from '@rocket.chat/ui-kit';

import { TimePicker } from '../TimePicker';
import { type IElement } from '../interfaces';

const element = {
	type: 'time_picker',
	actionId: 'time',
	placeholder: { type: 'plain_text', text: 'Pick a time' }
} as unknown as IElement;

describe('TimePicker', () => {
	it('shows the placeholder when no time is set', () => {
		const { getByText } = render(
			<TimePicker
				element={element}
				language='en'
				action={jest.fn()}
				context={BlockContext.FORM}
				loading={false}
				value=''
				error=''
			/>
		);
		expect(getByText('Pick a time')).toBeTruthy();
	});

	it('shows the initial time instead of the placeholder', () => {
		const timedElement = { ...element, initialTime: '12:00' } as IElement;
		const { queryByText } = render(
			<TimePicker
				element={timedElement}
				language='en'
				action={jest.fn()}
				context={BlockContext.FORM}
				loading={false}
				value=''
				error=''
			/>
		);
		expect(queryByText('Pick a time')).toBeNull();
	});
});
