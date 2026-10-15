import { AccessibilityInfo } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { makeMutable } from 'react-native-reanimated';

import { DisplayMode } from '~/lib/constants/constantDisplayMode';
import { mockedStore } from '~/reducers/mockedStore';
import RoomItemContainer from '..';
import { openSwipeItem, settleSwipeRow } from '../utils/openSwipeItem';

const mockShowActionSheet = jest.fn();
jest.mock('../../ActionSheet', () => ({ useActionSheet: () => ({ showActionSheet: mockShowActionSheet }) }));
jest.unmock('~/lib/hooks/useResponsiveLayout/useResponsiveLayout');
jest.mock('~/lib/methods/helpers/externalInput', () => ({ isExternalKeyboardConnected: () => false }));

const item = { rid: 'rid', t: 'c', name: 'general' };
const testID = 'rooms-list-view-item-general';

const renderRoomItem = ({ swipeEnabled, onShowActions }: { swipeEnabled: boolean; onShowActions?: (item: unknown) => void }) =>
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
				swipeEnabled={swipeEnabled}
				onShowActions={onShowActions}
			/>
		</Provider>
	);

const fireShowActions = () =>
	fireEvent(screen.getByTestId(testID), 'accessibilityAction', { nativeEvent: { actionName: 'showActions' } });

describe('RoomItem accessibility actions', () => {
	beforeEach(() => mockShowActionSheet.mockClear());
	afterEach(() => {
		jest.restoreAllMocks();
		openSwipeItem.value = null;
	});

	it('does not expose showActions when the row has no long press', () => {
		renderRoomItem({ swipeEnabled: false });
		const { props } = screen.getByTestId(testID);
		expect(props.accessibilityActions).toBeUndefined();
	});

	it('exposes showActions and calls a custom onShowActions', () => {
		const onShowActions = jest.fn();
		renderRoomItem({ swipeEnabled: false, onShowActions });
		const { props } = screen.getByTestId(testID);
		expect(props.accessibilityActions).toEqual([expect.objectContaining({ name: 'showActions' })]);
		fireShowActions();
		expect(onShowActions).toHaveBeenCalledWith(item);
	});

	it('exposes showActions and opens the room actions sheet by default', () => {
		renderRoomItem({ swipeEnabled: true });
		expect(screen.getByTestId(testID).props.accessibilityActions).toEqual([expect.objectContaining({ name: 'showActions' })]);
		fireShowActions();
		expect(mockShowActionSheet).toHaveBeenCalledTimes(1);
	});

	it('closes a swiped-open row before opening the room actions sheet', () => {
		const row = { rid: 'rid', transX: makeMutable(0), rowOffSet: makeMutable(0) };
		settleSwipeRow(row, 80);
		renderRoomItem({ swipeEnabled: true });
		fireShowActions();
		expect(row.rowOffSet.value).toBe(0);
		expect(openSwipeItem.value).toBeNull();
		expect(mockShowActionSheet).toHaveBeenCalledTimes(1);
	});

	it('ignores a plain long press without a screen reader or external keyboard', async () => {
		jest.spyOn(AccessibilityInfo, 'isScreenReaderEnabled').mockResolvedValue(false);
		renderRoomItem({ swipeEnabled: true });
		await act(async () => {
			fireEvent(screen.getByTestId(testID), 'longPress');
		});
		expect(mockShowActionSheet).not.toHaveBeenCalled();
	});

	it('opens the room actions sheet on long press with a screen reader', async () => {
		jest.spyOn(AccessibilityInfo, 'isScreenReaderEnabled').mockResolvedValue(true);
		renderRoomItem({ swipeEnabled: true });
		await act(async () => {
			fireEvent(screen.getByTestId(testID), 'longPress');
		});
		expect(mockShowActionSheet).toHaveBeenCalledTimes(1);
	});
});
