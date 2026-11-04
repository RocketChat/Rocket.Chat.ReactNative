import { AccessibilityInfo } from 'react-native';
import { act, render } from '@testing-library/react-native';
import { BehaviorSubject } from 'rxjs';

import RoomItemContainer from '..';
import { type TActionSheetOptions } from '../../ActionSheet';
import MoveToCategorySheet from '../../MoveToCategorySheet';

const mockShowActionSheet = jest.fn<void, [TActionSheetOptions]>();
let mockRoomItemProps: { onLongPress: () => Promise<void> };
let mockIsCustomCategoriesAvailable = true;

jest.mock('../RoomItem', () => (props: { onLongPress: () => Promise<void> }) => {
	mockRoomItemProps = props;
	return null;
});
jest.mock('../../ActionSheet', () => ({ useActionSheet: () => ({ showActionSheet: mockShowActionSheet }) }));
jest.mock('../../MoveToCategorySheet', () => {
	const MockMoveToCategorySheet = () => null;
	return MockMoveToCategorySheet;
});
jest.mock('~/lib/hooks/useAppSelector', () => ({ useAppSelector: () => '8.9.0' }));
jest.mock('~/views/RoomsListView/hooks/useSidebarCategories', () => ({
	useIsCustomCategoriesAvailable: () => mockIsCustomCategoriesAvailable
}));
jest.mock('~/lib/methods/toggleFav', () => ({ toggleFav: jest.fn() }));

const createRecord = (t: string) => {
	const record = {
		rid: 'rid',
		t,
		name: 'general',
		fname: 'general',
		open: true,
		archived: false,
		alert: false,
		unread: 0,
		tunread: [],
		observe: () => new BehaviorSubject<void>(undefined),
		asPlain: () => ({ ...record })
	};
	return record;
};

const longPressRow = async (t = 'c') => {
	render(
		<RoomItemContainer
			item={createRecord(t)}
			onPress={jest.fn()}
			width={300}
			username='user'
			useRealName={false}
			showLastMessage
			showAvatar
			displayMode='expanded'
			getRoomTitle={room => room.fname}
			getRoomAvatar={() => ''}
			getIsRead={() => true}
			swipeEnabled
		/>
	);
	await act(() => mockRoomItemProps.onLongPress());
	return mockShowActionSheet.mock.calls[0][0];
};

const optionTestIDs = (sheet: TActionSheetOptions) => sheet.options?.map(option => option.testID);

describe('RoomItemContainer long press with a screen reader', () => {
	beforeEach(() => {
		mockShowActionSheet.mockClear();
		mockIsCustomCategoriesAvailable = true;
		jest.spyOn(AccessibilityInfo, 'isScreenReaderEnabled').mockResolvedValue(true);
	});

	it('offers moving the room to a category instead of favoriting when categories are available', async () => {
		const sheet = await longPressRow();

		expect(optionTestIDs(sheet)).toEqual(['action-sheet-mark-unread', 'action-sheet-move-to-category', 'action-sheet-hide']);
	});

	it('opens the move sheet once the actions sheet has closed', async () => {
		const sheet = await longPressRow();
		const moveOption = sheet.options?.find(option => option.testID === 'action-sheet-move-to-category');
		expect(moveOption).toBeDefined();

		moveOption!.onPress();
		expect(mockShowActionSheet).toHaveBeenCalledTimes(1);
		sheet.onClose?.();

		expect(mockShowActionSheet).toHaveBeenCalledTimes(2);
		expect(mockShowActionSheet.mock.calls[1][0]).toMatchObject({
			children: { type: MoveToCategorySheet, props: { room: expect.objectContaining({ rid: 'rid' }) } },
			fullContainer: true
		});
	});

	it('does not open the move sheet when the actions sheet closes without picking it', async () => {
		const sheet = await longPressRow();

		sheet.onClose?.();

		expect(mockShowActionSheet).toHaveBeenCalledTimes(1);
	});

	it('keeps favoriting when categories are unavailable', async () => {
		mockIsCustomCategoriesAvailable = false;

		const sheet = await longPressRow();

		expect(optionTestIDs(sheet)).toEqual(['action-sheet-mark-unread', 'action-sheet-favorite', 'action-sheet-hide']);
	});

	it('keeps favoriting for omnichannel rooms', async () => {
		const sheet = await longPressRow('l');

		expect(optionTestIDs(sheet)).toEqual(['action-sheet-mark-unread', 'action-sheet-favorite', 'action-sheet-hide']);
	});
});
