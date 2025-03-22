import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import Chip, { IChip } from '.';
import { ISelectedUser } from '../../reducers/selectedUsers';
import { mockedStore as store } from '../../reducers/mockedStore';

const onPressMock = jest.fn((item: any) => item);

const testChip = {
	testID: 'test-chip-id',
	item: { fname: 'rocket.chat', name: 'rocket.chat' } as ISelectedUser,
	onPress: onPressMock
};

const Render = ({ testID, text, avatar, onPress }: IChip) => (
	<Provider store={store}>
		<Chip testID={testID} text={text} onPress={onPress} avatar={avatar} />
	</Provider>
);

describe('Chips', () => {
	it('should render the Chip component', () => {
		const { findByTestId } = render(
			<Render
				text={testChip.item.fname}
				avatar={testChip.item.name}
				testID={testChip.testID}
				onPress={() => testChip.onPress(testChip.item)}
			/>
		);

		expect(findByTestId(testChip.testID)).toBeTruthy();
	});
	it("should not call onPress if it's not passed", async () => {
		const { findByTestId } = render(<Render text={testChip.item.fname} avatar={testChip.item.name} testID={testChip.testID} />);

		const component = await findByTestId(testChip.testID);
		fireEvent.press(component);
		expect(onPressMock).not.toHaveBeenCalled();
	});
	it('should tap Chip and return item', async () => {
		const { findByTestId } = render(
			<Render
				text={testChip.item.fname}
				avatar={testChip.item.name}
				testID={testChip.testID}
				onPress={() => testChip.onPress(testChip.item)}
			/>
		);

		const component = await findByTestId(testChip.testID);
		fireEvent.press(component);
		expect(onPressMock).toHaveBeenCalled();
		expect(onPressMock).toHaveReturnedWith(testChip.item);
	});
});
