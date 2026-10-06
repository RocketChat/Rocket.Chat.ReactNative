import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';

import ListSection from '../ListSection';
import { NativeListContext } from '~/containers/List/native/context';

jest.mock('~/containers/List/native/components/Section', () => {
	const { Text: MockText } = jest.requireActual('react-native');
	return ({ title }: { title?: string }) => <MockText>{`native section ${title}`}</MockText>;
});

describe('ListSection', () => {
	it('renders as a native section inside a native list', async () => {
		await render(
			<NativeListContext.Provider value={{ mode: 'native', renderRow: row => row }}>
				<ListSection title='Calls' translateTitle={false}>
					<Text>row</Text>
				</ListSection>
			</NativeListContext.Provider>
		);
		expect(screen.getByText('native section Calls')).toBeTruthy();
		expect(screen.queryByText('row')).toBeNull();
	});

	it('renders its children outside a native list', async () => {
		await render(
			<ListSection>
				<Text>row</Text>
			</ListSection>
		);
		expect(screen.getByText('row')).toBeTruthy();
	});
});
