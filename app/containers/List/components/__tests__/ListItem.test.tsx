import { Pressable, Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import Switch from '~/containers/Switch';
import { NativeListContext } from '../../native/context';
import ListItem from '../ListItem';

jest.mock('~/lib/hooks/useResponsiveLayout/useResponsiveLayout', () => ({ useResponsiveLayout: () => ({ fontScale: 1 }) }));

type TElement = ReturnType<typeof screen.getByTestId>;

const touchResponderOf = (element: TElement) => {
	let node: TElement | null = element;
	while (node) {
		if (node.props.onStartShouldSetResponder?.()) {
			return node;
		}
		node = node.parent;
	}
	return null;
};

describe('List.Item in a native list', () => {
	it('lets a right control take the press instead of the row', () => {
		const onRowPress = jest.fn();
		const onControlPress = jest.fn();
		render(
			<NativeListContext.Provider value={{ sectionIndex: 0 }}>
				<ListItem
					title='Autoplay GIFs'
					translateTitle={false}
					onPress={onRowPress}
					right={() => <Pressable testID='control' onPress={onControlPress} />}
				/>
			</NativeListContext.Provider>
		);

		fireEvent.press(screen.getByTestId('control'));

		expect(onControlPress).toHaveBeenCalledTimes(1);
		expect(onRowPress).not.toHaveBeenCalled();
	});

	it('makes the toggle, not the pressable row, the touch responder', () => {
		render(
			<NativeListContext.Provider value={{ sectionIndex: 0 }}>
				<ListItem
					title='Autoplay GIFs'
					translateTitle={false}
					testID='row'
					onPress={jest.fn()}
					right={() => <Switch value={false} onValueChange={jest.fn()} testID='toggle' />}
				/>
			</NativeListContext.Provider>
		);

		expect(touchResponderOf(screen.getByTestId('toggle'))?.props.testID).not.toBe('row');
	});

	it('presses the row when its title is pressed', () => {
		const onRowPress = jest.fn();
		render(
			<NativeListContext.Provider value={{ sectionIndex: 0 }}>
				<ListItem
					title='Autoplay GIFs'
					translateTitle={false}
					onPress={onRowPress}
					right={() => <Pressable testID='control' />}
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
