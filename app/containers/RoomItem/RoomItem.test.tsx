import { fireEvent, render, screen } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import { generateSnapshots } from '~/.rnstorybook/generateSnapshots';
import { DisplayMode } from '~/lib/constants/constantDisplayMode';
import { mockedStore } from '~/reducers/mockedStore';
import RoomItemContainer from '.';
import * as stories from './RoomItem.stories';

jest.unmock('~/lib/hooks/useResponsiveLayout/useResponsiveLayout');

generateSnapshots(stories);

const item = { rid: 'rid', t: 'c', name: 'general' };
const testID = 'rooms-list-view-item-general';

const renderRoomItem = (props: { swipeEnabled: boolean; onLongPress?: (item: any) => void }) =>
	render(
		<Provider store={mockedStore}>
			<RoomItemContainer
				item={item}
				onPress={jest.fn()}
				width={300}
				useRealName={false}
				showAvatar
				displayMode={DisplayMode.Expanded}
				getRoomTitle={() => 'general'}
				getRoomAvatar={() => ''}
				{...props}
			/>
		</Provider>
	);

describe('RoomItem accessibility actions', () => {
	it('does not expose showActions when the row has no long press', () => {
		renderRoomItem({ swipeEnabled: false });
		expect(screen.getByTestId(testID).props.accessibilityActions).toBeUndefined();
	});

	it('exposes showActions and calls a custom onLongPress', () => {
		const onLongPress = jest.fn();
		renderRoomItem({ swipeEnabled: false, onLongPress });
		const row = screen.getByTestId(testID);
		expect(row.props.accessibilityActions).toEqual([expect.objectContaining({ name: 'showActions' })]);
		fireEvent(row, 'accessibilityAction', { nativeEvent: { actionName: 'showActions' } });
		expect(onLongPress).toHaveBeenCalledWith(item);
	});
});
