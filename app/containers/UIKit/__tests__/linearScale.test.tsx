import { fireEvent, render } from '@testing-library/react-native';

import { LinearScale } from '../LinearScale';
import { type IElement } from '../interfaces';

const element = {
	type: 'linear_scale',
	actionId: 'scale',
	minValue: 1,
	maxValue: 3,
	preLabel: { type: 'plain_text', text: 'Bad' },
	postLabel: { type: 'plain_text', text: 'Good' }
} as unknown as IElement;

describe('LinearScale', () => {
	it('renders one step per value in range with edge labels', () => {
		const { getByText, getByTestId } = render(
			<LinearScale element={element} value={undefined as any} action={jest.fn()} loading={false} />
		);
		expect(getByText('Bad')).toBeTruthy();
		expect(getByText('Good')).toBeTruthy();
		expect(getByTestId('linear-scale-1')).toBeTruthy();
		expect(getByTestId('linear-scale-2')).toBeTruthy();
		expect(getByTestId('linear-scale-3')).toBeTruthy();
	});

	it('sends the tapped step', () => {
		const action = jest.fn();
		const { getByTestId } = render(<LinearScale element={element} value={undefined as any} action={action} loading={false} />);
		fireEvent.press(getByTestId('linear-scale-2'));
		expect(action).toHaveBeenCalledWith({ value: 2 });
	});

	it('keeps the tapped step highlighted without a server echo', () => {
		const { getByTestId } = render(<LinearScale element={element} value={undefined as any} action={jest.fn()} loading={false} />);
		fireEvent.press(getByTestId('linear-scale-2'));
		expect(getByTestId('linear-scale-2').props.accessibilityState).toMatchObject({ selected: true });
	});

	it('does not resend the selected step', () => {
		const action = jest.fn();
		const { getByTestId } = render(<LinearScale element={element} value={2} action={action} loading={false} />);
		fireEvent.press(getByTestId('linear-scale-2'));
		expect(action).not.toHaveBeenCalled();
	});

	it('wraps ranges longer than five steps into multiple rows', () => {
		const wide = { ...element, minValue: 0, maxValue: 10 } as unknown as IElement;
		const { getByTestId } = render(<LinearScale element={wide} value={undefined as any} action={jest.fn()} loading={false} />);
		expect(getByTestId('linear-scale-0')).toBeTruthy();
		expect(getByTestId('linear-scale-5')).toBeTruthy();
		expect(getByTestId('linear-scale-10')).toBeTruthy();
	});
});
