import { Pressable, Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { NativeListContext } from '../../native/context';
import ListItem from '../ListItem';

jest.mock('~/lib/hooks/useResponsiveLayout/useResponsiveLayout', () => ({ useResponsiveLayout: () => ({ fontScale: 1 }) }));

describe('List.Item in a native list', () => {
	it('lets an interactive right control take the press instead of the row', () => {
		const onRowPress = jest.fn();
		const onControlPress = jest.fn();
		render(
			<NativeListContext.Provider value={{ sectionIndex: 0 }}>
				<ListItem
					title='Autoplay GIFs'
					translateTitle={false}
					onPress={onRowPress}
					right={() => <Pressable testID='control' onPress={onControlPress} />}
					interactiveRight
				/>
			</NativeListContext.Provider>
		);

		fireEvent.press(screen.getByTestId('control', { includeHiddenElements: true }));

		expect(onControlPress).toHaveBeenCalledTimes(1);
		expect(onRowPress).not.toHaveBeenCalled();
	});

	it('presses the row when its title is pressed next to an interactive right control', () => {
		const onRowPress = jest.fn();
		render(
			<NativeListContext.Provider value={{ sectionIndex: 0 }}>
				<ListItem
					title='Autoplay GIFs'
					translateTitle={false}
					onPress={onRowPress}
					right={() => <Pressable testID='control' />}
					interactiveRight
				/>
			</NativeListContext.Provider>
		);

		fireEvent.press(screen.getByText('Autoplay GIFs'));

		expect(onRowPress).toHaveBeenCalledTimes(1);
	});

	it('presses the row when a passive right element is pressed', () => {
		const onRowPress = jest.fn();
		render(
			<NativeListContext.Provider value={{ sectionIndex: 0 }}>
				<ListItem title='Language' translateTitle={false} onPress={onRowPress} right={() => <Text>English</Text>} />
			</NativeListContext.Provider>
		);

		fireEvent.press(screen.getByText('English'));

		expect(onRowPress).toHaveBeenCalledTimes(1);
	});
});
