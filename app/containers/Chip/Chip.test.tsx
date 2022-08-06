import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import Chip, { IChip } from '.';
import { ISelectedUser } from '../../reducers/selectedUsers';
import { TIconsName } from '../CustomIcon';
import { store } from '../../../storybook/stories';

const onPressMock = jest.fn((item: any) => item);

const testChip = {
	testID: 'test-chip-id',
	item: { fname: 'rocket.chat', name: 'rocket.chat' } as ISelectedUser,
	iconName: 'close' as TIconsName,
	onPress: onPressMock
};

const Render = ({ testID, item, text, avatar, iconName, onPress }: IChip) => (
	<Provider store={store}>
		<Chip testID={testID} item={item} text={text} onPress={onPress} avatar={avatar} iconName={iconName} />
	</Provider>
);

describe('Chips', () => {
	it('should render the searchbox component', () => {
		const { findByTestId } = render(
			<Render
				item={testChip.item}
				text={testChip.item.fname}
				avatar={testChip.item.name}
				iconName={testChip.iconName}
				testID={testChip.testID}
				onPress={testChip.onPress}
			/>
		);

		expect(findByTestId(testChip.testID)).toBeTruthy();
	});
	it('should press the component and return item', async () => {
		const { findByTestId } = render(
			<Render
				item={testChip.item}
				text={testChip.item.fname}
				avatar={testChip.item.name}
				iconName={testChip.iconName}
				testID={testChip.testID}
				onPress={testChip.onPress}
			/>
		);

		const component = await findByTestId(testChip.testID);
		fireEvent.press(component);
		expect(onPressMock).toHaveBeenCalled();
		expect(onPressMock).toHaveReturnedWith(testChip.item);
	});
});
