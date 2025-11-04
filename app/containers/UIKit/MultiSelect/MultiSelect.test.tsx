import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { BlockContext } from '@rocket.chat/ui-kit';

import { MultiSelect } from './index';

jest.mock('../../../theme', () => ({
	useTheme: () => ({ colors: { fontTitlesLabels: 'black', fontSecondaryInfo: 'gray' } })
}));

jest.mock('@rocket.chat/ui-kit', () => ({
	BlockContext: {
		FORM: 'FORM',
		ACTION: 'ACTION'
	}
}));

jest.mock('../../ActionSheet', () => ({
	useActionSheet: () => ({
		showActionSheet: mockShowActionSheet,
		hideActionSheet: mockHideActionSheet
	})
}));

const mockShowActionSheet = jest.fn();
const mockHideActionSheet = jest.fn();

const options = [
	{ value: '1', text: { text: 'Option 1' } },
	{ value: '2', text: { text: 'Option 2' } }
];

describe('MultiSelect', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renders with default placeholder', () => {
		const { getByText } = render(<MultiSelect options={options} onChange={jest.fn()} />);
		expect(getByText('Search')).toBeTruthy();
	});

	it('opens ActionSheet when pressed (single select)', () => {
		const { getByText } = render(<MultiSelect options={options} onChange={jest.fn()} />);
		fireEvent.press(getByText('Search'));
		expect(mockShowActionSheet).toHaveBeenCalled();
	});

	it('renders multiselect button with count', () => {
		const { getByText } = render(<MultiSelect options={options} onChange={jest.fn()} multiselect />);
		expect(getByText('0 selecteds')).toBeTruthy();
	});

	it('calls onChange with single value when selecting in single mode', () => {
		const onChange = jest.fn();
		const { getByText } = render(<MultiSelect options={options} onChange={onChange} />);

		// simulate user selection through exposed method
		fireEvent.press(getByText('Search'));
		const instance: any = mockShowActionSheet.mock.calls[0][0].children.props;
		instance.onChange({ value: '1' });

		expect(onChange).toHaveBeenCalledWith({ value: '1' });
	});

	it('calls onChange with array when selecting in multi mode', async () => {
		const onChange = jest.fn();
		const { getByText } = render(<MultiSelect options={options} onChange={onChange} multiselect />);

		fireEvent.press(getByText('0 selecteds'));
		const instance: any = mockShowActionSheet.mock.calls[0][0].children.props;

		// simulate selecting first item
		instance.onChange({ value: ['1'] });

		await waitFor(() => {
			expect(onChange).toHaveBeenCalledWith({ value: ['1'] });
		});
	});

	it('renders with Chips in FORM context', () => {
		const { getByText } = render(<MultiSelect context={BlockContext.FORM} options={options} onChange={jest.fn()} />);
		expect(getByText('Search')).toBeTruthy();
	});

	it('does not allow selection when disabled', () => {
		const onChange = jest.fn();
		const { getByText } = render(
			<MultiSelect context={BlockContext.FORM} options={options} onChange={onChange} disabled value={[options[0]]} />
		);

		expect(getByText('Option 1')).toBeTruthy();

		const instance: any = getByText('Option 1').parent?.props;
		instance.onSelect?.(options[0]);

		expect(onChange).not.toHaveBeenCalled();
	});
});
