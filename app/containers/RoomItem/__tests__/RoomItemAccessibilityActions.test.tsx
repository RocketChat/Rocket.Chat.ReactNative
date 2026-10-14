import { fireEvent, render, screen } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import { DisplayMode } from '~/lib/constants/constantDisplayMode';
import { mockedStore } from '~/reducers/mockedStore';
import RoomItemContainer from '..';

const mockShowActionSheet = jest.fn();
jest.mock('../../ActionSheet', () => ({ useActionSheet: () => ({ showActionSheet: mockShowActionSheet }) }));
jest.unmock('~/lib/hooks/useResponsiveLayout/useResponsiveLayout');

const item = { rid: 'rid', t: 'c', name: 'general' };
const testID = 'rooms-list-view-item-general';

const renderRoomItem = (props: { swipeEnabled: boolean; onLongPress?: (item: unknown) => void }) =>
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

const fireShowActions = () =>
	fireEvent(screen.getByTestId(testID), 'accessibilityAction', { nativeEvent: { actionName: 'showActions' } });

describe('RoomItem accessibility actions', () => {
	beforeEach(() => mockShowActionSheet.mockClear());

	it('does not expose showActions when the row has no long press', () => {
		renderRoomItem({ swipeEnabled: false });
		expect(screen.getByTestId(testID).props.accessibilityActions).toBeUndefined();
	});

	it('exposes showActions and calls a custom onLongPress', () => {
		const onLongPress = jest.fn();
		renderRoomItem({ swipeEnabled: false, onLongPress });
		expect(screen.getByTestId(testID).props.accessibilityActions).toEqual([expect.objectContaining({ name: 'showActions' })]);
		fireShowActions();
		expect(onLongPress).toHaveBeenCalledWith(item);
	});

	it('exposes showActions and opens the room actions sheet by default', () => {
		renderRoomItem({ swipeEnabled: true });
		expect(screen.getByTestId(testID).props.accessibilityActions).toEqual([expect.objectContaining({ name: 'showActions' })]);
		fireShowActions();
		expect(mockShowActionSheet).toHaveBeenCalledTimes(1);
	});
});
