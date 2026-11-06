import { render } from '@testing-library/react-native';
import { type TextInput } from 'react-native';
import { type MutableRefObject } from 'react';

import CustomFields from '.';

const Accounts_CustomFields = JSON.stringify({
	Dienststelle: { type: 'select', options: ['Wache Nord', 'Wache Sued'], required: false },
	Personalnummer: { type: 'text', required: false }
});

const defaultProps = {
	Accounts_CustomFields,
	customFields: {},
	onCustomFieldChange: jest.fn(),
	customFieldsRef: { current: {} } as MutableRefObject<{ [key: string]: TextInput | undefined }>
};

describe('CustomFields', () => {
	it('renders a non-editable input for select fields so taps reach the picker', () => {
		const { getByTestId } = render(<CustomFields {...defaultProps} />);
		const input = getByTestId('custom-field-Dienststelle');
		expect(input.props.editable).toBe(false);
	});

	it('renders an editable input for text fields', () => {
		const { getByTestId } = render(<CustomFields {...defaultProps} />);
		const input = getByTestId('custom-field-Personalnummer');
		expect(input.props.editable).not.toBe(false);
	});
});
