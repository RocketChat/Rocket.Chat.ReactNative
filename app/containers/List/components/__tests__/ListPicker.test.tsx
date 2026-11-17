import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';

import ListPicker from '../ListPicker';
import { NativeListContext } from '~/containers/List/native/context';

const renderPicker = () => (
	<ListPicker
		title='Theme'
		testID='theme-picker'
		options={[{ label: 'Dark', value: 'dark' }]}
		selection='dark'
		onSelectionChange={jest.fn()}>
		<Text>row</Text>
	</ListPicker>
);

describe('ListPicker', () => {
	it('renders the native picker instead of its child inside a native list', async () => {
		await render(<NativeListContext.Provider value={{ sectionIndex: 0 }}>{renderPicker()}</NativeListContext.Provider>);
		expect(screen.getByTestId('theme-picker')).toBeTruthy();
		expect(screen.queryByText('row')).toBeNull();
	});

	it('renders its child outside a native list', async () => {
		await render(renderPicker());
		expect(screen.getByText('row')).toBeTruthy();
		expect(screen.queryByTestId('theme-picker')).toBeNull();
	});
});
